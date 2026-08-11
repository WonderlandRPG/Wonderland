import { PlayerNav } from "@/components/player-nav";
import { ClassCodex } from "@/components/codex/class-codex";
import { getClassCatalog } from "@/lib/content/classes";
import { officialClasses } from "@/lib/game/official-classes";
export const metadata = { title: "Classes de Wonderland" };
export const dynamic = "force-dynamic";
export default async function ClassesPage() {
  const published = await getClassCatalog({ publishedOnly: true });
  const classes = published.length
    ? published
    : officialClasses.map((entry) => ({ ...entry, id: entry.slug }));
  return (
    <main className="lore-page">
      <PlayerNav />
      <div className="page-container lore-page__inner">
        <header className="lore-hero">
          <span className="eyebrow">Biblioteca dos aventureiros</span>
          <h1>Classes</h1>
          <p>
            Compare funções, recursos, Caminhos e todas as habilidades antes de criar seu
            personagem.
          </p>
        </header>
        <ClassCodex entries={classes} />
      </div>
    </main>
  );
}
