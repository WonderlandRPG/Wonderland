import { defaultCombatRules, getEffectiveAttributes, type CombatRules } from "@/lib/game/combat";
import { createPvpCombatant } from "@/lib/game/pvp-state";
import type { ArenaCharacter, PvpBattleState } from "@/lib/game/arena-types";
import {
  getOrthogonalNeighbors,
  tacticalPositionKey,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";
import { getTacticalMapById } from "@/lib/game/tactical-maps";
import { buildTurnOrder, createTurnActionUsage } from "@/lib/game/turn-engine";

export const pvpCasualFormats = ["solo", "duo", "trio"] as const;
export type PvpCasualFormat = (typeof pvpCasualFormats)[number];

export const pvpCasualFormatDetails: Record<
  PvpCasualFormat,
  { label: string; teamSize: 1 | 2 | 3; requiredPlayers: 2 | 4 | 6 }
> = {
  solo: { label: "1 × 1", teamSize: 1, requiredPlayers: 2 },
  duo: { label: "2 × 2", teamSize: 2, requiredPlayers: 4 },
  trio: { label: "3 × 3", teamSize: 3, requiredPlayers: 6 },
};

export interface PvpCasualBattleState<
  Format extends PvpCasualFormat = PvpCasualFormat,
> extends PvpBattleState {
  format: Format;
  mapId: string;
  teamOne: string[];
  teamTwo: string[];
  positions: Record<string, TacticalPosition>;
  movement: number;
}

function collectFormation(
  start: TacticalPosition,
  size: number,
  mapId: string,
  reserved: ReadonlySet<string>,
) {
  const map = getTacticalMapById(mapId);
  const blocked = new Set([...map.obstacles, ...reserved]);
  const visited = new Set<string>();
  const queue = [start];
  const formation: TacticalPosition[] = [];

  while (queue.length && formation.length < size) {
    const position = queue.shift()!;
    const key = tacticalPositionKey(position);
    if (visited.has(key)) continue;
    visited.add(key);
    if (!blocked.has(key)) formation.push(position);

    const neighbors = getOrthogonalNeighbors(position, map.grid).sort(
      (left, right) =>
        Math.abs(left.y - start.y) - Math.abs(right.y - start.y) ||
        Math.abs(left.x - start.x) - Math.abs(right.x - start.x) ||
        left.y - right.y ||
        left.x - right.x,
    );
    queue.push(...neighbors);
  }

  if (formation.length !== size) {
    throw new Error(`O mapa ${map.name} não possui casas livres para a formação PvP.`);
  }
  return formation;
}

export function createPvpCasualFormation(format: PvpCasualFormat, mapId: string) {
  const map = getTacticalMapById(mapId);
  const size = pvpCasualFormatDetails[format].teamSize;
  const teamOne = collectFormation(map.playerStart, size, map.id, new Set());
  const reserved = new Set(teamOne.map(tacticalPositionKey));
  const teamTwo = collectFormation(map.enemyStart, size, map.id, reserved);
  return { teamOne, teamTwo };
}

export function createInitialPvpCasualState<Format extends PvpCasualFormat>({
  format,
  mapId,
  teamOne,
  teamTwo,
  rules = defaultCombatRules,
}: {
  format: Format;
  mapId: string;
  teamOne: ArenaCharacter[];
  teamTwo: ArenaCharacter[];
  rules?: CombatRules;
}): PvpCasualBattleState<Format> {
  const expectedSize = pvpCasualFormatDetails[format].teamSize;
  if (teamOne.length !== expectedSize || teamTwo.length !== expectedSize) {
    throw new Error(
      `Uma partida ${pvpCasualFormatDetails[format].label} precisa de exatamente ${expectedSize} personagem(ns) em cada equipe.`,
    );
  }

  const all = [...teamOne, ...teamTwo];
  const uniqueIds = new Set(all.map((character) => character.id));
  if (uniqueIds.size !== all.length) {
    throw new Error("Um personagem não pode ocupar mais de uma vaga na mesma partida PvP.");
  }

  const map = getTacticalMapById(mapId);
  const formation = createPvpCasualFormation(format, map.id);
  const fighters = Object.fromEntries(
    all.map((character) => [character.id, createPvpCombatant(character, rules)]),
  );
  const turnOrder = buildTurnOrder(
    all.map((character) => ({
      id: character.id,
      initiative: getEffectiveAttributes(fighters[character.id]).INI,
    })),
  );
  const teamOneIds = teamOne.map((character) => character.id);
  const teamTwoIds = teamTwo.map((character) => character.id);
  const positions = Object.fromEntries([
    ...teamOneIds.map((id, index) => [id, formation.teamOne[index]]),
    ...teamTwoIds.map((id, index) => [id, formation.teamTwo[index]]),
  ]);

  return {
    format,
    mapId: map.id,
    fighters,
    teamOne: teamOneIds,
    teamTwo: teamTwoIds,
    positions,
    movement: 4,
    round: 1,
    turn: 1,
    turnOrder,
    activeCharacterId: turnOrder[0],
    turnActions: createTurnActionUsage(),
    status: "active",
    winnerCharacterId: null,
    message: `A batalha ${pvpCasualFormatDetails[format].label} começou. Turno de ${fighters[turnOrder[0]].name}.`,
    log: [],
    turnEndsAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

export function livingPvpTeamMembers(state: PvpCasualBattleState, team: string[]) {
  return team.filter((id) => (state.fighters[id]?.hp ?? 0) > 0);
}

export function opposingPvpTeam(state: PvpCasualBattleState, characterId: string) {
  if (state.teamOne.includes(characterId)) return state.teamTwo;
  if (state.teamTwo.includes(characterId)) return state.teamOne;
  return [];
}

export function choosePvpTarget(state: PvpCasualBattleState, actorId: string) {
  const candidates = livingPvpTeamMembers(state, opposingPvpTeam(state, actorId));
  return (
    [...candidates].sort((left, right) => {
      const a = state.fighters[left];
      const b = state.fighters[right];
      return a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp);
    })[0] ?? null
  );
}
