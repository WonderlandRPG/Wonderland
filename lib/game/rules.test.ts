import { describe, expect, it } from "vitest";

import {
  calculateLevelFromXp,
  calculateMana,
  normalizeAttributes,
  toFiniteNumber,
} from "@/lib/game/rules";

describe("motor central de regras", () => {
  it("substitui entradas numéricas inválidas por um valor seguro", () => {
    expect(toFiniteNumber("NaN", 7)).toBe(7);
    expect(toFiniteNumber(undefined, 3)).toBe(3);
  });

  it("nunca devolve Mana NaN", () => {
    const mana = calculateMana({
      baseMana: "indefinida",
      intelligence: undefined,
      intelligenceMultiplier: Number.NaN,
    });

    expect(mana).toBe(0);
    expect(Number.isFinite(mana)).toBe(true);
  });

  it("preserva o nível salvo quando a progressão ainda não carregou", () => {
    expect(
      calculateLevelFromXp({
        currentXp: 999999,
        currentLevel: 100,
        maxLevel: 100,
        thresholds: [],
      }),
    ).toBe(100);
  });

  it("calcula o nível pela tabela oficial quando ela está disponível", () => {
    expect(
      calculateLevelFromXp({
        currentXp: 650,
        currentLevel: 1,
        maxLevel: 100,
        thresholds: [
          { level: 1, requiredXp: 0 },
          { level: 2, requiredXp: 100 },
          { level: 3, requiredXp: 500 },
          { level: 4, requiredXp: 900 },
        ],
      }),
    ).toBe(3);
  });

  it("combina atributos usando sempre números finitos", () => {
    expect(
      normalizeAttributes({ FOR: 20, INT: 20 }, { FOR: "5", INT: "inválido", ARC: 3 }),
    ).toEqual({ FOR: 25, DEF: 0, RES: 0, INI: 0, INT: 20, ARC: 3 });
  });
});
