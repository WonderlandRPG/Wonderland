import { describe, expect, it } from "vitest";
import { getCombatStatusVisual, visualFromStatusText } from "@/lib/game/combat-status-visual";

describe("combat status visuals", () => {
  it("maps positive FOR modifiers to the vector strength glyph", () => {
    expect(getCombatStatusVisual({ name: "Força elevada", duration: 2, beneficial: true, modifiers: { FOR: 10 } })).toEqual({
      kind: "buff",
      iconKey: "for",
      label: "Força",
    });
  });

  it("maps negative FOR modifiers to the same semantic glyph with debuff state", () => {
    expect(getCombatStatusVisual({ name: "Força reduzida", duration: 2, beneficial: false, modifiers: { FOR: -10 } })).toEqual({
      kind: "debuff",
      iconKey: "for",
      label: "Força",
    });
  });

  it("recognizes common negative status text for legacy combat cards", () => {
    expect(visualFromStatusText("Veneno · 3T")).toEqual({ kind: "debuff", iconKey: "poison", label: "Veneno" });
  });
});
