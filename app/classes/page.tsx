import { ClassCodex } from "@/components/codex/class-codex";
import styles from "@/components/codex/codex.module.css";
import { PlayerNav } from "@/components/player-nav";
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
    <main className={styles.page}>
      <PlayerNav />
      <div className={styles.inner}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>Grimório das vocações</span>
          <h1>Escolha como deixar sua marca</h1>
          <p>
            Conheça a fantasia, a dificuldade e o estilo de combate de cada Classe. Selecione um
            retrato para abrir seu grimório completo.
          </p>
        </header>
        <ClassCodex entries={classes} />
      </div>
    </main>
  );
}
