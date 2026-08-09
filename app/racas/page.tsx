import { PlayerNav } from "@/components/player-nav";
import { getRaceCatalog } from "@/lib/content/races";
import { getStructuredRaceAbilities } from "@/lib/game/races";

export const metadata = { title: "Raças" };
export const dynamic = "force-dynamic";

export default async function RacesPage() {
  const races = (await getRaceCatalog()).filter((entry) => entry.status === "published");
  return <main className="codex-page"><PlayerNav /><div className="page-container codex-page__inner">
    <header className="codex-hero"><span className="eyebrow">Códice de Wonderland</span><h1>Raças</h1><p>Conheça atributos, recursos, traços e toda a progressão racial antes de criar seu personagem.</p></header>
    <section className="codex-catalog">{races.map((race) => <details className="codex-entry" key={race.id}>
      <summary><div><small>{"★".repeat(race.payload.difficulty)} · {race.payload.specialization}</small><h2>{race.name}</h2><p>{race.payload.description}</p></div><span>Abrir ficha ＋</span></summary>
      <div className="codex-entry__body"><aside><b>HP base</b><strong>{race.payload.baseHp}</strong><b>Mana base</b><strong>{race.payload.baseMana}</strong><b>Recurso</b><strong>{race.payload.resource?.name ?? "Nenhum"}</strong><b>Bônus raciais</b><strong>{Object.entries(race.payload.attributeBonuses).filter(([, value]) => value > 0).map(([key,value]) => `${key} +${value}`).join(" · ")}</strong></aside>
      <section><h3>Traços raciais</h3>{race.payload.traits.map((trait) => <article key={trait.name}><strong>{trait.name}</strong><p>{trait.description}</p></article>)}<h3>Habilidades</h3>{getStructuredRaceAbilities(race.payload).map((ability) => <article key={ability.key}><small>Nível {ability.level} · {ability.type} · {ability.category}</small><strong>{ability.name}</strong><p>{ability.playerDescription}</p><em>{ability.cost} {ability.resource === "special" ? race.payload.resource?.name : "Mana"} · Recarga {ability.cooldown}</em></article>)}</section></div>
    </details>)}</section>
  </div></main>;
}
