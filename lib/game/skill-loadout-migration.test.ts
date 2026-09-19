import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20260919163000_rework_talents_skill_loadouts.sql"),
  "utf8",
);
const rollback = readFileSync(
  resolve("supabase/rollbacks/20260919163000_rework_talents_skill_loadouts.rollback.sql"),
  "utf8",
);

describe("item 4 database migration", () => {
  it("is additive and does not rewrite character progress", () => {
    expect(migration).toContain("create table if not exists public.v2_character_skill_loadouts");
    expect(migration).toContain("references public.v2_characters(id) on delete cascade");
    expect(migration).not.toMatch(
      /delete from public\.v2_characters|truncate|drop table public\.v2_characters/i,
    );
  });

  it("protects loadouts with ownership RLS and explicit grants", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("grant select, insert, update");
    expect(migration).toContain("character.user_id = (select auth.uid())");
  });

  it("publishes configurable limits and skill balance overrides", () => {
    expect(migration).toContain("combat.loadout_limits");
    expect(migration).toContain("combat.skill_balance_overrides");
  });

  it("has a scoped rollback", () => {
    expect(rollback).toContain("drop table if exists public.v2_character_skill_loadouts");
    expect(rollback).not.toMatch(/v2_characters\s*;/i);
  });
});
