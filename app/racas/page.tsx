import { PlayerNav } from "@/components/player-nav";
import { RaceCodex } from "@/components/codex/race-codex";
import { getRaceCatalog } from "@/lib/content/races";
export const metadata = { title: "Raças de Wonderland" };
export const dynamic = "force-dynamic";
export default async function RacesPage() { const races = (await getRaceCatalog()).filter((race) => race.status === "published"); return <main className="lore-page"><PlayerNav/><div className="page-container lore-page__inner"><header className="lore-hero"><span className="eyebrow">Atlas dos povos</span><h1>Raças</h1><p>Entenda atributos, recursos, traços e progressão racial em uma única ficha.</p></header><RaceCodex entries={races}/></div></main>; }
