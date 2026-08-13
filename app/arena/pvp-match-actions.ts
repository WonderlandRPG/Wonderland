"use server";

import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheet, getPvpOpponentSheet } from "@/lib/content/characters";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toArenaCharacter } from "@/lib/game/arena-character";
import {
  defaultCombatRules,
  getEffectiveAttributes,
  guardCombatant,
  resolveBasicAttack,
  resolveRaceAbility,
  resolveSkill,
  tickCooldowns,
} from "@/lib/game/combat";
import { getMovementRange, tacticalGrid } from "@/lib/game/arena";
import { emptyPvpActions } from "@/lib/game/pvp-state";
import type { ArenaPosition, PvpBattleState, PvpRoomSnapshot } from "@/lib/game/arena-types";
import type { Json } from "@/lib/db/types";
import { resolveSkillMovement } from "@/lib/game/skill-movement";

const matchSchema = z.uuid();
const actionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("move"),
    x: z
      .number()
      .int()
      .min(0)
      .max(tacticalGrid.width - 1),
    y: z
      .number()
      .int()
      .min(0)
      .max(tacticalGrid.height - 1),
  }),
  z.object({ kind: z.literal("basic") }),
  z.object({ kind: z.literal("defend") }),
  z.object({ kind: z.literal("race"), key: z.string().min(1).max(160) }),
  z.object({ kind: z.literal("class"), key: z.string().min(1).max(160) }),
  z.object({ kind: z.literal("item"), id: z.uuid() }),
  z.object({ kind: z.literal("end") }),
]);

function distance(a: ArenaPosition, b: ArenaPosition) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function parseRoom(data: unknown): PvpRoomSnapshot | null {
  if (!data || Array.isArray(data) || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (
    typeof row.matchId !== "string" ||
    typeof row.version !== "number" ||
    typeof row.ownCharacterId !== "string" ||
    typeof row.opponentCharacterId !== "string" ||
    !row.state ||
    typeof row.state !== "object"
  )
    return null;
  return row as unknown as PvpRoomSnapshot;
}

async function readRoom(matchId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return { client: null, room: null };
  const { data } = await client.rpc("v2_get_pvp_match_state", { p_match_id: matchId });
  return { client, room: parseRoom(data) };
}

export async function getPvpMatchStateAction(matchId: string) {
  await requireCurrentAccount(`/arena?modo=pvp&partida=${matchId}`);
  const parsed = matchSchema.safeParse(matchId);
  if (!parsed.success) return { ok: false as const, message: "Partida inválida." };
  const { room } = await readRoom(parsed.data);
  return room
    ? { ok: true as const, data: room }
    : { ok: false as const, message: "A sala PvP não está mais disponível." };
}

export async function performPvpAction(matchId: string, expectedVersion: number, input: unknown) {
  await requireCurrentAccount(`/arena?modo=pvp&partida=${matchId}`);
  const id = matchSchema.safeParse(matchId),
    action = actionSchema.safeParse(input);
  if (!id.success || !action.success) return { ok: false as const, message: "Comando inválido." };
  const actionData = action.data;
  const { client, room } = await readRoom(id.data);
  if (!client || !room) return { ok: false as const, message: "Sala PvP indisponível." };
  if (room.version !== expectedVersion)
    return { ok: true as const, data: room, synchronized: true as const };
  const state: PvpBattleState = structuredClone(room.state);
  const ownId = room.ownCharacterId,
    enemyId = room.opponentCharacterId;
  if (state.status !== "active")
    return { ok: false as const, message: "Este duelo já terminou.", data: room };
  if (state.activeCharacterId !== ownId)
    return { ok: false as const, message: "Aguarde a jogada do adversário.", data: room };
  const [sheet, opponentSheet] = await Promise.all([
    getCharacterSheet(ownId),
    getPvpOpponentSheet(id.data),
  ]);
  if (!sheet || !opponentSheet)
    return { ok: false as const, message: "Não foi possível carregar os combatentes." };
  const character = toArenaCharacter(sheet);
  let actor = state.fighters[ownId],
    target = state.fighters[enemyId];
  const actorPosition = state.positions[ownId],
    targetPosition = state.positions[enemyId];
  if (!actor || !target || !actorPosition || !targetPosition)
    return { ok: false as const, message: "Estado da batalha inválido." };
  let message = "";

  if (actionData.kind === "move") {
    if (state.actions.move || state.actions.defend)
      return { ok: false as const, message: "O movimento desta rodada já foi usado." };
    const destination = { x: actionData.x, y: actionData.y };
    if (
      distance(actorPosition, destination) > getMovementRange(getEffectiveAttributes(actor).INI) ||
      distance(destination, targetPosition) === 0
    )
      return { ok: false as const, message: "Essa casa está fora do alcance." };
    state.positions[ownId] = destination;
    state.actions.move = true;
    message = `${actor.name} moveu-se pelo campo.`;
  } else if (actionData.kind === "basic") {
    if (state.actions.basic || state.actions.defend)
      return { ok: false as const, message: "O ataque básico desta rodada já foi usado." };
    if (distance(actorPosition, targetPosition) > character.basicAttackRange)
      return {
        ok: false as const,
        message: `O alvo está fora do alcance (${character.basicAttackRange} casa(s)).`,
      };
    const result = resolveBasicAttack(actor, target, defaultCombatRules);
    actor = result.actor;
    target = result.target;
    state.actions.basic = true;
    message = result.event.message;
  } else if (actionData.kind === "defend") {
    if (Object.values(state.actions).some(Boolean) || (actor.cooldowns["defesa-total"] ?? 0) > 0)
      return {
        ok: false as const,
        message: "Defender exige a rodada inteira ou ainda está em recarga.",
      };
    actor = guardCombatant(actor);
    state.actions.defend = true;
    message = `${actor.name} assumiu postura defensiva.`;
  } else if (actionData.kind === "race" || actionData.kind === "class") {
    const category = actionData.kind;
    if (state.actions[category] || state.actions.defend)
      return {
        ok: false as const,
        message: `A ação de ${category === "race" ? "raça" : "classe"} já foi usada.`,
      };
    const skill = (category === "race" ? character.raceAbilities : character.skills).find(
      (entry) => entry.key === actionData.key,
    );
    if (!skill)
      return { ok: false as const, message: "Habilidade indisponível para este personagem." };
    if (skill.target !== "self" && distance(actorPosition, targetPosition) > skill.range)
      return { ok: false as const, message: `${skill.name} alcança ${skill.range} casa(s).` };
    const result =
      category === "race"
        ? resolveRaceAbility(actor, target, skill, defaultCombatRules)
        : resolveSkill(actor, target, skill, defaultCombatRules);
    if (result.event.kind === "error") return { ok: false as const, message: result.event.message };
    actor = result.actor;
    target = result.target;
    state.actions[category] = true;
    message = result.event.message;
    const movement = resolveSkillMovement(skill, actorPosition, targetPosition);
    state.positions[ownId] = movement.actor;
    state.positions[enemyId] = movement.target;
  } else if (actionData.kind === "item") {
    if (state.actions.item || state.actions.defend)
      return { ok: false as const, message: "O item desta rodada já foi usado." };
    const item = character.items.find((entry) => entry.id === actionData.id);
    if (!item) return { ok: false as const, message: "Item indisponível." };
    const healed = Math.min(Math.max(25, Math.round(actor.maxHp * 0.25)), actor.maxHp - actor.hp);
    actor = { ...actor, hp: actor.hp + healed };
    state.actions.item = true;
    message = `${actor.name} usou ${item.name} e recuperou ${healed} de HP.`;
  } else {
    actor = tickCooldowns(actor);
    state.turn += 1;
    state.activeCharacterId = enemyId;
    state.actions = { ...emptyPvpActions };
    state.turnEndsAt = new Date(Date.now() + 60_000).toISOString();
    message = `${actor.name} encerrou sua jogada. Turno de ${target.name}.`;
  }
  state.fighters[ownId] = actor;
  state.fighters[enemyId] = target;
  if (target.hp <= 0 || actor.hp <= 0) {
    state.status = "finished";
    state.winnerCharacterId = target.hp <= 0 ? ownId : enemyId;
    message = `${state.fighters[state.winnerCharacterId].name} venceu o duelo.`;
  }
  state.message = message;
  state.log = [...state.log.slice(-39), message];
  const { data, error } = await client.rpc("v2_update_pvp_match_state", {
    p_match_id: id.data,
    p_expected_version: expectedVersion,
    p_state: state as unknown as Json,
  });
  const updated = parseRoom(data);
  if (error || !updated)
    return { ok: false as const, message: error?.message ?? "A ação não pôde ser sincronizada." };
  return { ok: true as const, data: updated, synchronized: false as const };
}
