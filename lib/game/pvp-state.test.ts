import { describe, expect, it } from "vitest";
import { defaultCombatRules } from "@/lib/game/combat";
import { createInitialPvpState } from "@/lib/game/pvp-state";
import type { ArenaCharacter } from "@/lib/game/arena-types";

function fighter(id: string, initiative: number): ArenaCharacter {
  return {
    id,
    name: id,
    level: 10,
    adventureRank: "E",
    imageUrl: "",
    equippedTitle: null,
    raceName: "Humano",
    className: "Guerreiro",
    baseHp: 400,
    baseMana: 0,
    classResource: { name: "Ímpeto", initial: 0, maximum: 5 },
    raceResource: null,
    usesMana: false,
    basicAttackRange: 1,
    attributes: { FOR: 30, DEF: 20, RES: 20, INI: initiative, INT: 10, ARC: 10 },
    skills: [],
    raceAbilities: [],
    items: [],
    combatLore: [],
    equipmentEffects: [],
  };
}

describe("estado compartilhado do PvP", () => {
  it("cria uma única rodada com os dois combatentes e iniciativa determinística", () => {
    const state = createInitialPvpState(
      fighter("jogador-a", 20),
      fighter("jogador-b", 40),
      defaultCombatRules,
    );
    expect(state.activeCharacterId).toBe("jogador-b");
    expect(Object.keys(state.fighters)).toEqual(["jogador-a", "jogador-b"]);
    expect(state.positions["jogador-a"]).toEqual({ x: 1, y: 7 });
    expect(state.positions["jogador-b"]).toEqual({ x: 18, y: 7 });
    expect(state.status).toBe("active");
    expect(state.turn).toBe(1);
  });
});
