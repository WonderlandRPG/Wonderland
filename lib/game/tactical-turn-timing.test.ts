import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import {
  completeEnemyTacticalTurn,
  prepareEnemyTacticalTurn,
} from "@/lib/game/tactical-turn-timing";

function fighter() {
  return createCombatant({
    id: "fighter",
    name: "Fighter",
    attributes: { FOR: 50, DEF: 50, RES: 50, INI: 50, INT: 50, ARC: 50 },
    baseHp: 500,
    baseMana: 100,
  });
}

function withStatus(beneficial: boolean) {
  const base = fighter();
  return {
    ...base,
    statuses: {
      test: {
        name: "Teste",
        duration: 1,
        stacks: 1,
        modifiers: { DEF: beneficial ? 10 : -10 },
        beneficial,
      },
    },
  };
}

describe("tactical turn timing", () => {
  it("keeps a player buff active while the enemy is about to act", () => {
    const prepared = prepareEnemyTacticalTurn(withStatus(true), fighter());
    expect(prepared.player.statuses.test?.duration).toBe(1);
  });

  it("advances a player negative status after it affected the player turn", () => {
    const prepared = prepareEnemyTacticalTurn(withStatus(false), fighter());
    expect(prepared.player.statuses.test).toBeUndefined();
  });

  it("advances player buffs only after the enemy action", () => {
    const completed = completeEnemyTacticalTurn(withStatus(true), fighter());
    expect(completed.player.statuses.test).toBeUndefined();
  });

  it("keeps a newly applied player negative status for the next player turn", () => {
    const completed = completeEnemyTacticalTurn(withStatus(false), fighter());
    expect(completed.player.statuses.test?.duration).toBe(1);
  });
});
