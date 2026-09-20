import { describe, expect, it } from "vitest";
import { arenaModes, arenaRewards } from "@/lib/game/arena";

describe("Arena do Rework", () => {
  it("expõe somente PvE e PvP", () => {
    expect(arenaModes).toEqual(["pve", "pvp"]);
  });

  it("mantém a tabela oficial de recompensas", () => {
    expect(arenaRewards.E).toEqual({ xp: 500, wg: 100 });
    expect(arenaRewards.EX).toEqual({ xp: 30000, wg: 25000 });
  });
});
