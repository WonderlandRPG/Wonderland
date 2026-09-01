import Link from "next/link";
import { redirect } from "next/navigation";

import { TacticalLab } from "@/components/arena/tactical-lab";
import { PlayerNav } from "@/components/player-nav";
import { isAdministrativeRole, requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheets } from "@/lib/content/characters";
import {
  getClassBasicAttackDamageType,
  prepareClassCombatSkills,
  prepareRaceCombatSkills,
} from "@/lib/game/class-combat-profile";
import { getClassBasicAttackRange } from "@/lib/game/class-range";

export const metadata = { title: "Laboratório do Mapa Tático" };
export const dynamic = "force-dynamic";

export default async function TacticalMapLabPage() {
  const account = await requireCurrentAccount("/arena/mapa-tatico");

  if (!isAdministrativeRole(account.role)) {
    redirect("/arena");
  }

  const sheets = await getCharacterSheets(account.id);
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
    };
  });

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner">
        <Link className="arena-mode-back" href="/arena">
          ← Voltar para Arena
        </Link>
        <TacticalLab characters={characters} />
      </div>
    </main>
  );
}
