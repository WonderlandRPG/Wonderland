import { describe, expect, it } from "vitest";
import { isHalloweenSeasonActive } from "./halloween-season";

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
