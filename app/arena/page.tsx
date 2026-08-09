import Link from "next/link";

import { TrainingArena } from "@/components/arena/training-arena";
import { BrandMark } from "@/components/brand-mark";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheets } from "@/lib/content/characters";
import { defaultCombatRules } from "@/lib/game/combat";

export const metadata = { title: "Arena de Treinamento" };
export const dynamic = "force-dynamic";

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<{ personagem?: string }>;
}) {
  const account = await requireCurrentAccount("/arena");
  const [characters, query] = await Promise.all([getCharacterSheets(account.id), searchParams]);

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
          characters={characters.map((character) => ({
            id: character.id,
            name: character.name,
            raceName: character.race.name,
            className: character.characterClass.name,
            baseHp: character.race.payload.baseHp,
            baseMana: character.race.payload.baseMana,
            attributes: character.stats.attributes,
            skills: character.unlockedClassSkills,
          }))}
          initialCharacterId={query.personagem}
          rules={defaultCombatRules}
        />
      </div>
    </main>
  );
}
