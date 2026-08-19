import { describe, expect, it } from "vitest";
import { simpleClassDefaults, simpleClassDraftSchema, simpleItemDefaults, simpleItemDraftSchema, simpleRaceDefaults, simpleRaceDraftSchema, simpleTitleDefaults, simpleTitleDraftSchema } from "./simple-content-builder";

describe("admin content studio schemas", () => {
  it("accepts the default guided drafts", () => {
    expect(simpleClassDraftSchema.safeParse(simpleClassDefaults()).success).toBe(true);
    expect(simpleRaceDraftSchema.safeParse(simpleRaceDefaults()).success).toBe(true);
    expect(simpleItemDraftSchema.safeParse(simpleItemDefaults()).success).toBe(true);
    expect(simpleTitleDraftSchema.safeParse(simpleTitleDefaults()).success).toBe(true);
  });

  it("blocks racial bonuses above the official 25 point cap", () => {
    const race = simpleRaceDefaults();
    race.bonuses = { FOR: 10, DEF: 10, RES: 10, INI: 0, INT: 0, ARC: 0 };
    expect(simpleRaceDraftSchema.safeParse(race).success).toBe(false);
  });

  it("validates item slots and rarities instead of accepting arbitrary engine values", () => {
    expect(simpleItemDraftSchema.safeParse({ ...simpleItemDefaults(), slot: "grid_cell" }).success).toBe(false);
    expect(simpleItemDraftSchema.safeParse({ ...simpleItemDefaults(), rarity: "admin" }).success).toBe(false);
  });
});
