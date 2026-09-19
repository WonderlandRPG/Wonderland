import { describe, expect, it } from "vitest";
import { buildReworkPreset, calculateReworkSheet, migrateLegacyAllocation, reworkAttributeTotal, toLegacyAllocation } from "@/lib/game/rework-attributes";

describe("atributos do Rework", () => {
  it("distribui exatamente 20 estrelas em todos os perfis", () => {
    for (const profile of ["aggressive", "balanced", "defensive"] as const) expect(reworkAttributeTotal(buildReworkPreset(profile))).toBe(20);
  });
  it("converte fichas antigas sem perder a proporção total", () => { expect(reworkAttributeTotal(migrateLegacyAllocation({FOR:40,INT:10,DEF:20,RES:10,ARC:10,INI:10}))).toBe(20); });
  it("mantém compatibilidade com a trava antiga de 100 pontos", () => { expect(Object.values(toLegacyAllocation(buildReworkPreset("balanced"))).reduce((a,b)=>a+b,0)).toBe(100); });
  it("calcula Poder Total a partir dos seis atributos finais", () => { expect(calculateReworkSheet({FOR:1,INT:2,DEF:3,RES:4,HP:5,INI:6}, buildReworkPreset("balanced")).powerTotal).toBe(41); });
});
