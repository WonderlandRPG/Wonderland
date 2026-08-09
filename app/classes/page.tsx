import { PlayerNav } from "@/components/player-nav";
import { getClassCatalog } from "@/lib/content/classes";

export const metadata = { title: "Classes" };
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = await getClassCatalog({ publishedOnly: true });
  return <main className="codex-page"><PlayerNav /><div className="page-container codex-page__inner">
    <header className="codex-hero"><span className="eyebrow">Códice de Wonderland</span><h1>Classes</h1><p>Leia especializações, recursos, habilidades e os caminhos disponíveis para cada classe.</p></header>
    <section className="codex-catalog">{classes.map((entry) => <details className="codex-entry" key={entry.id}>
      <summary><div><small>{"★".repeat(entry.payload.difficulty)} · {entry.payload.specialization}</small><h2>{entry.name}</h2><p>{entry.payload.description}</p></div><span>Abrir ficha ＋</span></summary>
      <div className="codex-entry__body"><aside><b>Atributos principais</b><strong>{entry.payload.primaryAttributes.join(" · ")}</strong><b>Recurso</b><strong>{entry.payload.resource.name}</strong><b>Passiva</b><strong>{entry.payload.passive.name}</strong><p>{entry.payload.passive.description}</p></aside>
      <section><h3>Caminhos</h3><div className="codex-paths">{entry.payload.paths.map((path) => <article key={path.key}><small>Caminho de classe</small><strong>{path.name}</strong><p>{path.description}</p><em>{path.passive.name}: {path.passive.description}</em><div className="codex-path-skills">{path.skills.map((skill) => <span key={skill.key}><b>Nível {skill.level} · {skill.name}</b><small>{skill.playerDescription}</small><i>{skill.cost} {entry.payload.resource.name} · Recarga {skill.cooldown}</i></span>)}</div></article>)}</div><h3>Habilidades</h3>{entry.payload.progression.map((skill) => <article key={skill.key}><small>Nível {skill.level} · {skill.type} · {skill.category}</small><strong>{skill.name}</strong><p>{skill.playerDescription}</p><em>{skill.cost} {skill.resource === "special" ? entry.payload.resource.name : skill.resource === "mana" ? "Mana" : "Sem custo"} · Recarga {skill.cooldown}</em></article>)}</section></div>
    </details>)}</section>
  </div></main>;
}
