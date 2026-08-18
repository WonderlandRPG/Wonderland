import { buildAdaptiveMonsterAttributes } from "@/lib/game/arena";
import { createCombatant, defaultCombatRules, type CombatantState } from "@/lib/game/combat";
import { createPvpCombatant } from "@/lib/game/pvp-state";
import { firstDungeon } from "@/lib/game/dungeons";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import { buildTurnOrder } from "@/lib/game/turn-engine";

export type DungeonBattleState = {
  encounterIndex: number;
  round: number;
  turn: number;
  activeCharacterId: string;
  turnOrder: string[];
  partyOrder: string[];
  fighters: Record<string, CombatantState>;
  monster: CombatantState;
  status: "active" | "victory" | "defeat";
  message: string;
  log: string[];
};

export function createDungeonMonster(party: ArenaCharacter[], encounterIndex: number) {
  const encounter = firstDungeon.encounters[encounterIndex];
  const average = Object.fromEntries(
    ["FOR", "DEF", "RES", "INI", "INT", "ARC"].map((key) => [
      key,
      Math.round(
        party.reduce((sum, entry) => sum + entry.attributes[key as keyof typeof entry.attributes], 0) /
          party.length,
      ),
    ]),
  ) as ArenaCharacter["attributes"];
  const baseHp = Math.round(
    (party.reduce((sum, entry) => sum + entry.baseHp, 0) / party.length) *
      encounter.hpScale *
      Math.max(1, party.length * 0.65),
  );
  const attributes = buildAdaptiveMonsterAttributes(average, encounter.weights);
  attributes.INT = Math.max(attributes.INT, Math.round(average.INT * 2), 80);
  attributes.ARC = Math.max(attributes.ARC, Math.round(average.ARC * 1.5), 60);
  return createCombatant({
    id: encounter.key,
    name: encounter.name,
    attributes,
    baseHp,
    baseMana: 0,
    usesMana: false,
    rules: defaultCombatRules,
  });
}

export function buildDungeonTurnOrder(
  fighters: Record<string, CombatantState>,
  monster: CombatantState,
) {
  return buildTurnOrder([
    ...Object.values(fighters)
      .filter((fighter) => fighter.hp > 0)
      .map((fighter) => ({ id: fighter.id, initiative: fighter.attributes.INI })),
    { id: monster.id, initiative: monster.attributes.INI },
  ]);
}

export function createInitialDungeonState(party: ArenaCharacter[]): DungeonBattleState {
  const fighters = Object.fromEntries(
    party.map((entry) => [entry.id, createPvpCombatant(entry, defaultCombatRules)]),
  );
  const partyOrder = [...party]
    .sort((a, b) => fighters[b.id].attributes.INI - fighters[a.id].attributes.INI)
    .map((entry) => entry.id);
  const monster = createDungeonMonster(party, 0);
  const turnOrder = buildDungeonTurnOrder(fighters, monster);
  return {
    encounterIndex: 0,
    round: 1,
    turn: 1,
    activeCharacterId: turnOrder[0] ?? partyOrder[0],
    turnOrder,
    partyOrder,
    fighters,
    monster,
    status: "active",
    message: `${firstDungeon.encounters[0].name} bloqueia a entrada das ruínas.`,
    log: ["A expedição entrou em combate. A iniciativa definiu a ordem dos turnos."],
  };
}
