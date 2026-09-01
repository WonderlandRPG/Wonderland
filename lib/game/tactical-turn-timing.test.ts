import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import {
  completeEnemyTacticalTurn,
  prepareEnemyTacticalTurn,
  tickTacticalCooldownValues,
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

function withMixedStatuses() {
  const base = fighter();
  return {
    ...base,
    statuses: {
      root: {
        name: "ROOT",
        duration: 2,
        stacks: 1,
        modifiers: {},
        beneficial: false,
      },
      stun: {
        name: "STUN",
        duration: 1,
        stacks: 1,
        modifiers: {},
        beneficial: false,
      },
      shieldWard: {
        name: "Proteção",
        duration: 2,
        stacks: 1,
        modifiers: { DEF: 15 },
        beneficial: true,
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

  it("ticks stacked player controls independently without consuming buffs early", () => {
    const prepared = prepareEnemyTacticalTurn(withMixedStatuses(), fighter());

    expect(prepared.player.statuses.root?.duration).toBe(1);
    expect(prepared.player.statuses.stun).toBeUndefined();
    expect(prepared.player.statuses.shieldWard?.duration).toBe(2);
  });

  it("expires player buffs at enemy-turn completion without reviving expired controls", () => {
    const prepared = prepareEnemyTacticalTurn(withMixedStatuses(), fighter());
    const completed = completeEnemyTacticalTurn(prepared.player, prepared.enemy);

    expect(completed.player.statuses.root?.duration).toBe(1);
    expect(completed.player.statuses.stun).toBeUndefined();
    expect(completed.player.statuses.shieldWard?.duration).toBe(1);
  });

  it("uses the mirrored timing rule for enemy buffs and debuffs", () => {
    const enemy = withMixedStatuses();
    const prepared = prepareEnemyTacticalTurn(fighter(), enemy);

    expect(prepared.enemy.statuses.root?.duration).toBe(2);
    expect(prepared.enemy.statuses.stun?.duration).toBe(1);
    expect(prepared.enemy.statuses.shieldWard?.duration).toBe(1);

    const completed = completeEnemyTacticalTurn(prepared.player, prepared.enemy);
    expect(completed.enemy.statuses.root?.duration).toBe(1);
    expect(completed.enemy.statuses.stun).toBeUndefined();
    expect(completed.enemy.statuses.shieldWard?.duration).toBe(1);
  });

  it("ticks cooldowns once per completed enemy turn and never below zero", () => {
    const base = fighter();
    const combatant = {
      ...base,
      cooldowns: { ready: 0, almost: 1, long: 3 },
    };

    const ticked = tickTacticalCooldownValues(combatant);

    expect(ticked.cooldowns).toEqual({ ready: 0, almost: 0, long: 2 });
  });
});
