export type TacticalPosition = { x: number; y: number };

export type TacticalGridSize = {
  width: number;
  height: number;
};

export function tacticalPositionKey(position: TacticalPosition) {
  return `${position.x},${position.y}`;
}

export function isTacticalPositionInside(position: TacticalPosition, grid: TacticalGridSize) {
  return position.x >= 0 && position.x < grid.width && position.y >= 0 && position.y < grid.height;
}

export function getOrthogonalNeighbors(position: TacticalPosition, grid: TacticalGridSize) {
  return [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 },
  ].filter((next) => isTacticalPositionInside(next, grid));
}

export function getTacticalDistance(a: TacticalPosition, b: TacticalPosition) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getReachableTacticalCells({
  start,
  blocked,
  movement,
  grid,
}: {
  start: TacticalPosition;
  blocked: ReadonlySet<string>;
  movement: number;
  grid: TacticalGridSize;
}) {
  const distance = new Map<string, number>([[tacticalPositionKey(start), 0]]);
  const queue: TacticalPosition[] = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const currentDistance = distance.get(tacticalPositionKey(current)) ?? 0;
    if (currentDistance >= movement) continue;

    for (const next of getOrthogonalNeighbors(current, grid)) {
      const nextKey = tacticalPositionKey(next);
      if (blocked.has(nextKey) || distance.has(nextKey)) continue;
      distance.set(nextKey, currentDistance + 1);
      queue.push(next);
    }
  }

  distance.delete(tacticalPositionKey(start));
  return distance;
}

export function getTacticalAreaCells({
  center,
  radius,
  grid,
}: {
  center: TacticalPosition;
  radius: number;
  grid: TacticalGridSize;
}) {
  const cells = new Set<string>();
  if (radius <= 0) return cells;

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const position = { x, y };
      if (getTacticalDistance(center, position) <= radius) {
        cells.add(tacticalPositionKey(position));
      }
    }
  }

  return cells;
}
