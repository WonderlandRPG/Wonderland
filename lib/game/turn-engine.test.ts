import { describe, expect, it } from "vitest";

import { buildTurnOrder, createBattleState, getNextTurn } from "@/lib/game/turn-engine";
import { createCombatant } from "@/lib/game/combat";

const attrs = { FOR: 20, DEF: 20, RES: 20, INI: 20, INT: 20, ARC: 20 };

function fighter(id: string, ini: number) {
  return createCombatant({
    id,
    name: id,
    attributes: { ...attrs, INI: ini },
    baseHp: 100,
    baseMana: 50,
  });
}

describe("JRPG turn engine", () => {
  it("orders fighters by initiative with a deterministic tie breaker", () => {
    expect(
      buildTurnOrder([
        { id: "b", initiative: 20 },
        { id: "a", initiative: 20 },
        { id: "c", initiative: 10 },
      ]),
    ).toEqual(["a", "b", "c"]);
  });

  it("creates a battle with the fastest fighter active", () => {
    const state = createBattleState({ fighters: { slow: fighter("slow", 10), fast: fighter("fast", 40) } });
    expect(state.activeCharacterId).toBe("fast");
    expect(state.turnOrder).toEqual(["fast", "slow"]);
    expect(state.round).toBe(1);
  });

  it("advances rounds after the last living fighter acts", () => {
    const fighters = { a: fighter("a", 20), b: fighter("b", 10) };
    expect(
      getNextTurn({
        round: 1,
        turn: 2,
        turnOrder: ["a", "b"],
        activeCharacterId: "b",
        fighters,
      }),
    ).toEqual({ round: 2, turn: 3, turnOrder: ["a", "b"], activeCharacterId: "a" });
  });

  it("removes defeated fighters from future turns", () => {
    const defeated = { ...fighter("b", 10), hp: 0 };
    const fighters = { a: fighter("a", 20), b: defeated, c: fighter("c", 5) };
    expect(
      getNextTurn({
        round: 1,
        turn: 1,
        turnOrder: ["a", "b", "c"],
        activeCharacterId: "a",
        fighters,
      }).activeCharacterId,
    ).toBe("c");
  });
});
