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
          <span className="eyebrow">Atlas dos povos</span>
          <h1>Raças</h1>
          <p>
            Entenda atributos, recursos, traços e todas as habilidades raciais em uma única ficha.
          </p>
        </header>
        <RaceCodex entries={races} />
      </div>
    </main>
  );
}
