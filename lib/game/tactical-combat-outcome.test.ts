import { describe, expect, it } from "vitest";

import {
  canTacticalPlayerAct,
  getTacticalCombatOutcome,
  getTacticalCombatOutcomeMessage,
  isTacticalCombatFinished,
  shouldStartNextTacticalRound,
} from "@/lib/game/tactical-combat-outcome";

describe("tactical combat outcome", () => {
  it("keeps combat ongoing while both combatants are alive", () => {
    const outcome = getTacticalCombatOutcome({ hp: 10 }, { hp: 10 });

    expect(outcome).toBe("ongoing");
    expect(isTacticalCombatFinished(outcome)).toBe(false);
    expect(canTacticalPlayerAct(outcome)).toBe(true);
    expect(shouldStartNextTacticalRound(outcome)).toBe(true);
  });

  it("returns victory when only the enemy reaches zero HP", () => {
    const outcome = getTacticalCombatOutcome({ hp: 10 }, { hp: 0 });

    expect(outcome).toBe("victory");
    expect(isTacticalCombatFinished(outcome)).toBe(true);
    expect(canTacticalPlayerAct(outcome)).toBe(false);
    expect(shouldStartNextTacticalRound(outcome)).toBe(false);
    expect(
      getTacticalCombatOutcomeMessage({ outcome, playerName: "Colten", enemyName: "Besouro" }),
    ).toBe("Besouro foi derrotado. Colten venceu o combate.");
  });

  it("returns defeat when only the player reaches zero HP", () => {
    const outcome = getTacticalCombatOutcome({ hp: 0 }, { hp: 10 });

    expect(outcome).toBe("defeat");
    expect(isTacticalCombatFinished(outcome)).toBe(true);
    expect(canTacticalPlayerAct(outcome)).toBe(false);
    expect(shouldStartNextTacticalRound(outcome)).toBe(false);
  });

  it("returns draw when both combatants reach zero HP", () => {
    const outcome = getTacticalCombatOutcome({ hp: 0 }, { hp: 0 });

    expect(outcome).toBe("draw");
    expect(isTacticalCombatFinished(outcome)).toBe(true);
    expect(canTacticalPlayerAct(outcome)).toBe(false);
    expect(shouldStartNextTacticalRound(outcome)).toBe(false);
  });

  it("treats negative HP as defeated", () => {
    expect(getTacticalCombatOutcome({ hp: -5 }, { hp: 3 })).toBe("defeat");
    expect(getTacticalCombatOutcome({ hp: 4 }, { hp: -1 })).toBe("victory");
  });
});
