import styles from "@/components/codex/codex.module.css";
import { RaceCodex } from "@/components/codex/race-codex";
import { PlayerNav } from "@/components/player-nav";
import { getRaceCatalog } from "@/lib/content/races";
import { officialRaces } from "@/lib/game/official-races";

export const metadata = { title: "Raças de Wonderland" };
export const dynamic = "force-dynamic";

export default async function RacesPage() {
  const published = (await getRaceCatalog()).filter((race) => race.status === "published");
  const races = published.length
    ? published
    : officialRaces.map((entry) => ({ ...entry, id: entry.slug }));

  return (
    <main className={styles.page}>
      <PlayerNav />
      <div className={styles.inner}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>Atlas dos povos de Wonderland</span>
          <h1>Descubra a origem do seu herói</h1>
          <p>
            Explore a identidade, os traços e as mecânicas de cada povo antes de iniciar sua
            jornada.
          </p>
        </header>
        <RaceCodex entries={races} />
      </div>
    </main>
  );
}
