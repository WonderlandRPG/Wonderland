import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import {
  canUseTacticalOffense,
  canUseTacticalSkills,
  getTacticalFearTurns,
  getTacticalRootTurns,
  getTacticalSilenceTurns,
  getTacticalStunTurns,
  getTacticalTaunt,
  isTacticalTurnDisabled,
} from "@/lib/game/tactical-control";

function fighter() {
  return createCombatant({
    id: "fighter",
    name: "Fighter",
    attributes: { FOR: 10, DEF: 10, RES: 10, INI: 10, INT: 10, ARC: 10 },
    baseHp: 100,
    baseMana: 0,
    usesMana: false,
  });
}

describe("tactical control status helpers", () => {
  it("treats root as movement control without disabling the whole turn", () => {
    const combatant = fighter();
    combatant.statuses["root-vinhas"] = {
      name: "Enraizado",
      duration: 2,
      stacks: 1,
      modifiers: {},
      beneficial: false,
    };

    expect(getTacticalRootTurns(combatant)).toBe(2);
    expect(getTacticalStunTurns(combatant)).toBe(0);
    expect(isTacticalTurnDisabled(combatant)).toBe(false);
  });

  it("treats stun as a full turn disable", () => {
    const combatant = fighter();
    combatant.statuses["stun-impacto"] = {
      name: "Atordoado",
      duration: 1,
      stacks: 1,
      modifiers: {},
      beneficial: false,
    };

    expect(getTacticalStunTurns(combatant)).toBe(1);
    expect(isTacticalTurnDisabled(combatant)).toBe(true);
    expect(canUseTacticalSkills(combatant)).toBe(false);
    expect(canUseTacticalOffense(combatant)).toBe(false);
  });

  it("silence blocks skills but not basic offense", () => {
    const combatant = fighter();
    combatant.statuses["silence-arcano"] = {
      name: "Silenciado",
      duration: 2,
      stacks: 1,
      modifiers: {},
      beneficial: false,
    };

    expect(getTacticalSilenceTurns(combatant)).toBe(2);
    expect(canUseTacticalSkills(combatant)).toBe(false);
    expect(canUseTacticalOffense(combatant)).toBe(true);
  });

  it("fear blocks offensive actions without becoming stun", () => {
    const combatant = fighter();
    combatant.statuses["fear-terror"] = {
      name: "Medo",
      duration: 1,
      stacks: 1,
      modifiers: {},
      beneficial: false,
    };

    expect(getTacticalFearTurns(combatant)).toBe(1);
    expect(isTacticalTurnDisabled(combatant)).toBe(false);
    expect(canUseTacticalOffense(combatant)).toBe(false);
  });

  it("reads the forced target from taunt", () => {
    const combatant = fighter();
    combatant.statuses["taunt-guardiao"] = {
      name: "Provocado",
      duration: 2,
      stacks: 1,
      modifiers: {},
      beneficial: false,
      forcedTargetId: "guardiao",
    };

    expect(getTacticalTaunt(combatant)).toEqual({ turns: 2, targetId: "guardiao" });
  });

  it("uses the longest matching duration when multiple controls exist", () => {
    const combatant = fighter();
    combatant.statuses["root-one"] = {
      name: "Root",
      duration: 1,
      stacks: 1,
      modifiers: {},
      beneficial: false,
    };
    combatant.statuses["root-two"] = {
      name: "Imobilizado",
      duration: 3,
      stacks: 1,
      modifiers: {},
      beneficial: false,
    };

    expect(getTacticalRootTurns(combatant)).toBe(3);
  });
});
