import Link from "next/link";
import { redirect } from "next/navigation";

import { TacticalLab } from "@/components/arena/tactical-lab";
import { PlayerNav } from "@/components/player-nav";
import { isAdministrativeRole, requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheets } from "@/lib/content/characters";
import { getClassBasicAttackRange } from "@/lib/game/class-range";

export const metadata = { title: "Laboratório do Mapa Tático" };
export const dynamic = "force-dynamic";

export default async function TacticalMapLabPage() {
  const account = await requireCurrentAccount("/arena/mapa-tatico");

  if (!isAdministrativeRole(account.role)) {
    redirect("/arena");
  }

  const sheets = await getCharacterSheets(account.id);
  const characters = sheets.map((character) => ({
    id: character.id,
    name: character.name,
    level: character.level,
    rank: character.adventure_rank,
    raceName: character.race.name,
    className: character.characterClass.name,
    maxHp: character.stats.maxHp,
    maxMana: character.stats.maxMana,
    attributes: character.stats.attributes,
    basicAttackRange: getClassBasicAttackRange(character.characterClass.name),
    skills: character.unlockedClassSkills
      .filter((skill) => !/passiva/i.test(skill.type))
      .map((skill) => ({
        key: skill.key,
        name: skill.name,
        range: Math.max(0, skill.range ?? 0),
        area: Math.max(0, skill.area ?? 0),
        target: skill.target,
        cost: skill.cost,
        resource: skill.resource,
        description: skill.playerDescription,
      })),
  }));

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
