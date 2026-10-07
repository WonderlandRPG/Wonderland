import { describe, expect, it } from "vitest";
import { calculateKingdomShopMultiplier } from "./shop-pricing";

describe("calculateKingdomShopMultiplier", () => {
  it("includes the arsenal pressure used by the database purchase function", () => {
    const multiplier = calculateKingdomShopMultiplier({
      market_stars: 0,
      arsenal: 55,
      penalty_until: null,
      shop_markup_percent: 0,
    });

    expect(multiplier).toBeCloseTo(1.187686305646875, 12);
    expect(Math.round(850 * multiplier)).toBe(1010);
  });

  it("combines market stars, low arsenal and an active penalty multiplicatively", () => {
    const multiplier = calculateKingdomShopMultiplier(
      {
        market_stars: 2,
        arsenal: 59,
        penalty_until: "2026-10-08T00:00:00.000Z",
        shop_markup_percent: 10,
      },
      new Date("2026-10-07T00:00:00.000Z"),
    );

    expect(multiplier).toBeCloseTo(0.94 * 1.035 * 1.1, 12);
  });
});
