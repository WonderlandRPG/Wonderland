import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20260919234309_rework_items_equipment.sql"),
  "utf8",
);
const rollback = readFileSync(
  resolve("supabase/rollbacks/20260919234309_rework_items_equipment.rollback.sql"),
  "utf8",
);

describe("item 5 database migration", () => {
  it("preserves item definitions and equipped slots before conversion", () => {
    expect(migration).toContain("create table if not exists public.v2_rework_item_backups");
    expect(migration).toContain("create table if not exists public.v2_rework_equipment_backups");
    expect(migration).toContain("on conflict (inventory_id) do nothing");
  });

  it("converts legacy slots into all fourteen canonical equipment slots", () => {
    for (const slot of [
      "head",
      "torso",
      "hands",
      "legs",
      "feet",
      "necklace",
      "cape",
      "main_weapon",
      "off_weapon",
      "ring_1",
      "ring_2",
      "earring_1",
      "earring_2",
      "title",
    ]) {
      expect(migration).toContain(`'${slot}'`);
    }
    expect(migration).toContain("public.v2_normalize_equipment_slots");
  });

  it("protects privileged functions and private backup tables", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("owner_id <> (select auth.uid())");
    expect(migration).toContain(
      "revoke execute on function public.v2_equip_inventory_item(uuid, text) from public, anon",
    );
  });

  it("enforces rarities, structured effects and two-handed weapons", () => {
    expect(migration).toContain("v2_shop_items_rarity_check");
    expect(migration).toContain("jsonb_typeof(special_effects) = 'array'");
    expect(migration).toContain("not two_handed or slot in ('main_weapon','off_weapon')");
  });

  it("restores preserved values in its scoped rollback", () => {
    expect(rollback).toContain("from public.v2_rework_item_backups backup");
    expect(rollback).toContain("from public.v2_rework_equipment_backups backup");
    expect(rollback).not.toMatch(
      /truncate|drop table public\.v2_(shop_items|character_inventory)/i,
    );
  });
});
