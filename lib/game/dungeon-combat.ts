import { buildAdaptiveMonsterAttributes } from "@/lib/game/arena";
import { createCombatant, defaultCombatRules, type CombatantState } from "@/lib/game/combat";
import { createPvpCombatant } from "@/lib/game/pvp-state";
import { firstDungeon } from "@/lib/game/dungeons";
import type { ArenaCharacter } from "@/lib/game/arena-types";

export type DungeonBattleState = {
  encounterIndex: number;
  round: number;
  activeCharacterId: string;
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
        party.reduce(
          (sum, entry) => sum + entry.attributes[key as keyof typeof entry.attributes],
          0,
        ) / party.length,
      ),
    ]),
  ) as ArenaCharacter["attributes"];
  const baseHp = Math.round(
    (party.reduce((sum, entry) => sum + entry.baseHp, 0) / party.length) *
      encounter.hpScale *
      Math.max(1, party.length * 0.65),
  );
  return createCombatant({
    id: encounter.key,
    name: encounter.name,
    attributes: buildAdaptiveMonsterAttributes(average, encounter.weights),
    baseHp,
    baseMana: 0,
    usesMana: false,
    rules: defaultCombatRules,
  });
}

export function createInitialDungeonState(party: ArenaCharacter[]): DungeonBattleState {
  const fighters = Object.fromEntries(
    party.map((entry) => [entry.id, createPvpCombatant(entry, defaultCombatRules)]),
  );
  const partyOrder = [...party]
    .sort((a, b) => fighters[b.id].attributes.INI - fighters[a.id].attributes.INI)
    .map((entry) => entry.id);
  return {
    encounterIndex: 0,
    round: 1,
    activeCharacterId: partyOrder[0],
    partyOrder,
    fighters,
    monster: createDungeonMonster(party, 0),
    status: "active",
    message: `${firstDungeon.encounters[0].name} bloqueia a entrada das ruínas.`,
    log: ["A expedição entrou em combate."],
  };
}
