import Link from "next/link";

import { CharacterCreator } from "@/components/characters/character-creator";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterRules } from "@/lib/content/character-settings";
import { getCharacterSheets } from "@/lib/content/characters";
import { getClassCatalog } from "@/lib/content/classes";
import { getRaceCatalog } from "@/lib/content/races";
import { getReworkClasses, getReworkRaces } from "@/lib/content/rework-catalog";
import { reworkDistributableStars } from "@/lib/game/rework-attributes";

export const metadata = { title: "Criar Personagem" };
export const dynamic = "force-dynamic";

export default async function NewCharacterPage() {
  const account = await requireCurrentAccount("/personagens/novo");
  const [races, classes, rules, characters, reworkRaces, reworkClasses] = await Promise.all([
    getRaceCatalog(),
    getClassCatalog({ publishedOnly: true }),
    getCharacterRules(),
    getCharacterSheets(account.id),
    getReworkRaces(),
    getReworkClasses(),
  ]);
  const publishedRaces = races.filter((entry) => entry.status === "published");
  if (characters.length >= rules.maximumSlots) {
    return (
      <main className="character-page">
        <div className="page-container character-page__inner">
          <Link className="race-back-link" href="/personagens">
            ← Voltar aos personagens
          </Link>
          <section className="character-empty">
            <span>03/03</span>
            <h1>Todos os espaços estão ocupados</h1>
            <p>Exclua uma ficha para criar outro personagem.</p>
          </section>
        </div>
      </main>
    );
  }
  if (publishedRaces.length === 0 || classes.length === 0) {
    return (
      <main className="character-page">
        <div className="page-container character-page__inner">
          <Link className="race-back-link" href="/personagens">
            ← Voltar aos personagens
          </Link>
          <section className="character-empty">
            <span>!</span>
            <h1>Catálogo incompleto</h1>
            <p>Um administrador precisa publicar as raças e classes oficiais do Rework.</p>
          </section>
        </div>
      </main>
    );
  }
  return (
    <main className="character-page">
      <div className="page-container character-page__inner">
        <header className="character-page__header">
          <div>
            <Link className="race-back-link" href="/personagens">
              ← Voltar aos personagens
            </Link>
            <span className="eyebrow">Nova jornada</span>
            <h1>Criar personagem</h1>
            <p>Monte sua ficha diretamente com as regras oficiais do Wonderland.</p>
          </div>
          <span>
            {characters.length} / {rules.maximumSlots} fichas
          </span>
        </header>
        <CharacterCreator
          points={reworkDistributableStars}
          races={publishedRaces.flatMap((entry) => {
            const rework = reworkRaces.find(
              (race) => race.id === entry.slug || race.name === entry.name,
            );
            return rework
              ? [
                  {
                    id: entry.id,
                    name: entry.name,
                    description: rework.description,
                    epithet: rework.epithet,
                    firstPowerName: rework.powers[0]?.name ?? "—",
                    imageUrl: entry.payload.imageUrl,
                    baseStats: rework.baseStats,
                  },
                ]
              : [];
          })}
          classes={classes.flatMap((entry) => {
            const rework = reworkClasses.find(
              (item) => item.id === entry.slug || item.name === entry.name,
            );
            if (!rework) return [];
            const magic = rework.abilities.filter(
              (ability) => ability.combat.damageType === "Mágico",
            ).length;
            const physical = rework.abilities.filter(
              (ability) => ability.combat.damageType === "Físico",
            ).length;
            return [
              {
                id: entry.id,
                name: entry.name,
                description: rework.description,
                role: rework.role,
                magical: magic > physical,
                passiveName:
                  rework.abilities.find((ability) => ability.kind === "Passiva")?.name ?? "—",
                passiveDescription:
                  rework.abilities.find((ability) => ability.kind === "Passiva")?.description ?? "",
              },
            ];
          })}
        />
      </div>
    </main>
  );
}
