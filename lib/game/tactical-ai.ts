import {
  getReachableTacticalCells,
  getTacticalDistance,
  hasTacticalLineOfSight,
  tacticalPositionKey,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";

export type TacticalAiDecision = {
  position: TacticalPosition;
  movementCost: number;
  canUseSkill: boolean;
  canBasicAttack: boolean;
  hasLineOfSight: boolean;
  distance: number;
  score: number;
  reason: string;
};

export function chooseTacticalAiDestination(input: {
  start: TacticalPosition;
  target: TacticalPosition;
  movement: number;
  grid: { width: number; height: number };
  blocked: ReadonlySet<string>;
  sightBlocked: ReadonlySet<string>;
  basicRange: number;
  skillRange: number;
  skillAvailable: boolean;
}): TacticalAiDecision {
  const reachable = getReachableTacticalCells({
    start: input.start,
    blocked: input.blocked,
    movement: input.movement,
    grid: input.grid,
  });

  const candidates: Array<{ position: TacticalPosition; movementCost: number }> = [
    { position: input.start, movementCost: 0 },
    ...Array.from(reachable.entries()).map(([key, movementCost]) => {
      const [x, y] = key.split(",").map(Number);
      return { position: { x, y }, movementCost };
    }),
  ];

  const evaluated = candidates.map(({ position, movementCost }) => {
    const distance = getTacticalDistance(position, input.target);
    const hasLineOfSight = hasTacticalLineOfSight({
      from: position,
      to: input.target,
      blocked: input.sightBlocked,
    });
    const canUseSkill = input.skillAvailable && distance <= input.skillRange && hasLineOfSight;
    const canBasicAttack = distance <= input.basicRange && hasLineOfSight;

    let score = 0;
    if (canUseSkill) score += 10_000;
    if (canBasicAttack) score += 5_000;
    if (hasLineOfSight) score += 500;
    score -= distance * 40;
    score -= movementCost;

    const reason = canUseSkill
      ? "posição de habilidade"
      : canBasicAttack
        ? "posição de ataque básico"
        : hasLineOfSight
          ? "posição com linha de visão"
          : "aproximação";

    return {
      position,
      movementCost,
      canUseSkill,
      canBasicAttack,
      hasLineOfSight,
      distance,
      score,
      reason,
    };
  });

  evaluated.sort((left, right) =>
    right.score - left.score ||
    left.movementCost - right.movementCost ||
    tacticalPositionKey(left.position).localeCompare(tacticalPositionKey(right.position)),
  );

  return evaluated[0] ?? {
    position: input.start,
    movementCost: 0,
    canUseSkill: false,
    canBasicAttack: false,
    hasLineOfSight: false,
    distance: getTacticalDistance(input.start, input.target),
    score: 0,
    reason: "sem posição válida",
  };
}
