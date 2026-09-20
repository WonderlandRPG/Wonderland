import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20260920000008_rework_inventory_shop.sql"),
  "utf8",
);
const rollback = readFileSync(
  resolve("supabase/rollbacks/20260920000008_rework_inventory_shop.rollback.sql"),
  "utf8",
);

describe("item 6 database migration", () => {
  it("preserves every current balance and inventory before changing the model", () => {
    expect(migration).toContain("public.v2_rework_economy_backups");
    expect(migration).toContain("character.gold");
    expect(migration).toContain("'quantity', inventory.quantity");
    expect(migration).not.toMatch(/delete\s+from\s+public\.v2_(characters|shop_items)/i);
  });

  it("converts ARC to HP and blocks legacy item attributes", () => {
    expect(migration).toContain("attributes - 'ARC'");
    expect(migration).toContain("'HP', coalesce");
    expect(migration).toContain("v2_shop_items_rework_attributes");
    expect(migration).toContain("attributes - 'FOR' - 'INT' - 'DEF' - 'RES' - 'HP' - 'INI'");
  });

  it("adds guarded storage and immutable owner-visible transaction history", () => {
    expect(migration).toContain("location in ('bag', 'storage')");
    expect(migration).toContain("Mova o item para a mochila antes de equipar");
    expect(migration).toContain("public.v2_shop_transactions");
    expect(migration).toContain("user_id = (select auth.uid())");
  });

  it("keeps post-release transactions and balances on rollback", () => {
    expect(rollback).toContain("preservados para auditoria");
    expect(rollback).not.toMatch(/drop table|truncate|update\s+public\.v2_characters/i);
  });
});
