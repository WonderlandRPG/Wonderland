import { describe, expect, it } from "vitest";

import { adventureRanks, applyAdventureRankEffect } from "@/lib/game/ranks";

const base = { FOR: 20, DEF: 20, RES: 20, INI: 20, INT: 20, ARC: 20 };

describe("efeitos exclusivos dos Ranks", () => {
  it("mantém um efeito próprio e nomeado para cada Rank", () => {
    expect(new Set(adventureRanks.map((rank) => rank.effect.name)).size).toBe(
      adventureRanks.length,
    );
  });

  it("aplica apenas o efeito do Rank atual", () => {
    expect(applyAdventureRankEffect(base, "E")).toEqual({ ...base, RES: 26 });
    expect(applyAdventureRankEffect(base, "D")).toEqual({ ...base, INI: 26 });
    expect(applyAdventureRankEffect(base, "B")).toEqual({ ...base, DEF: 26 });
  });

  it("reserva ao EX a maior bênção geral", () => {
    expect(applyAdventureRankEffect(base, "EX")).toEqual({
      FOR: 27,
      DEF: 27,
      RES: 27,
      INI: 27,
      INT: 27,
      ARC: 27,
    });
  });
});
