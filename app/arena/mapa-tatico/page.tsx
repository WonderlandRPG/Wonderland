import Link from "next/link";
import { redirect } from "next/navigation";

import "./tactical-stage.css";
import { TacticalCombatShell } from "@/components/arena/tactical-combat-shell";
import { PlayerNav } from "@/components/player-nav";
import { isAdministrativeRole, requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheets } from "@/lib/content/characters";
import { getCreatureImageUrl, parseTextList } from "@/lib/game/bestiary";
import {
  getClassBasicAttackDamageType,
  prepareClassCombatSkills,
  prepareRaceCombatSkills,
} from "@/lib/game/class-combat-profile";
import { getClassBasicAttackRange } from "@/lib/game/class-range";
import { parseCreatureCombatProfile } from "@/lib/game/creature-tactical-combat";
import { getTacticalSkillRange } from "@/lib/game/tactical-skill-range";
import { repairTacticalInertSkill } from "@/lib/game/tactical-skill-repair";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Combate Tático" };
export const dynamic = "force-dynamic";

export default async function TacticalMapLabPage() {
  const account = await requireCurrentAccount("/arena/mapa-tatico");

  if (!isAdministrativeRole(account.role)) {
    redirect("/arena");
  }

  const [sheets, client] = await Promise.all([
    getCharacterSheets(account.id),
    createServerSupabaseClient(),
  ]);

  const { data: creatureRows } = client
    ? await client
        .from("v2_creatures")
        .select("*")
        .eq("active", true)
        .order("rank")
        .order("name")
    : { data: [] };

  const creatures = (creatureRows ?? []).map((entry) => {
    const row = entry as typeof entry & { combat_profile?: unknown };
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      rank: row.rank,
      behavior: row.behavior,
      weaknesses: parseTextList(row.weaknesses),
      description: row.description,
      imageUrl: getCreatureImageUrl(row.slug),
      combatProfile: parseCreatureCombatProfile(row.rank, row.combat_profile),
    };
  });

  const characters = sheets.map((character) => {
    const rawClassSkills = character.unlockedClassSkills.filter((skill) => /ativa/i.test(skill.type));
    const rawRaceSkills = character.unlockedRaceAbilities.filter((skill) => /ativa/i.test(skill.type));
    const originalSkills = new Map(
      [...rawClassSkills, ...rawRaceSkills].map((skill) => [skill.key, skill]),
    );
    const classBasicAttackRange = getClassBasicAttackRange(character.characterClass.name);
    const classSkills = prepareClassCombatSkills(
      character.characterClass.name,
      character.characterClass.payload,
      rawClassSkills,
    );
    const raceSkills = prepareRaceCombatSkills(rawRaceSkills);
    const skills = [
      ...classSkills.map((skill) => ({ source: "class" as const, skill })),
      ...raceSkills.map((skill) => ({ source: "race" as const, skill: repairTacticalInertSkill(skill) })),
    ].map(({ source, skill }) => {
      const original = originalSkills.get(skill.key);
      const configuredRange = Math.max(0, original?.range ?? skill.range ?? 0);
      const originalOperations = new Map(
        (original?.operations ?? []).map((operation, index) => [index, operation]),
      );
      const restoredSkill = {
        ...skill,
        range: configuredRange,
        area: Math.max(0, original?.area ?? skill.area ?? 0),
        operations: skill.operations.map((operation, index) => {
          const rawOperation = originalOperations.get(index);
          return {
            ...operation,
            distance: Math.max(0, rawOperation?.distance ?? operation.distance ?? 0),
          };
        }),
      };
      const tacticalRange = getTacticalSkillRange(restoredSkill, classBasicAttackRange);
      return {
        source,
        skill: {
          ...restoredSkill,
          range: tacticalRange,
          operations: restoredSkill.operations.map((operation) => ({
            ...operation,
            distance:
              (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
              operation.distance === 0
                ? tacticalRange
                : operation.distance,
          })),
        },
      };
    });
    const usesMana = skills.some(({ skill }) => skill.resource === "mana");
    const items = character.inventory
      .filter((item) => /consum|poção|pocao/i.test(item.category))
      .map((item) => ({ id: item.id, name: item.name, description: item.description }));
    const equippedTitle = character.inventory.find((item) => item.equippedSlot === "title") ?? null;

    return {
      id: character.id,
      name: character.name,
      imageUrl: character.image_url,
      title: equippedTitle,
      cosmetics: character.cosmetics,
      level: character.level,
      rank: character.adventure_rank,
      raceName: character.race.name,
      className: character.characterClass.name,
      classPathKey: character.class_path_key,
      baseHp: character.race.payload.baseHp,
      baseMana: character.race.payload.baseMana,
      attributes: character.stats.attributes,
      classResource: character.characterClass.payload.resource,
      raceResource: character.race.payload.resource,
      usesMana,
      basicAttackRange: classBasicAttackRange,
      basicAttackDamageType: getClassBasicAttackDamageType(
        character.characterClass.name,
        character.characterClass.payload,
      ),
      skills,
      items,
    };
  });

  return (
    <main
      className="arena-page"
      style={{
        backgroundImage: "url('/backgrounds/arena.svg')",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <PlayerNav />
      <div className="page-container arena-page__inner tactical-lab-stage">
        <Link className="arena-mode-back" href="/arena">← Voltar para Arena</Link>
        <TacticalCombatShell characters={characters} creatures={creatures} />
      </div>
    </main>
  );
}
