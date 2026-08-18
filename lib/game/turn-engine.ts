import { getEffectiveAttributes, type CombatantState } from "@/lib/game/combat";

export type TurnActionKind = "basic" | "race" | "class" | "item" | "defend" | "wait";

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
  status: "active" | "finished" | "abandoned";
  winnerCharacterId: string | null;
  message: string;
  log: string[];
  turnEndsAt?: string;
}

export function buildTurnOrder(actors: TurnActor[]) {
  return [...actors]
    .filter((actor) => Number.isFinite(actor.initiative))
    .sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id))
    .map((actor) => actor.id);
}

export function buildCombatantTurnOrder(fighters: Record<string, CombatantState>) {
  return buildTurnOrder(
    Object.values(fighters)
      .filter((fighter) => fighter.hp > 0)
      .map((fighter) => ({
        id: fighter.id,
        initiative: getEffectiveAttributes(fighter).INI,
      })),
  );
}

export function getLivingTurnOrder(
  turnOrder: string[],
  fighters: Record<string, CombatantState>,
) {
  return turnOrder.filter((id) => (fighters[id]?.hp ?? 0) > 0);
}

export function getNextTurn(
  state: Pick<SharedBattleState, "round" | "turn" | "turnOrder" | "activeCharacterId" | "fighters">,
) {
  const living = getLivingTurnOrder(state.turnOrder, state.fighters);
  if (living.length === 0) {
    return {
      round: state.round,
      turn: state.turn,
      turnOrder: living,
      activeCharacterId: state.activeCharacterId,
    };
  }

  const currentIndex = Math.max(0, living.indexOf(state.activeCharacterId));
  const nextIndex = (currentIndex + 1) % living.length;
  const wrapped = nextIndex === 0;
  if (wrapped) {
    const refreshed = buildCombatantTurnOrder(state.fighters);
    return {
      round: state.round + 1,
      turn: state.turn + 1,
      turnOrder: refreshed,
      activeCharacterId: refreshed[0] ?? state.activeCharacterId,
    };
  }

  return {
    round: state.round,
    turn: state.turn + 1,
    turnOrder: living,
    activeCharacterId: living[nextIndex],
  };
}

export function livingFighterIds(fighters: Record<string, CombatantState>) {
  return Object.values(fighters)
    .filter((fighter) => fighter.hp > 0)
    .map((fighter) => fighter.id);
}

export function isTurnBlocked(combatant: CombatantState) {
  return Object.entries(combatant.statuses).some(([key, status]) => {
    const text = `${key} ${status.name}`.toLowerCase();
    return /stun|atordo|fear|medo|incapacit/.test(text);
  });
}

export function isSilenced(combatant: CombatantState) {
  return Object.entries(combatant.statuses).some(([key, status]) => {
    const text = `${key} ${status.name}`.toLowerCase();
    return /silence|silêncio|silencio/.test(text);
  });
}

export function resolveWinner(
  fighters: Record<string, CombatantState>,
  teams?: Record<string, string>,
) {
  const living = livingFighterIds(fighters);
  if (living.length === 0) return null;
  if (!teams) return living.length === 1 ? living[0] : null;
  const aliveTeams = new Set(living.map((id) => teams[id]).filter(Boolean));
  if (aliveTeams.size !== 1) return null;
  return living[0];
}

export function appendBattleLog(log: string[], message: string, limit = 60) {
  return [...log, message].slice(-limit);
}

export function createBattleState(input: {
  fighters: Record<string, CombatantState>;
  message?: string;
  turnEndsAt?: string;
}): SharedBattleState {
  const turnOrder = buildCombatantTurnOrder(input.fighters);
  const first = turnOrder[0] ?? Object.keys(input.fighters)[0] ?? "";
  const opening =
    input.message ??
    (first ? `${input.fighters[first].name} possui a iniciativa.` : "A batalha começou.");
  return {
    round: 1,
    turn: 1,
    turnOrder,
    activeCharacterId: first,
    fighters: input.fighters,
    status: "active",
    winnerCharacterId: null,
    message: opening,
    log: [opening],
    turnEndsAt: input.turnEndsAt,
  };
}
