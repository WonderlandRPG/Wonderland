import { defaultCombatRules, getEffectiveAttributes, type CombatRules } from "@/lib/game/combat";
import { createPvpCombatant } from "@/lib/game/pvp-state";
import type { ArenaCharacter, PvpBattleState } from "@/lib/game/arena-types";
import { buildTurnOrder, createTurnActionUsage } from "@/lib/game/turn-engine";

export interface PvpDuoBattleState extends PvpBattleState {
  teamOne: string[];
  teamTwo: string[];
}

export function createInitialPvpDuoState(
  teamOne: ArenaCharacter[],
  teamTwo: ArenaCharacter[],
  rules: CombatRules = defaultCombatRules,
): PvpDuoBattleState {
  if (teamOne.length !== 2 || teamTwo.length !== 2) {
    throw new Error("Uma partida 2x2 precisa de exatamente dois personagens em cada equipe.");
  }

  const all = [...teamOne, ...teamTwo];
  const fighters = Object.fromEntries(
    all.map((character) => [character.id, createPvpCombatant(character, rules)]),
  );
  const turnOrder = buildTurnOrder(
    all.map((character) => ({
      id: character.id,
      initiative: getEffectiveAttributes(fighters[character.id]).INI,
    })),
  );

  return {
    fighters,
    teamOne: teamOne.map((character) => character.id),
    teamTwo: teamTwo.map((character) => character.id),
    round: 1,
    turn: 1,
    turnOrder,
    activeCharacterId: turnOrder[0],
    turnActions: createTurnActionUsage(),
    status: "active",
    winnerCharacterId: null,
    message: `A batalha 2x2 começou. Turno de ${fighters[turnOrder[0]].name}.`,
    log: [],
    turnEndsAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

export function livingTeamMembers(state: PvpDuoBattleState, team: string[]) {
  return team.filter((id) => (state.fighters[id]?.hp ?? 0) > 0);
}

export function opposingTeam(state: PvpDuoBattleState, characterId: string) {
  return state.teamOne.includes(characterId) ? state.teamTwo : state.teamOne;
}

export function chooseDuoTarget(state: PvpDuoBattleState, actorId: string) {
  const candidates = livingTeamMembers(state, opposingTeam(state, actorId));
  return [...candidates].sort((left, right) => {
    const a = state.fighters[left];
    const b = state.fighters[right];
    return a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp);
  })[0] ?? null;
}
