import { describe, expect, it } from "vitest";

import {
  createEmptyRacePayload,
  createRaceSlug,
  getRaceBonusTotal,
  getStructuredRaceAbilities,
  maximumRaceBonusPoints,
} from "@/lib/game/races";
import { officialRaces } from "@/lib/game/official-races";
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

  it("mantém as 11 raças oficiais completas e válidas", () => {
    expect(officialRaces.map((race) => race.name)).toEqual([
      "Aengel",
      "Draconato",
      "Lobisomem",
      "Kitsune",
      "Leonis",
      "Tiefling",
      "Vampiro",
      "Elfo",
      "Fada",
      "Humano",
      "Orc",
    ]);

    officialRaces.forEach((race) => {
      expect(racePayloadSchema.safeParse(race.payload).success).toBe(true);
      expect(getRaceBonusTotal(race.payload.attributeBonuses)).toBe(15);
      expect(race.payload.mechanics.length).toBeGreaterThan(0);
      expect(race.payload.engineContractVersion).toBe(1);
      expect(race.payload.traits.length).toBeGreaterThanOrEqual(1);
      expect(race.payload.traitsV2.length).toBeGreaterThanOrEqual(1);
      expect(race.payload.abilitiesV2).toHaveLength(5);
      expect(race.payload.progression.map((entry) => entry.level)).toEqual([
        1, 1, 25, 50, 80,
      ]);
      getStructuredRaceAbilities(race.payload).forEach((ability) => {
        expect(ability.operations.length).toBeGreaterThan(0);
        expect(ability.systemRule).toContain("Arredonde");
      });
    });
  });

  it("usa multiplicadores nas escalas diretas do catálogo oficial", () => {
    const catalogText = JSON.stringify(officialRaces);

    expect(catalogText).not.toMatch(
      /\d+% (?:do|da) (?:FOR|INT|ARC|maior atributo|atributo utilizado|dano original)/,
    );
    expect(catalogText).toContain("1,1x ARC");
    expect(catalogText).toContain("1,5x RES");
    expect(catalogText).toContain("1,35x FOR");
    expect(catalogText).toContain('"resourceKey":"race"');
  });

  it("migra habilidades do formato antigo para a progressão racial", () => {
    const legacyPayload = {
      ...createEmptyRacePayload(),
      description: "Raça antiga ainda compatível.",
      traits: [
        {
          name: "Passiva antiga",
          description: "Permanece ativa.",
          unlockLevel: 40,
        },
      ],
      abilities: [
        {
          name: "Poder legado",
          description: "Um efeito antigo.",
          unlockLevel: 20,
          manaCost: 30,
          cooldown: 2,
        },
      ],
    };

    const parsed = racePayloadSchema.parse(legacyPayload);

    expect(parsed).not.toHaveProperty("abilities");
    expect(parsed.traits[0]).toEqual({
      name: "Passiva antiga",
      description: "Permanece ativa.",
    });
    expect(parsed.progression).toContainEqual({
      level: 20,
      title: "Poder legado",
      description: "Um efeito antigo.\nCusto: 30 de Mana;\nRecarga: 2 turno(s).",
    });
  });
});
