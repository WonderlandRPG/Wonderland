import { describe, expect, it } from "vitest";
import { getCombatStatusVisual, visualFromStatusText } from "@/lib/game/combat-status-visual";

describe("combat status visuals", () => {
  it("maps positive FOR modifiers to the vector strength glyph", () => {
    expect(
      getCombatStatusVisual({
        name: "Força elevada",
        duration: 2,
        beneficial: true,
        modifiers: { FOR: 10 },
      }),
    ).toEqual({
      kind: "buff",
      iconKey: "for",
      label: "Força",
    });
  });

  it("maps negative FOR modifiers to the same semantic glyph with debuff state", () => {
    expect(
      getCombatStatusVisual({
        name: "Força reduzida",
        duration: 2,
        beneficial: false,
        modifiers: { FOR: -10 },
      }),
    ).toEqual({
      kind: "debuff",
      iconKey: "for",
      label: "Força",
    });
  });

  it("recognizes common negative status text for legacy combat cards", () => {
    expect(visualFromStatusText("Veneno · 3T")).toEqual({
      kind: "debuff",
      iconKey: "poison",
      label: "Veneno",
    });
  });

  it.each([
    ["Amedrontado · 1T", "fear", "Medo"],
    ["Enraizado · 2T", "root", "Imobilizado"],
    ["Cego · 1T", "blind", "Cegueira"],
    ["Provocado · 2T", "taunt", "Provocado"],
    ["Armadura dissolvida · 2T", "vulnerable", "Vulnerável"],
  ])("gives %s its own readable icon", (status, iconKey, label) => {
    expect(visualFromStatusText(status)).toEqual({ kind: "debuff", iconKey, label });
  });

  it.each([
    ["Fúria imortal · 3T", "immune", "Imunidade"],
    ["Forma dracônica · 3T", "form", "Transformação"],
    ["Servo descarnado · 3T", "summon", "Invocação"],
  ])("gives %s its own readable icon", (status, iconKey, label) => {
    expect(visualFromStatusText(status)).toEqual({ kind: "buff", iconKey, label });
  });
});
