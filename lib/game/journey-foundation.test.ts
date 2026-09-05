import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("character journey foundation", () => {
  const migration = readFileSync("supabase/migrations/20260905182756_journey_notifications_diary.sql", "utf8");
  const missionPage = readFileSync("app/missoes/page.tsx", "utf8");
  const dashboard = readFileSync("app/personagens/page.tsx", "utf8");

  it("protects diary and notification data with ownership policies", () => {
    expect(migration).toContain("alter table public.v2_character_diary enable row level security");
    expect(migration).toContain("(select auth.uid()) = user_id");
    expect(migration).toContain("alter table public.v2_notifications enable row level security");
    expect(migration).toContain("revoke all on public.v2_notifications from anon, authenticated");
  });

  it("keeps mission completion under Guild management", () => {
    expect(missionPage).toContain("Aguardando conclusão");
    expect(missionPage).not.toContain("updateMissionSceneAction");
    expect(migration).toContain("old.status = 'in_progress'");
    expect(migration).toContain("new.scene_stage := 'reward_received'");
  });

  it("connects onboarding, missions, combat and progression on the dashboard", () => {
    expect(dashboard).toContain("Primeiros passos");
    expect(dashboard).toContain("v2_get_mission_board");
    expect(dashboard).toContain("v2_get_pve_daily_status");
    expect(dashboard).toContain("nextClassSkill");
  });
});
