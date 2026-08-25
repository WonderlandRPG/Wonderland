import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getRealmLocations, realmLocations } from "@/lib/game/realm-locations";
import { realmLore } from "@/lib/game/world-lore";

describe("realm location atlas", () => {
  it("catalogs ten mission locations for every realm", () => {
    expect(realmLocations).toHaveLength(60);
    for (const realm of realmLore) {
      expect(getRealmLocations(realm.key)).toHaveLength(10);
    }
  });

  it("uses unique names and keys", () => {
    expect(new Set(realmLocations.map((location) => location.key)).size).toBe(60);
    expect(new Set(realmLocations.map((location) => location.name)).size).toBe(60);
  });

  it("maps every location to a valid artwork crop", () => {
    for (const location of realmLocations) {
      expect(existsSync(join(process.cwd(), "public", location.image.slice(1)))).toBe(true);
      expect(location.description.length).toBeGreaterThan(60);
      expect(location.grid.column).toBeGreaterThanOrEqual(0);
      expect(location.grid.column).toBeLessThan(location.grid.columns);
      expect(location.grid.row).toBeGreaterThanOrEqual(0);
      expect(location.grid.row).toBeLessThan(location.grid.rows);
    }
  });
});
