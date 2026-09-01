import { describe, expect, it } from "vitest";
import { getSaoPauloDate, isSeptemberYellowActive } from "./september-yellow";

describe("September Yellow campaign period", () => {
  it("starts on August 31 in São Paulo", () => {
    const start = new Date("2026-08-31T12:00:00Z");
    expect(getSaoPauloDate(start)).toBe("2026-08-31");
    expect(isSeptemberYellowActive(start)).toBe(true);
  });

  it("stays active through September 30", () => {
    expect(isSeptemberYellowActive(new Date("2026-09-30T23:00:00-03:00"))).toBe(true);
  });

  it("is hidden outside the campaign period", () => {
    expect(isSeptemberYellowActive(new Date("2026-08-30T12:00:00-03:00"))).toBe(false);
    expect(isSeptemberYellowActive(new Date("2026-10-01T12:00:00-03:00"))).toBe(false);
  });
});
