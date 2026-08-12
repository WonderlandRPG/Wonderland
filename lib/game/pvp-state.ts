import { createCombatant, type CombatRules } from "@/lib/game/combat";
import { applyBattleStartItemEffects, sumItemEffectModifiers } from "@/lib/game/item-effects";
import type { ArenaCharacter, PvpBattleState, PvpTurnActions } from "@/lib/game/arena-types";

export const emptyPvpActions: PvpTurnActions = {
  move: false,
  basic: false,
  race: false,
  class: false,
  item: false,
  defend: false,
};

export function createPvpCombatant(character: ArenaCharacter, rules: CombatRules) {
  const attributes = { ...character.attributes };
  for (const [key, value] of Object.entries(sumItemEffectModifiers(character.equipmentEffects))) {
    attributes[key as keyof typeof attributes] += value ?? 0;
  }
  return applyBattleStartItemEffects(
    createCombatant({ ...character, attributes, rules, itemEffects: character.equipmentEffects }),
    character.equipmentEffects,
  );
}

export function createInitialPvpState(
  left: ArenaCharacter,
  right: ArenaCharacter,
  rules: CombatRules,
): PvpBattleState {
  const fighters = {
    [left.id]: createPvpCombatant(left, rules),
    [right.id]: createPvpCombatant(right, rules),
  };
  const first =
    fighters[left.id].attributes.INI >= fighters[right.id].attributes.INI ? left.id : right.id;
  return {
    turn: 1,
    activeCharacterId: first,
    fighters,
    positions: { [left.id]: { x: 1, y: 7 }, [right.id]: { x: 18, y: 7 } },
    actions: { ...emptyPvpActions },
    status: "active",
    winnerCharacterId: null,
    message: `${fighters[first].name} começa o duelo por possuir maior iniciativa.`,
    log: [`A partida começou. ${fighters[first].name} possui a iniciativa.`],
    turnEndsAt: new Date(Date.now() + 60_000).toISOString(),
  };
}
