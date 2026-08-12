import { PlayerNav } from "@/components/player-nav";
import { RaceCodex } from "@/components/codex/race-codex";
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
    <main className="lore-page">
      <PlayerNav />
      <div className="page-container lore-page__inner">
        <header className="lore-hero">
          <span className="eyebrow">Atlas dos povos de Wonderland</span>
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
