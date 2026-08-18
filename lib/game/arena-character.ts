import "server-only";

import type { CharacterSheet } from "@/lib/content/characters";
import { prepareArenaSkill } from "@/lib/game/classes";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import { getClassBasicAttackRange } from "@/lib/game/class-range";
import {
  getClassBasicAttackDamageType,
  prepareClassCombatSkills,
  prepareRaceCombatSkills,
} from "@/lib/game/class-combat-profile";

export function toArenaCharacter(character: CharacterSheet): ArenaCharacter {
  const equippedTitle = character.inventory.find((item) => item.equippedSlot === "title") ?? null;
  const rawClassSkills = character.unlockedClassSkills.filter((skill) => !/passiva/i.test(skill.type));
  const skills = prepareClassCombatSkills(
    character.characterClass.name,
    character.characterClass.payload,
    rawClassSkills,
  ).map(prepareArenaSkill);
  const raceAbilities = prepareRaceCombatSkills(character.unlockedRaceAbilities).map(prepareArenaSkill);
  const usesMana = [...skills, ...raceAbilities].some((skill) => skill.resource === "mana");

  return {
    id: character.id,
    name: character.name,
    level: character.level,
    adventureRank: character.adventure_rank,
    imageUrl: character.image_url ?? "",
    equippedTitle: equippedTitle
      ? {
          name: equippedTitle.name,
          rarity: equippedTitle.rarity,
          titleStyle: equippedTitle.titleStyle,
        }
      : null,
    raceName: character.race.name,
    className: character.characterClass.name,
    baseHp: character.race.payload.baseHp,
    baseMana: character.race.payload.baseMana,
    classResource: character.characterClass.payload.resource,
    raceResource: character.race.payload.resource,
    usesMana,
    basicAttackRange: getClassBasicAttackRange(character.characterClass.name),
    basicAttackDamageType: getClassBasicAttackDamageType(character.characterClass.payload),
    attributes: character.stats.attributes,
    skills,
    raceAbilities,
    combatLore: [
      {
        name: character.characterClass.payload.passive.name,
        description: character.characterClass.payload.passive.description,
      },
      {
        name: character.characterClass.payload.mechanic.name,
        description: character.characterClass.payload.mechanic.description,
      },
      ...character.characterClass.payload.paths
        .filter((path) => path.key === character.class_path_key)
        .map((path) => ({ name: path.passive.name, description: path.passive.description })),
      ...character.race.payload.traits,
      ...character.race.payload.mechanics,
      ...character.inventory
        .filter((item) => item.equippedSlot)
        .flatMap((item) =>
          item.specialEffects.map((effect) => ({
            name: effect.name,
            description: effect.description,
          })),
        ),
    ],
    equipmentEffects: character.inventory
      .filter((item) => item.equippedSlot)
      .flatMap((item) => item.specialEffects),
    items: character.inventory
      .filter((item) => /consum|poção|pocao/i.test(item.category))
      .map((item) => ({ id: item.id, name: item.name, description: item.description })),
  };
}
