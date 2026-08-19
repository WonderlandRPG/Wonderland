import { describe, expect, it } from "vitest";
import { getCombatStatusVisual, visualFromStatusText } from "@/lib/game/combat-status-visual";

describe("combat status visuals", () => {
  it("maps positive FOR modifiers to a strength buff icon", () => {
    expect(getCombatStatusVisual({ name: "Força elevada", duration: 2, beneficial: true, modifiers: { FOR: 10 } })).toEqual({
      kind: "buff",
      icon: "💪",
      label: "Força",
    });
  });

  it("maps negative FOR modifiers to a strength debuff icon state", () => {
    expect(getCombatStatusVisual({ name: "Força reduzida", duration: 2, beneficial: false, modifiers: { FOR: -10 } })).toEqual({
      kind: "debuff",
      icon: "💪",
      label: "Força",
    });
  });

  it("recognizes common negative status text for legacy combat cards", () => {
    expect(visualFromStatusText("Veneno · 3T")).toEqual({ kind: "debuff", icon: "☠️", label: "Veneno" });
  });
});
