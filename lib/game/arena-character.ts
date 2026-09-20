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
import { applySkillBalanceOverrides } from "@/lib/game/skill-loadout";

export function toArenaCharacter(character: CharacterSheet): ArenaCharacter {
  const equippedTitle = character.inventory.find((item) => item.equippedSlot === "title") ?? null;
  const rawClassSkills = character.unlockedClassSkills.filter(
    (skill) =>
      !/passiva|rea[cç][aã]o/i.test(skill.type) &&
      character.skillLoadout.classSkillKeys.includes(skill.key),
  );
  const skills = applySkillBalanceOverrides(
    prepareClassCombatSkills(
      character.characterClass.name,
      character.characterClass.payload,
      rawClassSkills,
    ).filter((skill) => character.skillLoadout.classSkillKeys.includes(skill.key)),
    character.skillBalanceOverrides,
  ).map(prepareArenaSkill);
  const raceAbilities = applySkillBalanceOverrides(
    prepareRaceCombatSkills(
      character.unlockedRaceAbilities.filter((skill) =>
        character.skillLoadout.raceSkillKeys.includes(skill.key),
      ),
    ),
    character.skillBalanceOverrides,
  ).map(prepareArenaSkill);
  const usesMana = [...skills, ...raceAbilities].some((skill) => skill.resource === "mana");

  return {
    id: character.id,
    name: character.name,
    level: character.level,
    adventureRank: character.adventure_rank,
    imageUrl: character.image_url ?? "",
    cosmetics: character.cosmetics,
    equippedTitle: equippedTitle
      ? {
          name: equippedTitle.name,
          rarity: equippedTitle.rarity,
          titleStyle: equippedTitle.titleStyle,
          description: equippedTitle.description,
          attributes: equippedTitle.attributes,
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
    basicAttackDamageType: getClassBasicAttackDamageType(
      character.characterClass.name,
      character.characterClass.payload,
    ),
    attributes: character.stats.attributes,
    skills,
    raceAbilities,
    combatLore: [
      ...character.passiveOptions
        .filter((passive) => character.skillLoadout.passiveKeys.includes(passive.key))
        .map(({ name, description }) => ({ name, description })),
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
