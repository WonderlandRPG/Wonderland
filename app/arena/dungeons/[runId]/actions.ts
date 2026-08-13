"use server";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { getCharacterSheet } from "@/lib/content/characters";
import { toArenaCharacter } from "@/lib/game/arena-character";
import { createDungeonMonster, type DungeonBattleState } from "@/lib/game/dungeon-combat";
import { firstDungeon } from "@/lib/game/dungeons";
import {
  defaultCombatRules,
  applyDamage,
  getEffectiveAttributes,
  guardCombatant,
  resolveBasicAttack,
  resolveRaceAbility,
  resolveSkill,
  tickCooldowns,
} from "@/lib/game/combat";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/db/types";

const idSchema = z.uuid();
const actionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("basic") }),
  z.object({ kind: z.literal("defend") }),
  z.object({ kind: z.literal("class"), key: z.string() }),
  z.object({ kind: z.literal("race"), key: z.string() }),
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
export async function performDungeonAction(runId: string, expectedVersion: number, input: unknown) {
  const account = await requireAdministrativeAccount();
  const parsed = idSchema.safeParse(runId),
    action = actionSchema.safeParse(input);
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
  const sheet = await getCharacterSheet(actorId);
  if (!sheet || sheet.user_id !== account.id)
    return { ok: false as const, message: "Aguarde o turno do outro aventureiro." };
  const character = toArenaCharacter(sheet);
  const actor = state.fighters[actorId],
    monster = state.monster;
  let result;
  if (action.data.kind === "basic") result = resolveBasicAttack(actor, monster, defaultCombatRules);
  else if (action.data.kind === "defend") {
    result = {
      actor: guardCombatant(actor),
      target: monster,
      event: {
        kind: "utility" as const,
        amount: 0,
        message: `${actor.name} assumiu postura defensiva.`,
      },
    };
  } else {
    const skillKey = action.data.key;
    const skill = (action.data.kind === "class" ? character.skills : character.raceAbilities).find(
      (entry) => entry.key === skillKey,
    );
    if (!skill) return { ok: false as const, message: "Habilidade indisponível." };
    result =
      action.data.kind === "class"
        ? resolveSkill(actor, monster, skill, defaultCombatRules)
        : resolveRaceAbility(actor, monster, skill, defaultCombatRules);
  }
  if (result.event.kind === "error") return { ok: false as const, message: result.event.message };
  state.fighters[actorId] = result.actor;
  state.monster = result.target;
  let message = result.event.message;
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
      message += ` O grupo avançou e encontrou ${state.monster.name}.`;
    }
  }
  if (state.status === "active" && state.monster.hp > 0) {
    const alive = state.partyOrder.filter((id) => state.fighters[id].hp > 0);
    const targetId = [...alive].sort(
      (left, right) =>
        state.fighters[left].hp / state.fighters[left].maxHp -
        state.fighters[right].hp / state.fighters[right].maxHp,
    )[0];
    const target = state.fighters[targetId];
    const intelligence = getEffectiveAttributes(state.monster).INT;
    const abilities = firstDungeon.encounters[state.encounterIndex].abilities;
    const ability =
      state.monster.hp < state.monster.maxHp * 0.4 &&
      abilities.some((name) => name.includes("Regeneração") || name.includes("Banquete"))
        ? abilities.find((name) => name.includes("Regeneração") || name.includes("Banquete"))!
        : state.monster.shield === 0 && abilities.some((name) => name.includes("Muralha"))
          ? abilities.find((name) => name.includes("Muralha"))!
          : abilities[(state.round + state.encounterIndex) % abilities.length];
    const damage = Math.max(
      12,
      Math.round(
        intelligence *
          (ability.includes("Regeneração") || ability.includes("Muralha") ? 0.18 : 0.42),
      ),
    );
    if (ability.includes("Regeneração") || ability.includes("Banquete")) {
      const healed = Math.min(damage, state.monster.maxHp - state.monster.hp);
      state.monster = { ...state.monster, hp: state.monster.hp + healed };
      message += ` ${state.monster.name} usou ${ability} e recuperou ${healed} de HP.`;
    } else if (ability.includes("Muralha")) {
      state.monster = { ...state.monster, shield: state.monster.shield + damage };
      message += ` ${state.monster.name} usou ${ability} e recebeu ${damage} de escudo.`;
    } else {
      state.fighters[targetId] = applyDamage(target, damage);
      message += ` ${state.monster.name} usou ${ability} em ${target.name}, causando ${damage} de dano.`;
    }
    if (alive.every((id) => state.fighters[id].hp <= 0)) {
      state.status = "defeat";
      message = "O grupo inteiro caiu. A expedição fracassou.";
    }
  }
  if (state.status === "active") {
    const alive = state.partyOrder.filter((id) => state.fighters[id].hp > 0);
    const current = alive.indexOf(actorId);
    state.activeCharacterId = alive[(current + 1) % alive.length];
    if (current === alive.length - 1) state.round += 1;
    state.fighters[state.activeCharacterId] = tickCooldowns(
      state.fighters[state.activeCharacterId],
    );
  }
  state.message = message;
  state.log = [...state.log, message].slice(-40);
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
