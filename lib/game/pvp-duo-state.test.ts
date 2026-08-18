import { describe, expect, it } from "vitest";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import { chooseDuoTarget, createInitialPvpDuoState, livingTeamMembers } from "@/lib/game/pvp-duo-state";

function character(id: string, name: string, initiative: number): ArenaCharacter {
  return {
    id,
    name,
    level: 10,
    adventureRank: "E",
    imageUrl: "",
    equippedTitle: null,
    raceName: "Humano",
    className: "Guerreiro",
    baseHp: 500,
    baseMana: 0,
    classResource: { name: "Bravura", initial: 0, maximum: 5 },
    raceResource: null,
    usesMana: false,
    basicAttackRange: 1,
    basicAttackDamageType: "physical",
    attributes: { FOR: 30, DEF: 20, RES: 20, INI: initiative, INT: 10, ARC: 10 },
    skills: [],
    raceAbilities: [],
    items: [],
    combatLore: [],
    equipmentEffects: [],
  };
}

describe("PvP 2x2", () => {
  it("cria quatro combatentes e ordena todos pela iniciativa", () => {
    const state = createInitialPvpDuoState(
      [character("a", "A", 30), character("b", "B", 10)],
      [character("c", "C", 40), character("d", "D", 20)],
    );

    expect(Object.keys(state.fighters)).toHaveLength(4);
    expect(state.teamOne).toEqual(["a", "b"]);
    expect(state.teamTwo).toEqual(["c", "d"]);
    expect(state.turnOrder).toEqual(["c", "a", "d", "b"]);
    expect(state.activeCharacterId).toBe("c");
  });

  it("escolhe como alvo vivo o adversário com menor percentual de HP", () => {
    const state = createInitialPvpDuoState(
      [character("a", "A", 30), character("b", "B", 10)],
      [character("c", "C", 40), character("d", "D", 20)],
    );
    state.fighters.c.hp = state.fighters.c.maxHp;
    state.fighters.d.hp = Math.round(state.fighters.d.maxHp * 0.2);
    expect(chooseDuoTarget(state, "a")).toBe("d");

    state.fighters.d.hp = 0;
    expect(chooseDuoTarget(state, "a")).toBe("c");
    expect(livingTeamMembers(state, state.teamTwo)).toEqual(["c"]);
  });
});
