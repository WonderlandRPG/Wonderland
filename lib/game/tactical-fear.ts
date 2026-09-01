import {
  getReachableTacticalCells,
  getTacticalDistance,
  tacticalPositionKey,
  type TacticalGridSize,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";

export function chooseTacticalFleeDestination(input: {
  start: TacticalPosition;
  threat: TacticalPosition;
  movement: number;
  grid: TacticalGridSize;
  blocked: Set<string>;
}) {
  const reachable = getReachableTacticalCells({
    start: input.start,
    movement: Math.max(0, input.movement),
    grid: input.grid,
    blocked: new Set([...input.blocked, tacticalPositionKey(input.threat)]),
  });

  let best = input.start;
  let bestDistance = getTacticalDistance(input.start, input.threat);
  let bestCost = 0;

  for (const [key, cost] of reachable) {
    const [x, y] = key.split(",").map(Number);
    const position = { x, y };
    const distance = getTacticalDistance(position, input.threat);
    if (distance > bestDistance || (distance === bestDistance && cost < bestCost)) {
      best = position;
      bestDistance = distance;
      bestCost = cost;
    }
  }

  return {
    position: best,
    movementCost: bestCost,
    distanceFromThreat: bestDistance,
  };
}
