import {
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
    grid: { width: 10, height: 8 },
    playerStart: { x: 2, y: 5 },
    enemyStart: { x: 7, y: 2 },
    obstacles: ["4,1", "4,2", "4,3", "5,3", "6,3", "2,2", "7,5", "7,6"],
  },
  {
    id: "corredor-quebrado",
    name: "Corredor Quebrado",
    description: "Mapa estreito que favorece controle de espaço e combate frontal.",
    grid: { width: 9, height: 7 },
    playerStart: { x: 1, y: 3 },
    enemyStart: { x: 7, y: 3 },
    obstacles: ["3,1", "3,2", "3,4", "3,5", "5,1", "5,2", "5,4", "5,5"],
  },
  {
    id: "clareira-partida",
    name: "Clareira Partida",
    description: "Arena mais aberta, com poucos bloqueios e espaço para unidades ranged.",
    grid: { width: 11, height: 8 },
    playerStart: { x: 1, y: 6 },
    enemyStart: { x: 9, y: 1 },
    obstacles: ["4,3", "5,3", "6,3", "4,4", "6,4", "8,5"],
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
    if (!Number.isInteger(x) || !Number.isInteger(y) || !isTacticalPositionInside({ x, y }, map.grid)) {
      errors.push(`obstacle-outside:${obstacle}`);
      continue;
    }
    if (obstacleSet.has(obstacle)) errors.push(`duplicate-obstacle:${obstacle}`);
    obstacleSet.add(obstacle);
  }

  if (obstacleSet.has(tacticalPositionKey(map.playerStart))) errors.push("player-spawn-blocked");
  if (obstacleSet.has(tacticalPositionKey(map.enemyStart))) errors.push("enemy-spawn-blocked");

  return { valid: errors.length === 0, errors };
}
