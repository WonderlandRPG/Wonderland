import {
  getReachableTacticalCells,
  isTacticalPositionInside,
  tacticalPositionKey,
  type TacticalGridSize,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";

export type TacticalMapDefinition = {
  id: string;
  name: string;
  description: string;
  grid: TacticalGridSize;
  playerStart: TacticalPosition;
  enemyStart: TacticalPosition;
  obstacles: string[];
};

export const TACTICAL_MAPS: TacticalMapDefinition[] = [
  {
    id: "ruinas-centrais",
    name: "Ruínas Centrais",
    description: "Arena equilibrada com cobertura no centro e rotas laterais.",
    grid: { width: 12, height: 9 },
    playerStart: { x: 1, y: 7 },
    enemyStart: { x: 10, y: 1 },
    obstacles: ["5,1", "5,2", "5,3", "6,3", "7,3", "3,3", "3,4", "8,5", "8,6", "6,7"],
  },
  {
    id: "corredor-quebrado",
    name: "Corredor Quebrado",
    description: "Mapa estreito que favorece controle de espaço e combate frontal.",
    grid: { width: 11, height: 9 },
    playerStart: { x: 1, y: 4 },
    enemyStart: { x: 9, y: 4 },
    obstacles: ["3,1", "3,2", "3,3", "3,5", "3,6", "3,7", "7,1", "7,2", "7,3", "7,5", "7,6", "7,7"],
  },
  {
    id: "clareira-partida",
    name: "Clareira Partida",
    description: "Arena mais aberta, com poucos bloqueios e espaço para unidades ranged.",
    grid: { width: 13, height: 9 },
    playerStart: { x: 1, y: 7 },
    enemyStart: { x: 11, y: 1 },
    obstacles: ["5,3", "6,3", "7,3", "5,4", "7,4", "5,5", "6,5", "7,5", "9,6"],
  },
  {
    id: "santuario-lunar",
    name: "Santuário Lunar",
    description: "Cristais dividem o campo em rotas curtas e diagonais de aproximação.",
    grid: { width: 12, height: 10 },
    playerStart: { x: 1, y: 8 },
    enemyStart: { x: 10, y: 1 },
    obstacles: ["3,2", "8,2", "4,4", "7,4", "4,5", "7,5", "3,7", "8,7", "5,8", "6,8"],
  },
  {
    id: "ruinas-crepusculo",
    name: "Ruínas do Crepúsculo",
    description: "Campo amplo com muralhas quebradas, flancos longos e centro disputado.",
    grid: { width: 14, height: 9 },
    playerStart: { x: 1, y: 4 },
    enemyStart: { x: 12, y: 4 },
    obstacles: ["4,1", "4,2", "4,6", "4,7", "6,3", "7,3", "6,5", "7,5", "9,1", "9,2", "9,6", "9,7"],
  },
];

export const DEFAULT_TACTICAL_MAP = TACTICAL_MAPS[0];

export function getTacticalMapById(id: string) {
  return TACTICAL_MAPS.find((map) => map.id === id) ?? DEFAULT_TACTICAL_MAP;
}

export function validateTacticalMap(map: TacticalMapDefinition) {
  const errors: string[] = [];
  if (map.grid.width < 3 || map.grid.height < 3) errors.push("grid-too-small");
  if (!isTacticalPositionInside(map.playerStart, map.grid)) errors.push("player-outside-grid");
  if (!isTacticalPositionInside(map.enemyStart, map.grid)) errors.push("enemy-outside-grid");
  if (tacticalPositionKey(map.playerStart) === tacticalPositionKey(map.enemyStart)) {
    errors.push("shared-spawn");
  }

  const obstacleSet = new Set<string>();
  for (const obstacle of map.obstacles) {
    const [x, y] = obstacle.split(",").map(Number);
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      !isTacticalPositionInside({ x, y }, map.grid)
    ) {
      errors.push(`obstacle-outside:${obstacle}`);
      continue;
    }
    if (obstacleSet.has(obstacle)) errors.push(`duplicate-obstacle:${obstacle}`);
    obstacleSet.add(obstacle);
  }

  if (obstacleSet.has(tacticalPositionKey(map.playerStart))) errors.push("player-spawn-blocked");
  if (obstacleSet.has(tacticalPositionKey(map.enemyStart))) errors.push("enemy-spawn-blocked");

  if (
    errors.length === 0 &&
    !getReachableTacticalCells({
      start: map.playerStart,
      blocked: obstacleSet,
      movement: map.grid.width * map.grid.height,
      grid: map.grid,
    }).has(tacticalPositionKey(map.enemyStart))
  ) {
    errors.push("spawn-path-blocked");
  }

  return { valid: errors.length === 0, errors };
}
