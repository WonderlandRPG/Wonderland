"use server";

import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { getCharacterSheet } from "@/lib/content/characters";
import { toArenaCharacter } from "@/lib/game/arena-character";
import {
  buildDungeonTurnOrder,
  createDungeonMonster,
  type DungeonBattleState,
} from "@/lib/game/dungeon-combat";
import { firstDungeon } from "@/lib/game/dungeons";
import {
  defaultCombatRules,
  applyDamage,
  calculateDamage,
  getEffectiveAttributes,
  guardCombatant,
  resolveBasicAttack,
  resolveAreaSkill,
  resolveRaceAbility,
  resolveSkill,
  tickCooldowns,
} from "@/lib/game/combat";
import { resolvePeriodicItemDamage } from "@/lib/game/item-effects";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/db/types";
import { appendBattleLog } from "@/lib/game/turn-engine";

const idSchema = z.uuid();
const actionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("basic") }),
  z.object({ kind: z.literal("defend") }),
  z.object({ kind: z.literal("class"), key: z.string() }),
  z.object({ kind: z.literal("race"), key: z.string() }),
  z.object({ kind: z.literal("item"), id: z.uuid() }),
]);

type Snapshot = {
  runId: string;
  version: number;
  state: DungeonBattleState;
  status: string;
  forced: boolean;
};

function snapshot(value: unknown): Snapshot | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return typeof row.runId === "string" &&
    typeof row.version === "number" &&
    row.state &&
    typeof row.state === "object"
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
  const living = state.turnOrder.filter((id) =>
    id === state.monster.id ? state.monster.hp > 0 : (state.fighters[id]?.hp ?? 0) > 0,
  );
  if (!living.length) return;
  const index = Math.max(0, living.indexOf(state.activeCharacterId));
  const nextIndex = (index + 1) % living.length;
  if (nextIndex === 0) state.round += 1;
  state.turn += 1;
  state.turnOrder = living;
  state.activeCharacterId = living[nextIndex];
}

function resolveMonsterTurn(state: DungeonBattleState) {
  if (state.status !== "active" || state.activeCharacterId !== state.monster.id) return "";
  const alive = state.partyOrder.filter((id) => state.fighters[id]?.hp > 0);
  if (!alive.length) {
    state.status = "defeat";
    return "O grupo inteiro caiu. A expedição fracassou.";
  }

  const targetId = [...alive].sort(
    (left, right) =>
      state.fighters[left].hp / state.fighters[left].maxHp -
      state.fighters[right].hp / state.fighters[right].maxHp,
  )[0];
  const target = state.fighters[targetId];
  const abilities = firstDungeon.encounters[state.encounterIndex].abilities;
  const ability =
    state.monster.hp < state.monster.maxHp * 0.4 &&
    abilities.some((name) => name.includes("Regeneração") || name.includes("Banquete"))
      ? abilities.find((name) => name.includes("Regeneração") || name.includes("Banquete"))!
      : state.monster.shield === 0 && abilities.some((name) => name.includes("Muralha"))
        ? abilities.find((name) => name.includes("Muralha"))!
        : abilities[(state.turn + state.encounterIndex) % abilities.length];

  const power = Math.max(12, Math.round(getEffectiveAttributes(state.monster).INT * 0.42));
  let message = "";
  if (ability.includes("Regeneração") || ability.includes("Banquete")) {
    const healed = Math.min(Math.round(power * 0.7), state.monster.maxHp - state.monster.hp);
    state.monster = { ...state.monster, hp: state.monster.hp + healed };
    message = `${state.monster.name} usou ${ability} e recuperou ${healed} de HP.`;
  } else if (ability.includes("Muralha")) {
    const shield = Math.max(20, Math.round(power * 0.75));
    state.monster = { ...state.monster, shield: state.monster.shield + shield };
    message = `${state.monster.name} usou ${ability} e recebeu ${shield} de escudo.`;
  } else {
    const amount = calculateDamage(power, "magic", getEffectiveAttributes(target), defaultCombatRules);
    const damaged = applyDamage(target, amount);
    const dealt = target.hp + target.shield - (damaged.hp + damaged.shield);
    state.fighters[targetId] = damaged;
    message = `${state.monster.name} usou ${ability} em ${target.name}, causando ${dealt} de dano mágico.${dealt === 0 ? " O golpe foi bloqueado." : ""}`;
  }

  const periodic = resolvePeriodicItemDamage(state.monster, (amount, type) =>
    calculateDamage(amount, type, getEffectiveAttributes(state.monster), defaultCombatRules),
  );
  state.monster = tickCooldowns(periodic.combatant);
  if (periodic.messages.length) message += ` ${periodic.messages.join(" ")}`;
  if (state.partyOrder.every((id) => (state.fighters[id]?.hp ?? 0) <= 0)) {
    state.status = "defeat";
    return `${message} O grupo inteiro caiu. A expedição fracassou.`;
  }
  return message;
}

export async function performDungeonAction(runId: string, expectedVersion: number, input: unknown) {
  const account = await requireAdministrativeAccount();
  const parsed = idSchema.safeParse(runId);
  const action = actionSchema.safeParse(input);
  if (!parsed.success || !action.success) return { ok: false as const, message: "Ação inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data } = await client.rpc("v2_get_dungeon_run", { p_run_id: parsed.data });
  const room = snapshot(data);
  if (!room || room.state.status !== "active")
    return { ok: false as const, message: "Este combate já terminou." };
  if (room.version !== expectedVersion) return { ok: true as const, data: room };

  const state = structuredClone(room.state);
  const actorId = state.activeCharacterId;
  if (actorId === state.monster.id)
    return { ok: false as const, message: "O monstro está executando o turno dele." };
  const sheet = await getCharacterSheet(actorId);
  if (!sheet || sheet.user_id !== account.id)
    return { ok: false as const, message: "Aguarde o turno do outro aventureiro." };

  const character = toArenaCharacter(sheet);
  let actor = state.fighters[actorId];
  let monster = state.monster;
  let message = "";

  if (action.data.kind === "basic") {
    const result = resolveBasicAttack(actor, monster, defaultCombatRules);
    actor = result.actor;
    monster = result.target;
    message = result.event.message;
  } else if (action.data.kind === "defend") {
    if ((actor.cooldowns["defesa-total"] ?? 0) > 0)
      return { ok: false as const, message: "Defesa Total ainda está em recarga." };
    actor = guardCombatant(actor);
    message = `${actor.name} assumiu Defesa Total.`;
  } else if (action.data.kind === "item") {
    const item = character.items.find((entry) => entry.id === action.data.id);
    if (!item) return { ok: false as const, message: "Item indisponível." };
    const healed = Math.min(Math.max(25, Math.round(actor.maxHp * 0.25)), actor.maxHp - actor.hp);
    actor = { ...actor, hp: actor.hp + healed };
    message = `${actor.name} usou ${item.name} e recuperou ${healed} de HP.`;
  } else {
    const list = action.data.kind === "class" ? character.skills : character.raceAbilities;
    const skill = list.find((entry) => entry.key === action.data.key);
    if (!skill) return { ok: false as const, message: "Habilidade indisponível." };
    const result =
      skill.area > 0
        ? (() => {
            const area = resolveAreaSkill(actor, [monster], skill, defaultCombatRules);
            return { actor: area.actor, target: area.targets[0], event: area.events[0] };
          })()
        : action.data.kind === "class"
          ? resolveSkill(actor, monster, skill, defaultCombatRules)
          : resolveRaceAbility(actor, monster, skill, defaultCombatRules);
    if (result.event.kind === "error") return { ok: false as const, message: result.event.message };
    actor = result.actor;
    monster = result.target;
    message = result.event.message;
  }

  const periodicActor = resolvePeriodicItemDamage(actor, (amount, type) =>
    calculateDamage(amount, type, getEffectiveAttributes(actor), defaultCombatRules),
  );
  state.fighters[actorId] = tickCooldowns(periodicActor.combatant);
  state.monster = monster;
  if (periodicActor.messages.length) message += ` ${periodicActor.messages.join(" ")}`;

  const partySheets = (await Promise.all(state.partyOrder.map((id) => getCharacterSheet(id))))
    .filter(Boolean)
    .map((entry) => toArenaCharacter(entry!));

  if (state.monster.hp <= 0) {
    if (state.encounterIndex === firstDungeon.encounters.length - 1) {
      state.status = "victory";
      message = `${state.monster.name} foi derrotado. A Dungeon foi concluída!`;
    } else {
      state.encounterIndex += 1;
      state.monster = createDungeonMonster(partySheets, state.encounterIndex);
      state.turnOrder = buildDungeonTurnOrder(state.fighters, state.monster);
      state.activeCharacterId = state.turnOrder[0];
      state.round += 1;
      state.turn += 1;
      message += ` O grupo avançou e encontrou ${state.monster.name}.`;
    }
  } else {
    advance(state);
  }

  if (state.status === "active" && state.activeCharacterId === state.monster.id) {
    const monsterMessage = resolveMonsterTurn(state);
    if (monsterMessage) message += ` ${monsterMessage}`;
    if (state.status === "active") advance(state);
  }

  state.message = message;
  state.log = appendBattleLog(state.log, message, 60);
  const { data: updated, error } = await client.rpc("v2_update_dungeon_run", {
    p_run_id: parsed.data,
    p_expected_version: room.version,
    p_state: state as unknown as Json,
  });
  const next = snapshot(updated);
  return error || !next
    ? { ok: false as const, message: error?.message ?? "Não foi possível registrar a ação." }
    : { ok: true as const, data: next };
}
