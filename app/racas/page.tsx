import styles from "@/components/grimoire/grimoire.module.css";
import { RaceGrimoire } from "@/components/grimoire/race-grimoire";
import { PlayerNav } from "@/components/player-nav";
import { getRaceCatalog } from "@/lib/content/races";
import { officialRaces } from "@/lib/game/official-races";

export const metadata = { title: "Raças de Wonderland" };
export const dynamic = "force-dynamic";

export default async function RacesPage() {
  const published = (await getRaceCatalog()).filter((race) => race.status === "published");
  const races = published.length ? published : officialRaces.map((entry) => ({ ...entry, id: entry.slug }));

  return (
    <main className={`grimoire-page grimoire-page--races ${styles.page}`}>
      <PlayerNav />
      <div className={styles.inner}>
        <header className={styles.hero}>
          <span>Livro dos Povos</span>
          <h1>As linhagens de Wonderland</h1>
          <p>Abra o grimório, escolha uma linhagem e descubra sua herança, seus traços e os poderes que despertam ao longo da jornada.</p>
        </header>
        <RaceGrimoire entries={races} />
      </div>
    </main>
  );
}
