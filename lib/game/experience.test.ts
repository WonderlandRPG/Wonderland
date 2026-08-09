import { describe, expect, it } from "vitest";
import {
  getLevelFromExperience,
  getLevelProgress,
  officialExperience,
} from "@/lib/game/experience";

describe("progressão oficial", () => {
  it("contém os 100 níveis oficiais", () => {
    expect(officialExperience).toHaveLength(100);
    expect(officialExperience[99]).toBe(535000);
  });
  it("calcula o nível pelos limites totais", () => {
    expect(getLevelFromExperience(0)).toBe(1);
    expect(getLevelFromExperience(99)).toBe(1);
    expect(getLevelFromExperience(100)).toBe(2);
    expect(getLevelFromExperience(106000)).toBe(50);
    expect(getLevelFromExperience(999999)).toBe(100);
  });
  it("calcula o avanço dentro do nível", () => {
    expect(getLevelProgress(175).percent).toBe(50);
  });
});
