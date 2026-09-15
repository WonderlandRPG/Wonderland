import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { reworkRolloutModules } from "@/lib/game/rework-rollout";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260915180000_prepare_rework_rollout_flags.sql"),
  "utf8",
);
const rollback = readFileSync(
  resolve(
    process.cwd(),
    "supabase/rollbacks/20260915180000_prepare_rework_rollout_flags.rollback.sql",
  ),
  "utf8",
);

describe("migração da fundação do Rework", () => {
  it("registra exatamente as chaves declaradas pela aplicação", () => {
    for (const rolloutModule of reworkRolloutModules) {
      expect(migration).toContain(rolloutModule.settingKey);
      expect(rollback).toContain(rolloutModule.settingKey);
    }
  });

  it("não contém operações sobre autenticação ou dados de jogadores", () => {
    const protectedTargets = ["auth.users", "v2_profiles", "v2_characters", "user_id"];
    for (const target of protectedTargets) expect(migration.toLowerCase()).not.toContain(target);
  });

  it("limita o rollback às configurações de rollout", () => {
    expect(rollback).toContain("where category = 'rework_rollout'");
    expect(rollback.toLowerCase()).not.toMatch(/drop\s+(table|schema)/);
    expect(rollback.toLowerCase()).not.toContain("truncate");
  });
});
