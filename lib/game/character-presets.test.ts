import { describe, expect, it } from "vitest";

import { buildCharacterPreset } from "@/lib/game/character-presets";
import { getAllocatedTotal } from "@/lib/game/characters";

const race = { FOR: 5, DEF: 1, RES: 2, INI: 4, INT: 2, ARC: 1 };

describe("presets de atributos", () => {
  it("distribui exatamente todos os pontos", () => {
    for (const preset of ["aggressive", "balanced", "defensive"] as const) {
      expect(
        getAllocatedTotal(
          buildCharacterPreset({ preset, points: 100, racialBonuses: race, primaryAttributes: ["FOR", "INI"] }),
        ),
      ).toBe(100);
    }
  });

  it("considera a raça, a classe e o estilo escolhido", () => {
    const aggressive = buildCharacterPreset({ preset: "aggressive", points: 100, racialBonuses: race, primaryAttributes: ["FOR", "INI"] });
    const defensive = buildCharacterPreset({ preset: "defensive", points: 100, racialBonuses: race, primaryAttributes: ["FOR", "INI"] });
    expect(aggressive.FOR + aggressive.INI).toBeGreaterThan(aggressive.DEF + aggressive.RES);
    expect(defensive.DEF + defensive.RES).toBeGreaterThan(aggressive.DEF + aggressive.RES);
  });
});
