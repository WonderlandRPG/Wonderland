import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260921150000_pvp_casual_trios_rework.sql",
  "utf8",
);

describe("migração do PvP casual 3x3", () => {
  it("adiciona o terceiro integrante às filas, partidas e equipes", () => {
    expect(migration).toContain("tertiary_user_id");
    expect(migration).toContain("player_one_tertiary_character_id");
    expect(migration).toContain("slot in (1,2,3)");
    expect(migration).toContain("format in ('solo','duo','trio')");
  });

  it("protege todas as rotinas privilegiadas com autenticação e permissões explícitas", () => {
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain(
      "revoke execute on function public.v2_join_pvp_queue_v2(uuid,text) from public,anon",
    );
    expect(migration).toContain("to authenticated");
  });

  it("inclui seis participantes em confirmação, sincronização, histórico e desistência", () => {
    expect(migration).toContain("player_two_tertiary_user_id");
    expect(migration).toContain("player_two_tertiary_character_id");
    expect(migration).toContain("create or replace function public.v2_record_pvp_result()");
    expect(migration).toContain("create or replace function public.v2_request_combat_surrender");
  });
});
