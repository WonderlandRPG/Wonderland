import { defaultCombatRules, type CombatRules } from "@/lib/game/combat";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import {
  choosePvpTarget,
  createInitialPvpCasualState,
  livingPvpTeamMembers,
  opposingPvpTeam,
  type PvpCasualBattleState,
} from "@/lib/game/pvp-casual";

export type PvpDuoBattleState = PvpCasualBattleState<"duo">;

export function createInitialPvpDuoState(
  teamOne: ArenaCharacter[],
  teamTwo: ArenaCharacter[],
  rules: CombatRules = defaultCombatRules,
): PvpDuoBattleState {
  return createInitialPvpCasualState({
    format: "duo",
    mapId: "ruinas-centrais",
    teamOne,
    teamTwo,
    rules,
  });
}

export function livingTeamMembers(state: PvpDuoBattleState, team: string[]) {
  return livingPvpTeamMembers(state, team);
}

export function opposingTeam(state: PvpDuoBattleState, characterId: string) {
  return opposingPvpTeam(state, characterId);
}

export function chooseDuoTarget(state: PvpDuoBattleState, actorId: string) {
  return choosePvpTarget(state, actorId);
}
