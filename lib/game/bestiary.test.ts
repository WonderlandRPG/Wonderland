import { describe, expect, it } from "vitest";
import {
  getCreatureCombatWeights,
  getCreatureImageUrl,
  getCreatureWeaknessBonus,
  getCreatureWeaknessKind,
} from "@/lib/game/bestiary";

describe("bestiary PvE integration", () => {
  it("maps every creature slug to its illustrated portrait", () => {
    expect(getCreatureImageUrl("lobo-cinzento")).toBe("/images/bestiary/lobo-cinzento.webp");
    expect(getCreatureImageUrl("fênix")).toBe("/images/bestiary/fenix.webp");
  });

  it("turns known field weaknesses into a combat damage type", () => {
    expect(getCreatureWeaknessKind(["flancos", "terreno lamacento"])).toBe("physical");
    expect(getCreatureWeaknessKind(["fogo", "luz sagrada"])).toBe("magic");
  });

  it("adds 25% damage only when the player hits the active weakness", () => {
    const creature = { weaknessKind: "magic" as const, weaknessMultiplier: 1.25 };
    expect(getCreatureWeaknessBonus(100, "magic", creature)).toBe(25);
    expect(getCreatureWeaknessBonus(100, "physical", creature)).toBe(0);
  });

  it("gives different combat profiles to beasts and constructs", () => {
    expect(getCreatureCombatWeights("Fera")).not.toEqual(getCreatureCombatWeights("Construto"));
  });
});
