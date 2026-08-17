import { ClassGrimoire } from "@/components/grimoire/class-grimoire";
import styles from "@/components/grimoire/grimoire.module.css";
import { PlayerNav } from "@/components/player-nav";
import { getClassCatalog } from "@/lib/content/classes";
import { officialClasses } from "@/lib/game/official-classes";

export const metadata = { title: "Classes de Wonderland" };
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const published = await getClassCatalog({ publishedOnly: true });
  const classes = published.length ? published : officialClasses.map((entry) => ({ ...entry, id: entry.slug }));

  return (
    <main className={`grimoire-page grimoire-page--classes ${styles.page}`}>
      <PlayerNav />
      <div className={styles.inner}>
        <header className={styles.hero}>
          <span>Grimório das Vocações</span>
          <h1>Escolha o seu caminho</h1>
          <p>Cada classe é apresentada como uma tradição de combate: seus recursos, caminhos, missões de especialização e técnicas ficam reunidos nas páginas do grimório.</p>
        </header>
        <ClassGrimoire entries={classes} />
      </div>
    </main>
  );
}
