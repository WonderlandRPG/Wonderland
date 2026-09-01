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
      if (getTacticalDistance(center, position) <= radius) cells.add(tacticalPositionKey(position));
    }
  }

  return cells;
}

export function hasTacticalLineOfSight({
  from,
  to,
  blocked,
}: {
  from: TacticalPosition;
  to: TacticalPosition;
  blocked: ReadonlySet<string>;
}) {
  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx - dy;

  while (x0 !== x1 || y0 !== y1) {
    const doubled = error * 2;
    if (doubled > -dy) {
      error -= dy;
      x0 += sx;
    }
    if (doubled < dx) {
      error += dx;
      y0 += sy;
    }
    if (x0 === x1 && y0 === y1) return true;
    if (blocked.has(tacticalPositionKey({ x: x0, y: y0 }))) return false;
  }
  return true;
}

export function getForcedMovementDestination({
  source,
  target,
  distance,
  blocked,
  grid,
}: {
  source: TacticalPosition;
  target: TacticalPosition;
  distance: number;
  blocked: ReadonlySet<string>;
  grid: TacticalGridSize;
}) {
  const deltaX = target.x - source.x;
  const deltaY = target.y - source.y;
  const step = Math.abs(deltaX) >= Math.abs(deltaY)
    ? { x: Math.sign(deltaX), y: 0 }
    : { x: 0, y: Math.sign(deltaY) };
  let current = target;
  let moved = 0;

  while (moved < distance) {
    const next = { x: current.x + step.x, y: current.y + step.y };
    if (!isTacticalPositionInside(next, grid) || blocked.has(tacticalPositionKey(next))) break;
    current = next;
    moved += 1;
  }

  return { position: current, moved };
}
