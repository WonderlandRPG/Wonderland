import Link from "next/link";
import { redirect } from "next/navigation";

import { TacticalLabV5 } from "@/components/arena/tactical-lab-v5";
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
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Laboratório do Mapa Tático" };
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
        .select("id,slug,name,category,rank,behavior,weaknesses,description,combat_profile")
        .eq("active", true)
        .order("rank")
        .order("name")
    : { data: [] };

  const creatures = (creatureRows ?? []).map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    category: entry.category,
    rank: entry.rank,
    behavior: entry.behavior,
    weaknesses: parseTextList(entry.weaknesses),
    description: entry.description,
    imageUrl: getCreatureImageUrl(entry.slug),
    combatProfile: parseCreatureCombatProfile(entry.rank, entry.combat_profile),
  }));

  const characters = sheets.map((character) => {
    const rawClassSkills = character.unlockedClassSkills.filter((skill) => !/passiva/i.test(skill.type));
    const rawRaceSkills = character.unlockedRaceAbilities.filter((skill) => !/passiva/i.test(skill.type));
    const originalSkills = new Map(
      [...rawClassSkills, ...rawRaceSkills].map((skill) => [skill.key, skill]),
    );
    const classSkills = prepareClassCombatSkills(
      character.characterClass.name,
      character.characterClass.payload,
      rawClassSkills,
    );
    const raceSkills = prepareRaceCombatSkills(rawRaceSkills);
    const skills = [
      ...classSkills.map((skill) => ({ source: "class" as const, skill })),
      ...raceSkills.map((skill) => ({ source: "race" as const, skill })),
    ].map(({ source, skill }) => {
      const original = originalSkills.get(skill.key);
      return {
        source,
        skill: {
          ...skill,
          range: Math.max(0, original?.range ?? skill.range ?? 0),
          area: Math.max(0, original?.area ?? skill.area ?? 0),
        },
      };
    });
    const usesMana = skills.some(({ skill }) => skill.resource === "mana");
    const items = character.inventory
      .filter((item) => /consum|poção|pocao/i.test(item.category))
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }));

    return {
      id: character.id,
      name: character.name,
      level: character.level,
      rank: character.adventure_rank,
      raceName: character.race.name,
      className: character.characterClass.name,
      baseHp: character.race.payload.baseHp,
      baseMana: character.race.payload.baseMana,
      attributes: character.stats.attributes,
      classResource: character.characterClass.payload.resource,
      raceResource: character.race.payload.resource,
      usesMana,
      basicAttackRange: getClassBasicAttackRange(character.characterClass.name),
      basicAttackDamageType: getClassBasicAttackDamageType(
        character.characterClass.name,
        character.characterClass.payload,
      ),
      skills,
      items,
    };
  });

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner">
        <Link className="arena-mode-back" href="/arena">
          ← Voltar para Arena
        </Link>
        <TacticalLabV5 characters={characters} creatures={creatures} />
      </div>
    </main>
  );
}
