import { describe, expect, it } from "vitest";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import {
  createInitialPvpCasualState,
  createPvpCasualFormation,
  pvpCasualFormatDetails,
  pvpCasualFormats,
} from "@/lib/game/pvp-casual";
import { tacticalPositionKey } from "@/lib/game/tactical-grid";
import { TACTICAL_MAPS } from "@/lib/game/tactical-maps";

function character(id: string, initiative: number): ArenaCharacter {
  return {
    id,
    name: id.toUpperCase(),
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

describe("fundação do PvP casual tático", () => {
  it("define 1x1, 2x2 e 3x3 com a quantidade correta de jogadores", () => {
    expect(pvpCasualFormats).toEqual(["solo", "duo", "trio"]);
    expect(Object.values(pvpCasualFormatDetails).map((entry) => entry.requiredPlayers)).toEqual([
      2, 4, 6,
    ]);
  });

  it.each(TACTICAL_MAPS)("cria formações válidas para 3x3 em $name", (map) => {
    const formation = createPvpCasualFormation("trio", map.id);
    const positions = [...formation.teamOne, ...formation.teamTwo];
    const keys = positions.map(tacticalPositionKey);

    expect(formation.teamOne).toHaveLength(3);
    expect(formation.teamTwo).toHaveLength(3);
    expect(new Set(keys).size).toBe(6);
    expect(keys.every((key) => !map.obstacles.includes(key))).toBe(true);
    expect(
      positions.every(({ x, y }) => x >= 0 && x < map.grid.width && y >= 0 && y < map.grid.height),
    ).toBe(true);
  });

  it.each([
    ["solo", 1],
    ["duo", 2],
    ["trio", 3],
  ] as const)("cria o estado autoritativo do formato %s", (format, size) => {
    const teamOne = Array.from({ length: size }, (_, index) => character(`a${index}`, 20 + index));
    const teamTwo = Array.from({ length: size }, (_, index) => character(`b${index}`, 40 + index));
    const state = createInitialPvpCasualState({
      format,
      mapId: "ruinas-centrais",
      teamOne,
      teamTwo,
    });

    expect(Object.keys(state.fighters)).toHaveLength(size * 2);
    expect(Object.keys(state.positions)).toHaveLength(size * 2);
    expect(state.teamOne).toHaveLength(size);
    expect(state.teamTwo).toHaveLength(size);
    expect(state.turnOrder).toHaveLength(size * 2);
    expect(state.activeCharacterId).toBe(`b${size - 1}`);
    expect(state.status).toBe("active");
  });

  it("rejeita equipes incompletas e personagens duplicados", () => {
    expect(() =>
      createInitialPvpCasualState({
        format: "trio",
        mapId: "ruinas-centrais",
        teamOne: [character("a", 1), character("b", 2)],
        teamTwo: [character("c", 3), character("d", 4)],
      }),
    ).toThrow(/exatamente 3/);

    expect(() =>
      createInitialPvpCasualState({
        format: "solo",
        mapId: "ruinas-centrais",
        teamOne: [character("a", 1)],
        teamTwo: [character("a", 2)],
      }),
    ).toThrow(/mais de uma vaga/);
  });
});
