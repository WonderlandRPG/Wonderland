"use server";

import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { getCharacterSheet } from "@/lib/content/characters";
import { toArenaCharacter } from "@/lib/game/arena-character";
import { buildDungeonTurnOrder, createDungeonMonster, type DungeonBattleState } from "@/lib/game/dungeon-combat";
import { firstDungeon } from "@/lib/game/dungeons";
import {
  defaultCombatRules,
  applyDamage,
  calculateDamage,
  getEffectiveAttributes,
  resolveBasicAttack,
  tickCooldowns,
} from "@/lib/game/combat";
import { resolvePeriodicItemDamage } from "@/lib/game/item-effects";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/db/types";
import {
  appendBattleLog,
  createTurnActionUsage,
  hasUsedAllCoreActions,
  getForcedTargetId,
  isSilenced,
  isTurnBlocked,
  type TurnActionUsage,
} from "@/lib/game/turn-engine";
import { resolveJrpgAreaSkill, resolveJrpgSkill } from "@/lib/game/jrpg-skill";
import { applyEventResourceGeneration, applyResourceTrigger } from "@/lib/game/combat-resources";
import type { ArenaCharacter } from "@/lib/game/arena-types";

const idSchema = z.uuid();
const targetSchema = z.uuid().optional();
const actionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("basic") }),
  z.object({ kind: z.literal("class"), key: z.string(), targetId: targetSchema }),
  z.object({ kind: z.literal("race"), key: z.string(), targetId: targetSchema }),
  z.object({ kind: z.literal("item"), id: z.uuid() }),
  z.object({ kind: z.literal("end") }),
]);

type Snapshot = { runId: string; version: number; state: DungeonBattleState; status: string; forced: boolean };
type ResourceEvent = { kind: "damage" | "heal" | "shield" | "utility" | "error"; amount: number };
type PartyMetadata = Record<string, ArenaCharacter>;

function snapshot(value: unknown): Snapshot | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return typeof row.runId === "string" && typeof row.version === "number" && row.state && typeof row.state === "object"
    ? (row as unknown as Snapshot)
    : null;
}

export async function getDungeonRunAction(runId: string) {
  await requireAdministrativeAccount();
  const parsed = idSchema.safeParse(runId);
  if (!parsed.success) return { ok: false as const, message: "Expedição inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data, error } = await client.rpc("v2_get_dungeon_run", { p_run_id: parsed.data });
  const room = snapshot(data);
  return error || !room
    ? { ok: false as const, message: error?.message ?? "Sala indisponível." }
    : { ok: true as const, data: room };
}

function advance(state: DungeonBattleState) {
  const living = state.turnOrder.filter((id) => id === state.monster.id ? state.monster.hp > 0 : (state.fighters[id]?.hp ?? 0) > 0);
  if (!living.length) return;
  const index = Math.max(0, living.indexOf(state.activeCharacterId));
  const nextIndex = (index + 1) % living.length;
  state.turn += 1;
  state.turnActions = createTurnActionUsage();
  if (nextIndex === 0) {
    state.round += 1;
    const refreshed = buildDungeonTurnOrder(state.fighters, state.monster);
    state.turnOrder = refreshed;
    state.activeCharacterId = refreshed[0] ?? state.activeCharacterId;
  } else {
    state.turnOrder = living;
    state.activeCharacterId = living[nextIndex];
  }
}

function resolveMonsterTurn(state: DungeonBattleState, partyMetadata: PartyMetadata) {
  const alive = state.partyOrder.filter((id) => state.fighters[id]?.hp > 0);
  if (!alive.length) {
    state.status = "defeat";
    return "O grupo inteiro caiu. A expedição fracassou.";
  }
  const forced = getForcedTargetId(state.monster);
  const targetId = forced && alive.includes(forced)
    ? forced
    : [...alive].sort((a, b) => {
        const left = state.fighters[a];
        const right = state.fighters[b];
        const leftThreat = (getEffectiveAttributes(left).FOR + getEffectiveAttributes(left).INT + getEffectiveAttributes(left).ARC * 0.8) / Math.max(1, left.maxHp);
        const rightThreat = (getEffectiveAttributes(right).FOR + getEffectiveAttributes(right).INT + getEffectiveAttributes(right).ARC * 0.8) / Math.max(1, right.maxHp);
        const leftScore = left.hp / left.maxHp - leftThreat * 0.25 + left.shield / Math.max(1, left.maxHp) * 0.2;
        const rightScore = right.hp / right.maxHp - rightThreat * 0.25 + right.shield / Math.max(1, right.maxHp) * 0.2;
        return leftScore - rightScore;
      })[0];
  const target = state.fighters[targetId];
  const abilities = firstDungeon.encounters[state.encounterIndex].abilities;
  const ability = state.monster.hp < state.monster.maxHp * 0.58 && abilities.some((name) => name.includes("Regeneração") || name.includes("Banquete"))
    ? abilities.find((name) => name.includes("Regeneração") || name.includes("Banquete"))!
    : state.monster.shield === 0 && abilities.some((name) => name.includes("Muralha"))
      ? abilities.find((name) => name.includes("Muralha"))!
      : abilities[(state.turn + state.encounterIndex) % abilities.length];
  const monsterStats = getEffectiveAttributes(state.monster);
  const power = Math.max(18, Math.round(Math.max(monsterStats.INT, monsterStats.FOR * 0.85) * (0.56 + state.encounterIndex * 0.04)));
  let message = "";
  if (ability.includes("Regeneração") || ability.includes("Banquete")) {
    const healed = Math.min(Math.round(power * 1.05), state.monster.maxHp - state.monster.hp);
    state.monster = { ...state.monster, hp: state.monster.hp + healed };
    message = `${state.monster.name} usou ${ability} e recuperou ${healed} de HP.`;
  } else if (ability.includes("Muralha")) {
    const shield = Math.max(30, Math.round(power * 1.1));
    state.monster = { ...state.monster, shield: state.monster.shield + shield };
    message = `${state.monster.name} usou ${ability} e recebeu ${shield} de escudo.`;
  } else {
    const amount = calculateDamage(power, "magic", getEffectiveAttributes(target), defaultCombatRules);
    const damaged = applyDamage(target, amount);
    const dealt = target.hp + target.shield - (damaged.hp + damaged.shield);
    const meta = partyMetadata[targetId];
    state.fighters[targetId] = meta && dealt > 0 ? applyResourceTrigger(damaged, meta, "DAMAGE_TAKEN") : damaged;
    message = `${state.monster.name} usou ${ability} em ${target.name}, causando ${dealt} de dano mágico.${dealt === 0 ? " O golpe foi bloqueado." : ""}`;
  }
  const periodic = resolvePeriodicItemDamage(state.monster, (amount, type) => calculateDamage(amount, type, getEffectiveAttributes(state.monster), defaultCombatRules));
  state.monster = tickCooldowns(periodic.combatant);
  if (periodic.messages.length) message += ` ${periodic.messages.join(" ")}`;
  if (state.partyOrder.every((id) => (state.fighters[id]?.hp ?? 0) <= 0)) {
    state.status = "defeat";
    return `${message} O grupo inteiro caiu. A expedição fracassou.`;
  }
  return message;
}

function settleAutomaticTurns(state: DungeonBattleState, partyMetadata: PartyMetadata) {
  const messages: string[] = [];
  for (let safety = 0; safety < state.turnOrder.length * 2 && state.status === "active"; safety += 1) {
    if (state.activeCharacterId === state.monster.id) {
      if (isTurnBlocked(state.monster)) {
        messages.push(`${state.monster.name} está incapacitado e perdeu o turno.`);
        state.monster = tickCooldowns(state.monster);
      } else messages.push(resolveMonsterTurn(state, partyMetadata));
      if (state.status === "active") advance(state);
      continue;
    }
    const fighter = state.fighters[state.activeCharacterId];
    if (fighter && isTurnBlocked(fighter)) {
      messages.push(`${fighter.name} está incapacitado e perdeu o turno.`);
      state.fighters[fighter.id] = tickCooldowns(fighter);
      advance(state);
      continue;
    }
    break;
  }
  return messages.filter(Boolean);
}

function remainingActions(usage: TurnActionUsage) {
  return [!usage.basic ? "Ataque" : null, !usage.class ? "Classe" : null, !usage.race ? "Raça" : null].filter(Boolean).join(" + ");
}

function livingParty(state: DungeonBattleState) {
  return state.partyOrder.filter((id) => (state.fighters[id]?.hp ?? 0) > 0);
}

export async function performDungeonAction(runId: string, expectedVersion: number, input: unknown) {
  const account = await requireAdministrativeAccount();
  const parsed = idSchema.safeParse(runId);
  const action = actionSchema.safeParse(input);
  if (!parsed.success || !action.success) return { ok: false as const, message: "Ação inválida." };
  const actionData = action.data;
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data } = await client.rpc("v2_get_dungeon_run", { p_run_id: parsed.data });
  const room = snapshot(data);
  if (!room || room.state.status !== "active") return { ok: false as const, message: "Este combate já terminou." };
  if (room.version !== expectedVersion) return { ok: true as const, data: room };

  const state = structuredClone(room.state);
  const actorId = state.activeCharacterId;
  if (actorId === state.monster.id) return { ok: false as const, message: "O monstro está executando o turno dele." };

  const sheets = (await Promise.all(state.partyOrder.map((id) => getCharacterSheet(id)))).filter(Boolean);
  const partyCharacters = sheets.map((entry) => toArenaCharacter(entry!));
  const partyMetadata: PartyMetadata = Object.fromEntries(partyCharacters.map((entry) => [entry.id, entry]));
  const sheet = sheets.find((entry) => entry!.id === actorId);
  if (!sheet || sheet.user_id !== account.id) return { ok: false as const, message: "Aguarde o turno do outro aventureiro." };

  const character = partyMetadata[actorId];
  let actor = state.fighters[actorId];
  actor = { ...actor, basicAttackDamageType: character.basicAttackDamageType };
  let monster = state.monster;
  let message = "";
  let resourceEvent: ResourceEvent | null = null;
  let areaAction = false;
  let targetIsAlly = false;
  let affectedAllyId: string | null = null;
  const usage = state.turnActions ?? createTurnActionUsage();
  const nextUsage = { ...usage };
  let endsTurn = actionData.kind === "item" || actionData.kind === "end";

  if (actionData.kind === "basic") {
    if (usage.basic) return { ok: false as const, message: "O Ataque Básico já foi usado neste turno." };
    const result = resolveBasicAttack(actor, monster, defaultCombatRules);
    actor = result.actor;
    monster = result.target;
    resourceEvent = result.event;
    message = result.event.message;
    nextUsage.basic = true;
  } else if (actionData.kind === "item") {
    const item = character.items.find((entry) => entry.id === actionData.id);
    if (!item) return { ok: false as const, message: "Item indisponível." };
    const healed = Math.min(Math.max(25, Math.round(actor.maxHp * 0.25)), actor.maxHp - actor.hp);
    actor = { ...actor, hp: actor.hp + healed };
    message = `${actor.name} usou ${item.name} e recuperou ${healed} de HP.`;
  } else if (actionData.kind === "end") {
    message = `${actor.name} encerrou sua sequência.`;
  } else {
    if (usage[actionData.kind]) return { ok: false as const, message: `${actionData.kind === "class" ? "A habilidade de classe" : "A habilidade racial"} já foi usada neste turno.` };
    if (isSilenced(actor)) return { ok: false as const, message: `${actor.name} está silenciado e não pode usar habilidades.` };
    const list = actionData.kind === "class" ? character.skills : character.raceAbilities;
    const skill = list.find((entry) => entry.key === actionData.key);
    if (!skill) return { ok: false as const, message: "Habilidade indisponível." };
    areaAction = skill.area > 0;
    targetIsAlly = skill.target === "self" || skill.target === "ally" || skill.operations[0]?.target === "ally" || skill.operations[0]?.target === "self";

    if (areaAction && targetIsAlly) {
      const ids = livingParty(state);
      const area = resolveJrpgAreaSkill(actor, ids.map((id) => state.fighters[id]), skill, defaultCombatRules);
      if (area.events[0]?.kind === "error") return { ok: false as const, message: area.events[0].message };
      actor = area.actor;
      area.targets.forEach((changed) => { state.fighters[changed.id] = changed; });
      resourceEvent = area.events[0] ?? null;
      message = area.events.map((event) => event.message).join(" ");
    } else if (targetIsAlly) {
      const targetId = skill.target === "self" ? actorId : (actionData.targetId ?? actorId);
      if (!livingParty(state).includes(targetId)) return { ok: false as const, message: "O aliado escolhido não é um alvo válido." };
      const ally = state.fighters[targetId];
      const result = resolveJrpgSkill(actor, ally, skill, defaultCombatRules);
      if (result.event.kind === "error") return { ok: false as const, message: result.event.message };
      actor = result.actor;
      state.fighters[targetId] = result.target;
      affectedAllyId = targetId;
      resourceEvent = result.event;
      message = result.event.message;
    } else {
      const targetId = actionData.targetId ?? monster.id;
      if (targetId !== monster.id) return { ok: false as const, message: "O alvo escolhido não é válido para esta habilidade." };
      const result = areaAction
        ? (() => { const area = resolveJrpgAreaSkill(actor, [monster], skill, defaultCombatRules); return { actor: area.actor, target: area.targets[0], event: area.events[0] }; })()
        : resolveJrpgSkill(actor, monster, skill, defaultCombatRules);
      if (!result.target || !result.event || result.event.kind === "error") return { ok: false as const, message: result.event?.message ?? "A habilidade falhou." };
      actor = result.actor;
      monster = result.target;
      resourceEvent = result.event;
      message = result.event.message;
    }
    nextUsage[actionData.kind] = true;
  }

  if (resourceEvent && !targetIsAlly) {
    const generated = applyEventResourceGeneration({ actor, target: monster, actorCharacter: character, event: resourceEvent, area: areaAction });
    actor = generated.actor;
    monster = generated.target;
  } else if (resourceEvent && affectedAllyId) {
    const ally = state.fighters[affectedAllyId];
    const generated = applyEventResourceGeneration({ actor, target: ally, actorCharacter: character, targetCharacter: partyMetadata[affectedAllyId], event: resourceEvent, area: areaAction });
    actor = generated.actor;
    state.fighters[affectedAllyId] = generated.target;
  }

  state.fighters[actorId] = actor;
  state.monster = monster;
  state.turnActions = nextUsage;
  endsTurn = endsTurn || hasUsedAllCoreActions(nextUsage);

  if (state.monster.hp <= 0) {
    if (state.encounterIndex === firstDungeon.encounters.length - 1) {
      state.status = "victory";
      message = `${state.monster.name} foi derrotado. A Dungeon foi concluída!`;
    } else {
      state.encounterIndex += 1;
      state.monster = createDungeonMonster(partyCharacters, state.encounterIndex);
      state.turnOrder = buildDungeonTurnOrder(state.fighters, state.monster);
      state.activeCharacterId = state.turnOrder[0];
      state.turnActions = createTurnActionUsage();
      state.round += 1;
      state.turn += 1;
      message += ` O grupo avançou e encontrou ${state.monster.name}.`;
    }
  } else if (endsTurn) {
    const periodicActor = resolvePeriodicItemDamage(actor, (amount, type) => calculateDamage(amount, type, getEffectiveAttributes(actor), defaultCombatRules));
    state.fighters[actorId] = tickCooldowns(periodicActor.combatant);
    if (periodicActor.messages.length) message += ` ${periodicActor.messages.join(" ")}`;
    advance(state);
  } else message = `${message} Ações restantes: ${remainingActions(nextUsage)}.`;

  if (state.status === "active" && endsTurn) {
    const automatic = settleAutomaticTurns(state, partyMetadata);
    if (automatic.length) message += ` ${automatic.join(" ")}`;
  }

  state.message = message;
  state.log = appendBattleLog(state.log, message, 60);
  const { data: updated, error } = await client.rpc("v2_update_dungeon_run", { p_run_id: parsed.data, p_expected_version: room.version, p_state: state as unknown as Json });
  const next = snapshot(updated);
  return error || !next
    ? { ok: false as const, message: error?.message ?? "Não foi possível registrar a ação." }
    : { ok: true as const, data: next };
}
