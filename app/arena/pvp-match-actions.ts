"use server";

import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheet, getPvpOpponentSheet } from "@/lib/content/characters";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toArenaCharacter } from "@/lib/game/arena-character";
import {
  defaultCombatRules,
  calculateDamage,
  getEffectiveAttributes,
  guardCombatant,
  resolveBasicAttack,
  tickCooldowns,
} from "@/lib/game/combat";
import { resolvePeriodicItemDamage } from "@/lib/game/item-effects";
import type { PvpBattleState, PvpRoomSnapshot } from "@/lib/game/arena-types";
import type { Json } from "@/lib/db/types";
import {
  appendBattleLog,
  createTurnActionUsage,
  getNextTurn,
  hasUsedAllCoreActions,
  isSilenced,
  isTurnBlocked,
  type TurnActionUsage,
} from "@/lib/game/turn-engine";
import { resolveJrpgAreaSkill, resolveJrpgSkill } from "@/lib/game/jrpg-skill";
import { applyEventResourceGeneration } from "@/lib/game/combat-resources";

const matchSchema = z.uuid();
const actionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("basic") }),
  z.object({ kind: z.literal("defend") }),
  z.object({ kind: z.literal("race"), key: z.string().min(1).max(160) }),
  z.object({ kind: z.literal("class"), key: z.string().min(1).max(160) }),
  z.object({ kind: z.literal("item"), id: z.uuid() }),
  z.object({ kind: z.literal("end") }),
]);

type ResourceEvent = {
  kind: "damage" | "heal" | "shield" | "utility" | "error";
  amount: number;
};

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
  ) return null;
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

function advancePvpTurn(state: PvpBattleState) {
  const next = getNextTurn(state);
  state.round = next.round;
  state.turn = next.turn;
  state.turnOrder = next.turnOrder;
  state.activeCharacterId = next.activeCharacterId;
  state.turnEndsAt = new Date(Date.now() + 60_000).toISOString();
  state.turnActions = createTurnActionUsage();
}

function skipBlockedTurns(state: PvpBattleState) {
  const messages: string[] = [];
  for (let index = 0; index < state.turnOrder.length; index += 1) {
    const fighter = state.fighters[state.activeCharacterId];
    if (!fighter || !isTurnBlocked(fighter)) break;
    messages.push(`${fighter.name} está incapacitado e perdeu o turno.`);
    state.fighters[fighter.id] = tickCooldowns(fighter);
    advancePvpTurn(state);
  }
  return messages;
}

function remainingActions(usage: TurnActionUsage) {
  return [
    !usage.basic ? "Ataque" : null,
    !usage.class ? "Classe" : null,
    !usage.race ? "Raça" : null,
  ].filter(Boolean).join(" + ");
}

export async function performPvpAction(matchId: string, expectedVersion: number, input: unknown) {
  await requireCurrentAccount(`/arena?modo=pvp&partida=${matchId}`);
  const id = matchSchema.safeParse(matchId);
  const action = actionSchema.safeParse(input);
  if (!id.success || !action.success) return { ok: false as const, message: "Comando inválido." };

  const { client, room } = await readRoom(id.data);
  if (!client || !room) return { ok: false as const, message: "Sala PvP indisponível." };
  if (room.version !== expectedVersion)
    return { ok: true as const, data: room, synchronized: true as const };

  const state: PvpBattleState = structuredClone(room.state);
  const ownId = room.ownCharacterId;
  const enemyId = room.opponentCharacterId;
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
  const opponentCharacter = toArenaCharacter(opponentSheet);
  let actor = state.fighters[ownId];
  let target = state.fighters[enemyId];
  if (!actor || !target)
    return { ok: false as const, message: "Estado da batalha inválido." };

  let message = "";
  let resourceEvent: ResourceEvent | null = null;
  let areaAction = false;
  const actionData = action.data;
  const usage = state.turnActions ?? createTurnActionUsage();
  let nextUsage = { ...usage };
  let endsTurn = actionData.kind === "end" || actionData.kind === "defend" || actionData.kind === "item";

  if (actionData.kind === "basic") {
    if (usage.basic) return { ok: false as const, message: "O Ataque Básico já foi usado neste turno.", data: room };
    const result = resolveBasicAttack(actor, target, defaultCombatRules);
    actor = result.actor;
    target = result.target;
    resourceEvent = result.event;
    message = result.event.message;
    nextUsage.basic = true;
  } else if (actionData.kind === "defend") {
    if ((actor.cooldowns["defesa-total"] ?? 0) > 0)
      return { ok: false as const, message: "Defesa Total ainda está em recarga." };
    actor = guardCombatant(actor);
    message = `${actor.name} assumiu Defesa Total.`;
  } else if (actionData.kind === "race" || actionData.kind === "class") {
    if (usage[actionData.kind])
      return { ok: false as const, message: `${actionData.kind === "race" ? "A habilidade racial" : "A habilidade de classe"} já foi usada neste turno.`, data: room };
    if (isSilenced(actor))
      return { ok: false as const, message: `${actor.name} está silenciado e não pode usar habilidades.` };
    const list = actionData.kind === "race" ? character.raceAbilities : character.skills;
    const skill = list.find((entry) => entry.key === actionData.key);
    if (!skill)
      return { ok: false as const, message: "Habilidade indisponível para este personagem." };
    areaAction = skill.area > 0;
    const result = areaAction
      ? (() => {
          const area = resolveJrpgAreaSkill(actor, [target], skill, defaultCombatRules);
          return { actor: area.actor, target: area.targets[0], event: area.events[0] };
        })()
      : resolveJrpgSkill(actor, target, skill, defaultCombatRules);
    if (result.event.kind === "error") return { ok: false as const, message: result.event.message };
    actor = result.actor;
    target = result.target;
    resourceEvent = result.event;
    message = result.event.message;
    nextUsage[actionData.kind] = true;
  } else if (actionData.kind === "item") {
    const item = character.items.find((entry) => entry.id === actionData.id);
    if (!item) return { ok: false as const, message: "Item indisponível." };
    const healed = Math.min(Math.max(25, Math.round(actor.maxHp * 0.25)), actor.maxHp - actor.hp);
    actor = { ...actor, hp: actor.hp + healed };
    message = `${actor.name} usou ${item.name} e recuperou ${healed} de HP.`;
  } else {
    message = `${actor.name} encerrou a sequência do turno.`;
  }

  if (resourceEvent) {
    const generated = applyEventResourceGeneration({
      actor,
      target,
      actorCharacter: character,
      targetCharacter: opponentCharacter,
      event: resourceEvent,
      area: areaAction,
    });
    actor = generated.actor;
    target = generated.target;
  }

  state.fighters[ownId] = actor;
  state.fighters[enemyId] = target;
  state.turnActions = nextUsage;
  endsTurn = endsTurn || hasUsedAllCoreActions(nextUsage);

  if (target.hp <= 0 || actor.hp <= 0) {
    state.status = "finished";
    state.winnerCharacterId = target.hp <= 0 ? ownId : enemyId;
    message = `${state.fighters[state.winnerCharacterId].name} venceu o duelo.`;
  } else if (endsTurn) {
    const periodic = resolvePeriodicItemDamage(actor, (amount, type) =>
      calculateDamage(amount, type, getEffectiveAttributes(actor), defaultCombatRules),
    );
    state.fighters[ownId] = tickCooldowns(periodic.combatant);
    if (state.fighters[ownId].hp <= 0) {
      state.status = "finished";
      state.winnerCharacterId = enemyId;
      message = `${message} ${target.name} venceu o duelo.`;
    } else {
      advancePvpTurn(state);
      if (periodic.messages.length) message = `${message} ${periodic.messages.join(" ")}`;
      const skipped = skipBlockedTurns(state);
      if (skipped.length) message = `${message} ${skipped.join(" ")}`;
      message = `${message} Turno de ${state.fighters[state.activeCharacterId].name}.`;
    }
  } else {
    message = `${message} Ações restantes: ${remainingActions(nextUsage)}.`;
  }

  state.message = message;
  state.log = appendBattleLog(state.log, message, 60);

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
