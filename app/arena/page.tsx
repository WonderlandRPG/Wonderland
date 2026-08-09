import Link from "next/link";

import { TrainingArena } from "@/components/arena/training-arena";
import { BrandMark } from "@/components/brand-mark";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheets } from "@/lib/content/characters";
import { getCombatRules } from "@/lib/content/game-settings";

export const metadata = { title: "Arena de Testes" };
export const dynamic = "force-dynamic";

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<{ personagem?: string }>;
}) {
  const account = await requireCurrentAccount("/arena");
  const [characters, rules, query] = await Promise.all([
    getCharacterSheets(account.id),
    getCombatRules(),
    searchParams,
  ]);
  const arenaCharacters = characters.map((character) => ({
    id: character.id,
    name: character.name,
    raceName: character.race.name,
    className: character.characterClass.name,
    level: character.level,
    baseHp: character.race.payload.baseHp,
    baseMana: character.race.payload.baseMana,
    attributes: character.stats.attributes,
    skills: character.unlockedClassSkills,
  }));
  return (
    <main className="arena-page">
      <header className="account-header">
        <BrandMark inverse />
        <nav>
          <Link href="/personagens">Personagens</Link>
          <Link href="/perfil">Minha conta</Link>
        </nav>
      </header>
      <div className="page-container arena-page__inner">
        <TrainingArena
          characters={arenaCharacters}
          initialCharacterId={query.personagem}
          rules={rules}
        />
      </div>
    </main>
  );
}
