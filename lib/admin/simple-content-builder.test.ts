import { describe, expect, it } from "vitest";
import { simpleItemDefaults, simpleItemDraftSchema, simpleTitleDefaults, simpleTitleDraftSchema } from "./simple-content-builder";

describe("admin content studio schemas", () => {
  it("accepts the default guided drafts", () => {
    expect(simpleItemDraftSchema.safeParse(simpleItemDefaults()).success).toBe(true);
    expect(simpleTitleDraftSchema.safeParse(simpleTitleDefaults()).success).toBe(true);
  });

  it("validates item slots and rarities instead of accepting arbitrary engine values", () => {
    expect(simpleItemDraftSchema.safeParse({ ...simpleItemDefaults(), slot: "grid_cell" }).success).toBe(false);
    expect(simpleItemDraftSchema.safeParse({ ...simpleItemDefaults(), rarity: "admin" }).success).toBe(false);
  });

  it("only permits the two-handed flag on weapons", () => {
    expect(
      simpleItemDraftSchema.safeParse({
        ...simpleItemDefaults(),
        slot: "torso",
        twoHanded: true,
      }).success,
    ).toBe(false);
    expect(
      simpleItemDraftSchema.safeParse({ ...simpleItemDefaults(), twoHanded: true }).success,
    ).toBe(true);
  });
});
