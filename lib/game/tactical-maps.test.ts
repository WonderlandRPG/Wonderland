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
    }
  });

  it("falls back to the default map for an unknown id", () => {
    expect(getTacticalMapById("mapa-inexistente").id).toBe(DEFAULT_TACTICAL_MAP.id);
  });

  it("rejects blocked spawns", () => {
    const invalid = {
      ...DEFAULT_TACTICAL_MAP,
      obstacles: [...DEFAULT_TACTICAL_MAP.obstacles, "2,5"],
    };
    expect(validateTacticalMap(invalid).errors).toContain("player-spawn-blocked");
  });
});
