import { describe, expect, it } from "vitest";

import { adventureRanks } from "@/lib/game/ranks";

describe("identidade visual dos Ranks", () => {
  it("mantém uma atmosfera própria para cada Rank", () => {
    expect(new Set(adventureRanks.map((rank) => rank.atmosphere)).size).toBe(adventureRanks.length);
  });

  it("mantém a progressão oficial", () => {
    expect(adventureRanks.map((rank) => rank.key)).toEqual(["E", "D", "C", "B", "A", "S", "EX"]);
  });
});
