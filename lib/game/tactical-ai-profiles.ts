import {
  getReachableTacticalCells,
  getTacticalDistance,
  hasTacticalLineOfSight,
  tacticalPositionKey,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";

export type TacticalAiProfile = "aggressive" | "ranged" | "controller";

export type TacticalProfileDecision = {
  position: TacticalPosition;
  movementCost: number;
  distance: number;
  hasLineOfSight: boolean;
  canUseSkill: boolean;
  canBasicAttack: boolean;
  score: number;
  reason: string;
};

const preferredDistance: Record<TacticalAiProfile, number> = {
  aggressive: 1,
  ranged: 3,
  controller: 2,
};

export function chooseTacticalProfileDestination(input: {
  profile: TacticalAiProfile;
  start: TacticalPosition;
  target: TacticalPosition;
  movement: number;
  grid: { width: number; height: number };
  blocked: ReadonlySet<string>;
  sightBlocked: ReadonlySet<string>;
  basicRange: number;
  skillRange: number;
  skillAvailable: boolean;
}): TacticalProfileDecision {
  const occupied = new Set([...input.blocked, tacticalPositionKey(input.target)]);
  const reachable = getReachableTacticalCells({
    start: input.start,
    blocked: occupied,
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

  const ideal = preferredDistance[input.profile];
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
    if (hasLineOfSight) score += 500;
    if (canUseSkill) score += input.profile === "controller" ? 13_000 : 10_000;
    if (canBasicAttack) score += input.profile === "aggressive" ? 9_000 : 3_500;

    const distancePenalty = Math.abs(distance - ideal) * (input.profile === "ranged" ? 130 : 70);
    score -= distancePenalty;
    score -= movementCost;

    if (input.profile === "ranged" && distance <= 1) score -= 2_000;
    if (input.profile === "controller" && canUseSkill) score += 1_500;

    const reason = canUseSkill
      ? input.profile === "controller" ? "posição de controle" : "posição de habilidade"
      : canBasicAttack
        ? "posição de ataque básico"
        : hasLineOfSight
          ? `mantendo distância tática (${ideal})`
          : "buscando linha de visão";

    return { position, movementCost, distance, hasLineOfSight, canUseSkill, canBasicAttack, score, reason };
  });

  evaluated.sort((left, right) =>
    right.score - left.score ||
    left.movementCost - right.movementCost ||
    tacticalPositionKey(left.position).localeCompare(tacticalPositionKey(right.position)),
  );

  return evaluated[0] ?? {
    position: input.start,
    movementCost: 0,
    distance: getTacticalDistance(input.start, input.target),
    hasLineOfSight: false,
    canUseSkill: false,
    canBasicAttack: false,
    score: 0,
    reason: "sem posição válida",
  };
}
