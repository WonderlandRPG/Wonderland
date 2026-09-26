import { describe, expect, it } from "vitest";
import {
  areAdjacentRankedTiers,
  getRankedStanding,
  rankedPdlDelta,
  rankedTiers,
} from "@/lib/game/ranked";

describe("ranqueada 2x2", () => {
  it("possui todos os nove elos oficiais", () => {
    expect(rankedTiers).toEqual([
      "Ferro",
      "Bronze",
      "Prata",
      "Ouro",
      "Platina",
      "Diamante",
      "Mestre",
      "Grão-Mestre",
      "Lenda",
    ]);
  });

  it("converte PdL em elo e divisão", () => {
    expect(getRankedStanding(0)).toMatchObject({ tier: "Ferro", division: "IV" });
    expect(getRankedStanding(825)).toMatchObject({ tier: "Prata", division: "I" });
    expect(getRankedStanding(1800)).toMatchObject({ tier: "Mestre", division: null });
    expect(getRankedStanding(2400)).toMatchObject({ tier: "Lenda", division: null });
  });

  it("limita o matchmaking ao próprio elo e aos adjacentes", () => {
    expect(areAdjacentRankedTiers("Ouro", "Platina")).toBe(true);
    expect(areAdjacentRankedTiers("Ouro", "Ouro")).toBe(true);
    expect(areAdjacentRankedTiers("Ouro", "Diamante")).toBe(false);
  });

  it("usa variação maior nas cinco partidas de posicionamento", () => {
    expect(
      Math.abs(rankedPdlDelta({ won: true, ownPdl: 900, opponentPdl: 900, placementGames: 0 })),
    ).toBe(32);
    expect(
      Math.abs(rankedPdlDelta({ won: true, ownPdl: 900, opponentPdl: 900, placementGames: 5 })),
    ).toBe(16);
  });
});
