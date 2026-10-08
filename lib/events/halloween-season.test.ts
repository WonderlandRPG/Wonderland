import { describe, expect, it } from "vitest";
import { getHalloweenEventProgress, isHalloweenSeasonActive } from "./halloween-season";

describe("isHalloweenSeasonActive", () => {
  it("starts at midnight on October 7 in São Paulo", () => {
    expect(isHalloweenSeasonActive(new Date("2026-10-07T02:59:59Z"))).toBe(false);
    expect(isHalloweenSeasonActive(new Date("2026-10-07T03:00:00Z"))).toBe(true);
  });

  it("remains active through all of October 31 in São Paulo", () => {
    expect(isHalloweenSeasonActive(new Date("2026-11-01T02:59:59Z"))).toBe(true);
    expect(isHalloweenSeasonActive(new Date("2026-11-01T03:00:00Z"))).toBe(false);
  });
});

describe("Halloween event progress", () => {
  it("counts preparation days at São Paulo midnight", () => {
    expect(getHalloweenEventProgress(new Date("2026-10-08T02:59:59Z"))).toEqual({
      percent: 0,
      active: false,
    });
    expect(getHalloweenEventProgress(new Date("2026-10-08T03:00:00Z"))).toEqual({
      percent: 4,
      active: true,
    });
    expect(getHalloweenEventProgress(new Date("2026-10-09T03:00:00Z"))).toEqual({
      percent: 9,
      active: true,
    });
  });

  it("increases every day and reaches exactly 100% on October 30", () => {
    const percentages = Array.from(
      { length: 23 },
      (_, index) =>
        getHalloweenEventProgress(
          new Date(`2026-10-${String(index + 8).padStart(2, "0")}T12:00:00-03:00`),
        ).percent,
    );
    for (let index = 1; index < percentages.length; index++) {
      expect(percentages[index]).toBeGreaterThan(percentages[index - 1]);
    }
    expect(getHalloweenEventProgress(new Date("2026-10-30T02:59:59Z")).percent).toBe(96);
    expect(getHalloweenEventProgress(new Date("2026-10-30T03:00:00Z")).percent).toBe(100);
  });

  it("keeps 100% through Halloween and hides after the season", () => {
    expect(getHalloweenEventProgress(new Date("2026-11-01T02:59:59Z"))).toEqual({
      percent: 100,
      active: true,
    });
    expect(getHalloweenEventProgress(new Date("2026-11-01T03:00:00Z"))).toEqual({
      percent: 100,
      active: false,
    });
  });
});
