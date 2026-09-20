import "server-only";

import type { CharacterSheet } from "@/lib/content/characters";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import { applySkillBalanceOverrides } from "@/lib/game/skill-loadout";
import { equippedItemCopies } from "@/lib/game/equipment";
import { reworkClasses } from "@/lib/game/rework-catalog";
import { getReworkBasicAttack } from "@/lib/game/rework-combat";
import type { TacticalCharacter } from "@/components/arena/tactical-lab-v9";

export function toArenaCharacter(character: CharacterSheet): ArenaCharacter {
  const equippedTitle = character.inventory.find((item) => item.equippedSlot === "title") ?? null;
  const reworkClass = reworkClasses.find((entry) => entry.name === character.characterClass.name);
  const basicAttack = reworkClass ? getReworkBasicAttack(reworkClass) : null;
  const rawClassSkills = character.unlockedClassSkills.filter(
    (skill) =>
      !/passiva|rea[cç][aã]o/i.test(skill.type) &&
      character.skillLoadout.classSkillKeys.includes(skill.key),
  );
  const skills = applySkillBalanceOverrides(rawClassSkills, character.skillBalanceOverrides);
  const raceAbilities = applySkillBalanceOverrides(
    character.unlockedRaceAbilities.filter((skill) =>
      character.skillLoadout.raceSkillKeys.includes(skill.key),
    ),
    character.skillBalanceOverrides,
  );
  const usesMana = [...skills, ...raceAbilities].some((skill) => skill.resource === "mana");
  const equipmentEffects = character.inventory.flatMap((item) =>
    Array.from({ length: equippedItemCopies(item) }, () => item.specialEffects).flat(),
  );

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
    baseHp: Math.max(
      1,
      character.reworkStats.attributes.HP - character.reworkStats.attributes.RES * 5,
    ),
    baseMana: character.race.payload.baseMana,
    classResource: character.characterClass.payload.resource,
    raceResource: character.race.payload.resource,
    usesMana,
    basicAttackRange: basicAttack?.range ?? 1,
    basicAttackDamageType: basicAttack?.damageType === "magic" ? "magic" : "physical",
    attributes: {
      FOR: character.reworkStats.attributes.FOR,
      INT: character.reworkStats.attributes.INT,
      DEF: character.reworkStats.attributes.DEF,
      RES: character.reworkStats.attributes.RES,
      INI: character.reworkStats.attributes.INI,
      ARC: character.reworkStats.attributes.INT,
    },
    skills,
    raceAbilities,
    combatLore: [
      ...character.passiveOptions
        .filter((passive) => character.skillLoadout.passiveKeys.includes(passive.key))
        .map(({ name, description }) => ({ name, description })),
      ...equipmentEffects.map((effect) => ({
        name: effect.name,
        description: effect.description,
      })),
    ],
    equipmentEffects,
    items: character.inventory
      .filter((item) => /consum|poção|pocao/i.test(item.category))
      .map((item) => ({ id: item.id, name: item.name, description: item.description })),
  };
}

export function toTacticalArenaCharacter(character: CharacterSheet): TacticalCharacter & {
  imageUrl: string | null;
  title: ArenaCharacter["equippedTitle"];
  cosmetics: ArenaCharacter["cosmetics"];
} {
  const arena = toArenaCharacter(character);
  return {
    id: arena.id,
    name: arena.name,
    imageUrl: arena.imageUrl,
    title: arena.equippedTitle,
    cosmetics: arena.cosmetics,
    level: arena.level,
    rank: arena.adventureRank,
    raceName: arena.raceName,
    className: arena.className,
    classPathKey: character.class_path_key,
    baseHp: arena.baseHp,
    baseMana: arena.baseMana,
    attributes: arena.attributes,
    classResource: arena.classResource,
    raceResource: arena.raceResource,
    usesMana: arena.usesMana,
    basicAttackRange: arena.basicAttackRange,
    basicAttackDamageType: arena.basicAttackDamageType ?? "physical",
    skills: [
      ...arena.skills.map((skill) => ({ source: "class" as const, skill })),
      ...arena.raceAbilities.map((skill) => ({ source: "race" as const, skill })),
    ],
    items: arena.items,
  };
}
