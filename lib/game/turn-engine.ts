import type { CombatantState } from "@/lib/game/combat";

export type BattlePosition = { x: number; y: number };

export type TurnActionKind =
  | "move"
  | "basic"
  | "race"
  | "class"
  | "item"
  | "defend";

export type TurnActions = Record<TurnActionKind, boolean>;

export interface TurnActor {
  id: string;
  initiative: number;
}

export interface SharedBattleState {
  round: number;
  turn: number;
  turnOrder: string[];
  activeCharacterId: string;
  fighters: Record<string, CombatantState>;
  positions: Record<string, BattlePosition>;
  actions: TurnActions;
  status: "active" | "finished" | "abandoned";
  winnerCharacterId: string | null;
  message: string;
  log: string[];
  turnEndsAt?: string;
}

export const createEmptyTurnActions = (): TurnActions => ({
  move: false,
  basic: false,
  race: false,
  class: false,
  item: false,
  defend: false,
});

export function buildTurnOrder(actors: TurnActor[]) {
  return [...actors]
    .sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id))
    .map((actor) => actor.id);
}

export function getNextTurn(
  state: Pick<SharedBattleState, "round" | "turn" | "turnOrder" | "activeCharacterId">,
) {
  if (state.turnOrder.length === 0) {
    return {
      round: state.round,
      turn: state.turn,
      activeCharacterId: state.activeCharacterId,
    };
  }

  const currentIndex = Math.max(0, state.turnOrder.indexOf(state.activeCharacterId));
  const nextIndex = (currentIndex + 1) % state.turnOrder.length;
  const wrapped = nextIndex === 0;

  return {
    round: state.round + (wrapped ? 1 : 0),
    turn: state.turn + 1,
    activeCharacterId: state.turnOrder[nextIndex],
  };
}

export function manhattanDistance(a: BattlePosition, b: BattlePosition) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isInsideGrid(
  position: BattlePosition,
  grid: { width: number; height: number },
) {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x < grid.width &&
    position.y < grid.height
  );
}

export function canMoveTo(input: {
  from: BattlePosition;
  to: BattlePosition;
  movementRange: number;
  grid: { width: number; height: number };
  occupied?: BattlePosition[];
}) {
  if (!isInsideGrid(input.to, input.grid)) return false;
  if (manhattanDistance(input.from, input.to) > input.movementRange) return false;
  if (
    input.occupied?.some(
      (position) => position.x === input.to.x && position.y === input.to.y,
    )
  ) {
    return false;
  }
  return true;
}

export function isTargetInRange(
  attacker: BattlePosition,
  target: BattlePosition,
  range: number,
) {
  return manhattanDistance(attacker, target) <= Math.max(0, range);
}

export function livingFighterIds(fighters: Record<string, CombatantState>) {
  return Object.values(fighters)
    .filter((fighter) => fighter.hp > 0)
    .map((fighter) => fighter.id);
}
