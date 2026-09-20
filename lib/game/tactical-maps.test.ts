import { describe, expect, it } from "vitest";

import {
  DEFAULT_TACTICAL_MAP,
  TACTICAL_MAPS,
  getTacticalMapById,
  validateTacticalMap,
} from "@/lib/game/tactical-maps";

describe("tactical encounter maps", () => {
  it("keeps every built-in map structurally valid", () => {
    for (const map of TACTICAL_MAPS) {
      expect(validateTacticalMap(map), map.id).toEqual({ valid: true, errors: [] });
      expect(map.grid.width * map.grid.height, map.id).toBeGreaterThanOrEqual(99);
    }
  });

  it("ships five battlefields with distinct tactical layouts", () => {
    expect(TACTICAL_MAPS).toHaveLength(5);
    expect(
      new Set(TACTICAL_MAPS.map((map) => `${map.grid.width}x${map.grid.height}`)).size,
    ).toBeGreaterThan(1);
    expect(new Set(TACTICAL_MAPS.map((map) => map.obstacles.join("|"))).size).toBe(5);
  });

  it("falls back to the default map for an unknown id", () => {
    expect(getTacticalMapById("mapa-inexistente").id).toBe(DEFAULT_TACTICAL_MAP.id);
  });

  it("rejects blocked spawns", () => {
    const invalid = {
      ...DEFAULT_TACTICAL_MAP,
      obstacles: [
        ...DEFAULT_TACTICAL_MAP.obstacles,
        `${DEFAULT_TACTICAL_MAP.playerStart.x},${DEFAULT_TACTICAL_MAP.playerStart.y}`,
      ],
    };
    expect(validateTacticalMap(invalid).errors).toContain("player-spawn-blocked");
  });

  it("rejects a map whose spawns have no route between them", () => {
    const invalid = {
      ...DEFAULT_TACTICAL_MAP,
      obstacles: Array.from({ length: DEFAULT_TACTICAL_MAP.grid.height }, (_, y) => `4,${y}`),
    };
    expect(validateTacticalMap(invalid).errors).toContain("spawn-path-blocked");
  });
});

