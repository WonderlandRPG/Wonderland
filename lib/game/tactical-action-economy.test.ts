import { describe, expect, it } from "vitest";

import {
  getTacticalActionAvailability,
  initialTacticalActionUsage,
  markTacticalActionUsed,
  resetTacticalActionUsage,
} from "@/lib/game/tactical-action-economy";

const clear = { stunned: false, silenced: false, feared: false, rooted: false };

describe("tactical action economy", () => {
  it("starts with one basic, one class, one race and one item slot", () => {
    expect(
      getTacticalActionAvailability({
        outcome: "ongoing",
        usage: initialTacticalActionUsage,
        restrictions: clear,
        hasItem: true,
      }),
    ).toEqual({
      basic: true,
      classSkill: true,
      raceSkill: true,
      item: true,
      movement: true,
      endTurn: true,
    });
  });

  it("darkens only the category that was consumed", () => {
    const usage = markTacticalActionUsed(initialTacticalActionUsage, "classSkill");
    const availability = getTacticalActionAvailability({
      outcome: "ongoing",
      usage,
      restrictions: clear,
      hasItem: true,
    });

    expect(availability.classSkill).toBe(false);
    expect(availability.basic).toBe(true);
    expect(availability.raceSkill).toBe(true);
    expect(availability.item).toBe(true);
  });

  it("stun blocks every player action except ending the turn", () => {
    expect(
      getTacticalActionAvailability({
        outcome: "ongoing",
        usage: initialTacticalActionUsage,
        restrictions: { ...clear, stunned: true },
        hasItem: true,
      }),
    ).toEqual({
      basic: false,
      classSkill: false,
      raceSkill: false,
      item: false,
      movement: false,
      endTurn: true,
    });
  });

  it("silence blocks class and race skills but leaves basic and movement available", () => {
    const availability = getTacticalActionAvailability({
      outcome: "ongoing",
      usage: initialTacticalActionUsage,
      restrictions: { ...clear, silenced: true },
      hasItem: false,
    });

    expect(availability.classSkill).toBe(false);
    expect(availability.raceSkill).toBe(false);
    expect(availability.basic).toBe(true);
    expect(availability.movement).toBe(true);
    expect(availability.item).toBe(false);
  });

  it("fear blocks the basic attack but does not globally silence skills", () => {
    const availability = getTacticalActionAvailability({
      outcome: "ongoing",
      usage: initialTacticalActionUsage,
      restrictions: { ...clear, feared: true },
      hasItem: false,
    });

    expect(availability.basic).toBe(false);
    expect(availability.classSkill).toBe(true);
    expect(availability.raceSkill).toBe(true);
  });

  it("root blocks movement without consuming any action slot", () => {
    const availability = getTacticalActionAvailability({
      outcome: "ongoing",
      usage: initialTacticalActionUsage,
      restrictions: { ...clear, rooted: true },
      hasItem: false,
    });

    expect(availability.movement).toBe(false);
    expect(availability.basic).toBe(true);
  });

  it("blocks the entire action economy after victory or defeat", () => {
    for (const outcome of ["victory", "defeat", "draw"] as const) {
      const availability = getTacticalActionAvailability({
        outcome,
        usage: initialTacticalActionUsage,
        restrictions: clear,
        hasItem: true,
      });
      expect(Object.values(availability).every((value) => value === false)).toBe(true);
    }
  });

  it("resets every consumed slot for the next round", () => {
    const used = {
      basic: true,
      classSkill: true,
      raceSkill: true,
      item: true,
    };
    expect(resetTacticalActionUsage()).toEqual(initialTacticalActionUsage);
    expect(resetTacticalActionUsage()).not.toBe(used);
  });
});
