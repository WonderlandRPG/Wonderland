import { describe, expect, it } from "vitest";

import {
  createEmptyRacePayload,
  createRaceSlug,
  getRaceBonusTotal,
  maximumRaceBonusPoints,
} from "@/lib/game/races";
import { racePayloadSchema } from "@/lib/game/schemas";

describe("regras das raças", () => {
  it("transforma o nome em um slug seguro", () => {
    expect(createRaceSlug("  Aèngel Celestial! ")).toBe("aengel-celestial");
  });

  it("aceita exatamente o limite de pontos raciais", () => {
    const payload = createEmptyRacePayload();
    payload.description = "Uma raça pronta para os testes.";
    payload.attributeBonuses = { FOR: 5, DEF: 4, RES: 4, INI: 4, INT: 4, ARC: 4 };

    expect(getRaceBonusTotal(payload.attributeBonuses)).toBe(maximumRaceBonusPoints);
    expect(racePayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("recusa bônus raciais acima de 25 pontos", () => {
    const payload = createEmptyRacePayload();
    payload.description = "Uma raça inválida para o teste.";
    payload.attributeBonuses.FOR = 26;

    const result = racePayloadSchema.safeParse(payload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("25 pontos");
    }
  });

  it("recusa imagem que não seja um endereço válido", () => {
    const payload = createEmptyRacePayload();
    payload.description = "Uma raça com imagem inválida.";
    payload.imageUrl = "imagem-local";

    expect(racePayloadSchema.safeParse(payload).success).toBe(false);
  });
});
