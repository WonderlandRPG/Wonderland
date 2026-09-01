import type { ClassSkill } from "@/lib/game/classes";
import {
  getForcedMovementDestination,
  getReachableTacticalCells,
  getTacticalDistance,
  tacticalPositionKey,
  type TacticalGridSize,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";

export type TacticalSpatialResult = {
  playerPosition: TacticalPosition;
  enemyPosition: TacticalPosition;
  messages: string[];
};

export function applyTacticalSpatialSkill({
  skill,
  successfulOperationIndexes,
  playerPosition,
  enemyPosition,
  selectedPosition,
  obstacles,
  grid,
}: {
  skill: ClassSkill;
  successfulOperationIndexes: number[];
  playerPosition: TacticalPosition;
  enemyPosition: TacticalPosition;
  selectedPosition: TacticalPosition;
  obstacles: Set<string>;
  grid: TacticalGridSize;
}): TacticalSpatialResult {
  let nextPlayer = playerPosition;
  let nextEnemy = enemyPosition;
  const messages: string[] = [];
  const successful = new Set(successfulOperationIndexes);

  for (const [index, operation] of skill.operations.entries()) {
    if (!successful.has(index)) continue;
    const distance = Math.max(1, operation.distance || skill.range || 1);

    if (
      operation.operation === "PUSH" &&
      (operation.target === "enemy" || operation.target === "area")
    ) {
      const forced = getForcedMovementDestination({
        source: nextPlayer,
        target: nextEnemy,
        distance,
        blocked: new Set([...obstacles, tacticalPositionKey(nextPlayer)]),
        grid,
      });
      nextEnemy = forced.position;
      messages.push(forced.moved ? `Push: ${forced.moved} casa(s).` : "Push bloqueado.");
      continue;
    }

    if (
      (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
      (operation.target === "self" || operation.target === "source")
    ) {
      const destinationKey = tacticalPositionKey(selectedPosition);
      if (obstacles.has(destinationKey) || destinationKey === tacticalPositionKey(nextEnemy)) {
        messages.push(`${operation.operation}: destino bloqueado.`);
        continue;
      }
      if (getTacticalDistance(nextPlayer, selectedPosition) > distance) {
        messages.push(`${operation.operation}: destino fora do alcance.`);
        continue;
      }

      if (operation.operation === "MOVE") {
        const reachable = getReachableTacticalCells({
          start: nextPlayer,
          blocked: new Set([...obstacles, tacticalPositionKey(nextEnemy)]),
          movement: distance,
          grid,
        });
        if (!reachable.has(destinationKey)) {
          messages.push("MOVE: não existe caminho livre até o destino.");
          continue;
        }
      }

      nextPlayer = selectedPosition;
      messages.push(`${operation.operation}: casa ${selectedPosition.x + 1},${selectedPosition.y + 1}.`);
    }
  }

  return { playerPosition: nextPlayer, enemyPosition: nextEnemy, messages };
}
