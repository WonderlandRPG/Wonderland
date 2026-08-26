import { createCombatant, type CombatRules } from "@/lib/game/combat";
import { applyBattleStartItemEffects, sumItemEffectModifiers } from "@/lib/game/item-effects";
import type { ArenaCharacter, PvpBattleState } from "@/lib/game/arena-types";
import { createBattleState } from "@/lib/game/turn-engine";
import { applyCombatLorePassives } from "@/lib/game/combat-passives";

export function createPvpCombatant(character: ArenaCharacter, rules: CombatRules) {
  const attributes = { ...character.attributes };
  for (const [key, value] of Object.entries(sumItemEffectModifiers(character.equipmentEffects))) {
    attributes[key as keyof typeof attributes] += value ?? 0;
  }
  return applyCombatLorePassives(applyBattleStartItemEffects(
    createCombatant({ ...character, attributes, rules, itemEffects: character.equipmentEffects }),
    character.equipmentEffects,
  ), character);
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
  const base = createBattleState({
    fighters,
    turnEndsAt: new Date(Date.now() + 60_000).toISOString(),
  });
  return {
    ...base,
    turnEndsAt: base.turnEndsAt!,
  };
}
