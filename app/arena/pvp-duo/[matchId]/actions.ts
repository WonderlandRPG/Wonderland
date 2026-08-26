"use server";

import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getPvpTeamRoster } from "@/lib/content/pvp-team-roster";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  calculateDamage,
  defaultCombatRules,
  getEffectiveAttributes,
  resolveBasicAttack,
  tickCooldowns,
} from "@/lib/game/combat";
import { resolvePeriodicItemDamage } from "@/lib/game/item-effects";
import { resolveJrpgAreaSkill, resolveJrpgSkill } from "@/lib/game/jrpg-skill";
import { applyEventResourceGeneration } from "@/lib/game/combat-resources";
import {
  appendBattleLog,
  buildTurnOrder,
  createTurnActionUsage,
  hasUsedAllCoreActions,
  getForcedTargetId,
  isSilenced,
  isTurnBlocked,
  type TurnActionUsage,
} from "@/lib/game/turn-engine";
import {
  chooseDuoTarget,
  livingTeamMembers,
  opposingTeam,
  type PvpDuoBattleState,
} from "@/lib/game/pvp-duo-state";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { Json } from "@/lib/db/types";

const idSchema = z.uuid();
const targetSchema = z.uuid().optional();
const actionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("basic") }),
  z.object({ kind: z.literal("race"), key: z.string().min(1).max(160), targetId: targetSchema }),
  z.object({ kind: z.literal("class"), key: z.string().min(1).max(160), targetId: targetSchema }),
  z.object({ kind: z.literal("item"), id: z.uuid() }),
  z.object({ kind: z.literal("end") }),
]);

type DuoRoom = {
  matchId: string;
  version: number;
  format: "duo";
  ownCharacterId: string;
  opponentCharacterId: string;
  ownCharacterIds: string[];
  opponentCharacterIds: string[];
  controllableCharacterIds: string[];
  state: PvpDuoBattleState;
};

type ResourceEvent = {
  kind: "damage" | "heal" | "shield" | "utility" | "error";
  amount: number;
};

function parseRoom(value: unknown): DuoRoom | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    row.format !== "duo" ||
    typeof row.matchId !== "string" ||
    typeof row.version !== "number" ||
    !Array.isArray(row.ownCharacterIds) ||
    !Array.isArray(row.opponentCharacterIds) ||
    !Array.isArray(row.controllableCharacterIds) ||
    !row.state || typeof row.state !== "object"
  ) return null;
  return row as unknown as DuoRoom;
}

async function readRoom(matchId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return { client: null, room: null };
  const { data } = await client.rpc("v2_get_pvp_match_state", { p_match_id: matchId });
  return { client, room: parseRoom(data) };
}

export async function getPvpDuoMatchStateAction(matchId: string) {
  await requireCurrentAccount(`/arena/pvp-duo/${matchId}`);
  const parsed = idSchema.safeParse(matchId);
  if (!parsed.success) return { ok: false as const, message: "Partida inválida." };
  const { room } = await readRoom(parsed.data);
  return room
    ? { ok: true as const, data: room }
    : { ok: false as const, message: "A sala 2x2 não está mais disponível." };
}

function metadataMap(members: Array<{ character: ArenaCharacter }>) {
  return Object.fromEntries(members.map((member) => [member.character.id, member.character]));
}

function remainingActions(usage: TurnActionUsage) {
  return [!usage.basic ? "Ataque" : null, !usage.class ? "Classe" : null, !usage.race ? "Raça" : null]
    .filter(Boolean)
    .join(" + ");
}

function advanceTurn(state: PvpDuoBattleState) {
  const current = state.activeCharacterId;
  const living = state.turnOrder.filter((id) => (state.fighters[id]?.hp ?? 0) > 0);
  if (!living.length) return;
  const currentIndex = living.indexOf(current);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % living.length;
  state.turn += 1;
  state.turnActions = createTurnActionUsage();
  state.turnEndsAt = new Date(Date.now() + 60_000).toISOString();

  if (nextIndex === 0) {
    state.round += 1;
    state.turnOrder = buildTurnOrder(
      Object.values(state.fighters)
        .filter((fighter) => fighter.hp > 0)
        .map((fighter) => ({ id: fighter.id, initiative: getEffectiveAttributes(fighter).INI })),
    );
    state.activeCharacterId = state.turnOrder[0];
  } else {
    state.turnOrder = living;
    state.activeCharacterId = living[nextIndex];
  }
}

function skipBlocked(state: PvpDuoBattleState) {
  const messages: string[] = [];
  for (let safety = 0; safety < 4 && state.status === "active"; safety += 1) {
    const fighter = state.fighters[state.activeCharacterId];
    if (!fighter || fighter.hp <= 0 || !isTurnBlocked(fighter)) break;
    messages.push(`${fighter.name} está incapacitado e perdeu o turno.`);
    state.fighters[fighter.id] = tickCooldowns(fighter);
    advanceTurn(state);
  }
  return messages;
}

function chosenTarget(
  state: PvpDuoBattleState,
  actorId: string,
  skill: ArenaCharacter["skills"][number],
  requestedId?: string,
) {
  const ownTeam = state.teamOne.includes(actorId) ? state.teamOne : state.teamTwo;
  const enemyTeam = opposingTeam(state, actorId);
  const livingOwn = livingTeamMembers(state, ownTeam);
  const livingEnemies = livingTeamMembers(state, enemyTeam);

  if (skill.target === "self") return actorId;
  if (skill.target === "ally") {
    const targetId = requestedId ?? actorId;
    return livingOwn.includes(targetId) ? targetId : null;
  }
  if (skill.target === "enemy") {
    const forced = getForcedTargetId(state.fighters[actorId]);
    const targetId = forced && livingEnemies.includes(forced) ? forced : (requestedId ?? chooseDuoTarget(state, actorId));
    return targetId && livingEnemies.includes(targetId) ? targetId : null;
  }
  return null;
}

function areaTargetIds(
  state: PvpDuoBattleState,
  actorId: string,
  skill: ArenaCharacter["skills"][number],
) {
  const operationTarget = skill.operations[0]?.target;
  const allied = operationTarget === "ally" || operationTarget === "self" || operationTarget === "source";
  const team = allied
    ? (state.teamOne.includes(actorId) ? state.teamOne : state.teamTwo)
    : opposingTeam(state, actorId);
  return livingTeamMembers(state, team);
}

export async function performPvpDuoAction(matchId: string, expectedVersion: number, input: unknown) {
  await requireCurrentAccount(`/arena/pvp-duo/${matchId}`);
  const parsedId = idSchema.safeParse(matchId);
  const parsedAction = actionSchema.safeParse(input);
  if (!parsedId.success || !parsedAction.success)
    return { ok: false as const, message: "Comando inválido." };

  const [{ client, room }, roster] = await Promise.all([
    readRoom(parsedId.data),
    getPvpTeamRoster(parsedId.data),
  ]);
  if (!client || !room || !roster || roster.format !== "duo")
    return { ok: false as const, message: "Sala 2x2 indisponível." };
  if (room.version !== expectedVersion)
    return { ok: true as const, data: room, synchronized: true as const };

  const state = structuredClone(room.state) as PvpDuoBattleState;
  if (state.status !== "active")
    return { ok: false as const, message: "Esta batalha já terminou.", data: room };
  const actorId = state.activeCharacterId;
  if (!room.controllableCharacterIds.includes(actorId))
    return { ok: false as const, message: "Aguarde o turno do outro combatente.", data: room };

  const meta = metadataMap(roster.members);
  const character = meta[actorId];
  if (!character) return { ok: false as const, message: "Personagem ativo não encontrado." };

  let actor = state.fighters[actorId];
  actor = { ...actor, basicAttackDamageType: character.basicAttackDamageType };
  const action = parsedAction.data;
  const usage = state.turnActions ?? createTurnActionUsage();
  const nextUsage = { ...usage };
  let endsTurn = action.kind === "item" || action.kind === "end";
  let message = "";
  let resourceEvent: ResourceEvent | null = null;
  let areaAction = false;
  let affectedTargetId: string | null = null;
  let target = state.fighters[chooseDuoTarget(state, actorId) ?? ""];

  if (action.kind === "basic") {
    if (usage.basic) return { ok: false as const, message: "O Ataque Básico já foi usado neste turno." };
    const forced = getForcedTargetId(actor);
    const targetId = forced && (state.fighters[forced]?.hp ?? 0) > 0 ? forced : chooseDuoTarget(state, actorId);
    if (!targetId) return { ok: false as const, message: "Não há alvo adversário disponível." };
    target = state.fighters[targetId];
    const result = resolveBasicAttack(actor, target, defaultCombatRules);
    actor = result.actor;
    target = result.target;
    affectedTargetId = targetId;
    resourceEvent = result.event;
    message = result.event.message;
    nextUsage.basic = true;
  } else if (action.kind === "class" || action.kind === "race") {
    if (usage[action.kind])
      return { ok: false as const, message: "Esta categoria já foi usada neste turno." };
    if (isSilenced(actor)) return { ok: false as const, message: `${actor.name} está silenciado.` };
    const list = action.kind === "class" ? character.skills : character.raceAbilities;
    const skill = list.find((entry) => entry.key === action.key);
    if (!skill) return { ok: false as const, message: "Habilidade indisponível." };

    areaAction = skill.area > 0;
    if (areaAction) {
      const ids = areaTargetIds(state, actorId, skill);
      const targets = ids.map((id) => state.fighters[id]).filter(Boolean);
      const area = resolveJrpgAreaSkill(actor, targets, skill, defaultCombatRules);
      if (area.events[0]?.kind === "error")
        return { ok: false as const, message: area.events[0].message };
      actor = area.actor;
      area.targets.forEach((changed) => { state.fighters[changed.id] = changed; });
      resourceEvent = area.events[0] ?? null;
      message = area.events.map((event) => event.message).filter(Boolean).join(" ");
      affectedTargetId = area.targets[0]?.id ?? null;
      target = affectedTargetId ? state.fighters[affectedTargetId] : actor;
    } else {
      const targetId = chosenTarget(state, actorId, skill, action.targetId);
      if (!targetId)
        return { ok: false as const, message: "O alvo escolhido não é válido para esta habilidade." };
      target = state.fighters[targetId];
      const result = resolveJrpgSkill(actor, target, skill, defaultCombatRules);
      if (result.event.kind === "error")
        return { ok: false as const, message: result.event.message };
      actor = result.actor;
      target = result.target;
      affectedTargetId = targetId;
      resourceEvent = result.event;
      message = result.event.message;
    }
    nextUsage[action.kind] = true;
  } else if (action.kind === "item") {
    const item = character.items.find((entry) => entry.id === action.id);
    if (!item) return { ok: false as const, message: "Item indisponível." };
    const healed = Math.min(Math.max(25, Math.round(actor.maxHp * 0.25)), actor.maxHp - actor.hp);
    actor = { ...actor, hp: actor.hp + healed };
    message = `${actor.name} usou ${item.name} e recuperou ${healed} de HP.`;
  } else {
    message = `${actor.name} encerrou sua sequência.`;
  }

  if (resourceEvent && affectedTargetId && !areaAction) {
    const generated = applyEventResourceGeneration({
      actor,
      target,
      actorCharacter: character,
      targetCharacter: meta[affectedTargetId],
      event: resourceEvent,
      area: false,
    });
    actor = generated.actor;
    target = generated.target;
  }

  state.fighters[actorId] = actor;
  if (affectedTargetId) state.fighters[affectedTargetId] = target;
  state.turnActions = nextUsage;
  endsTurn = endsTurn || hasUsedAllCoreActions(nextUsage);

  const enemyTeam = opposingTeam(state, actorId);
  if (livingTeamMembers(state, enemyTeam).length === 0) {
    state.status = "finished";
    state.winnerCharacterId = actorId;
    message = `${message} A equipe de ${actor.name} venceu o 2x2.`;
  } else if (endsTurn) {
    const periodic = resolvePeriodicItemDamage(actor, (amount, type) =>
      calculateDamage(amount, type, getEffectiveAttributes(actor), defaultCombatRules),
    );
    state.fighters[actorId] = tickCooldowns(periodic.combatant);
    if (periodic.messages.length) message = `${message} ${periodic.messages.join(" ")}`;
    if (state.fighters[actorId].hp <= 0 && livingTeamMembers(state, state.teamOne).length === 0) {
      state.status = "finished";
      state.winnerCharacterId = livingTeamMembers(state, state.teamTwo)[0] ?? affectedTargetId;
    } else if (state.fighters[actorId].hp <= 0 && livingTeamMembers(state, state.teamTwo).length === 0) {
      state.status = "finished";
      state.winnerCharacterId = livingTeamMembers(state, state.teamOne)[0] ?? affectedTargetId;
    } else {
      advanceTurn(state);
      const skipped = skipBlocked(state);
      if (skipped.length) message = `${message} ${skipped.join(" ")}`;
      if (state.status === "active")
        message = `${message} Turno de ${state.fighters[state.activeCharacterId].name}.`;
    }
  } else {
    message = `${message} Ações restantes: ${remainingActions(nextUsage)}.`;
  }

  state.message = message;
  state.log = appendBattleLog(state.log, message, 80);

  const { data, error } = await client.rpc("v2_update_pvp_match_state", {
    p_match_id: parsedId.data,
    p_expected_version: expectedVersion,
    p_state: state as unknown as Json,
  });
  const updated = parseRoom(data);
  if (error || !updated)
    return { ok: false as const, message: error?.message ?? "A jogada não pôde ser sincronizada." };
  return { ok: true as const, data: updated, synchronized: false as const };
}
