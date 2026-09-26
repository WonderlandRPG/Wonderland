import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("segurança da ranqueada", () => {
  it("impede chamada direta da apuração interna de PdL", () => {
    const migration = readFileSync(
      "supabase/migrations/20260926203500_secure_ranked_result_trigger.sql",
      "utf8",
    );
    expect(migration).toContain(
      "revoke all on function public.v2_process_ranked_result() from public,anon,authenticated",
    );
  });
});
