import { existsSync, statSync } from "node:fs";
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
    expect(new Set(realmLocations.map((location) => location.image)).size).toBe(60);
    for (const location of realmLocations) {
      const artworkPath = join(process.cwd(), "public", location.image.slice(1));
      expect(existsSync(artworkPath)).toBe(true);
      expect(statSync(artworkPath).size).toBeGreaterThan(30_000);
      expect(location.description.length).toBeGreaterThan(60);
      expect(location.grid).toEqual({ columns: 1, rows: 1, column: 0, row: 0 });
      expect(location.grid.column).toBeGreaterThanOrEqual(0);
      expect(location.grid.column).toBeLessThan(location.grid.columns);
      expect(location.grid.row).toBeGreaterThanOrEqual(0);
      expect(location.grid.row).toBeLessThan(location.grid.rows);
    }
  });
});
