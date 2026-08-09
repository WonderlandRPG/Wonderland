import Link from "next/link";

import { CharacterCreator } from "@/components/characters/character-creator";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterRules } from "@/lib/content/character-settings";
import { getCharacterSheets } from "@/lib/content/characters";
import { getClassCatalog } from "@/lib/content/classes";
import { getRaceCatalog } from "@/lib/content/races";

export const metadata = { title: "Criar Personagem" };
export const dynamic = "force-dynamic";

export default async function NewCharacterPage() {
  const account = await requireCurrentAccount("/personagens/novo");
  const [races, classes, rules, characters] = await Promise.all([
    getRaceCatalog(),
    getClassCatalog({ publishedOnly: true }),
    getCharacterRules(),
    getCharacterSheets(account.id),
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
            <p>
              Um Fundador precisa publicar pelo menos uma raça e sincronizar as 13 classes oficiais
              no Painel ADM.
            </p>
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
          baseAttributes={rules.baseAttributes}
          points={rules.distributablePoints}
          races={publishedRaces.map((entry) => ({
            id: entry.id,
            name: entry.name,
            payload: entry.payload,
          }))}
          classes={classes.map((entry) => ({
            id: entry.id,
            name: entry.name,
            description: entry.payload.description,
            difficulty: entry.payload.difficulty,
            specialization: entry.payload.specialization,
            primaryAttributes: entry.payload.primaryAttributes,
            resourceName: entry.payload.resource.name,
            passiveName: entry.payload.passive.name,
            passiveDescription: entry.payload.passive.description,
          }))}
        />
      </div>
    </main>
  );
}
