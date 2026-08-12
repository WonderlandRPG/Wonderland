"use client";
import { useMemo, useState } from "react";
import type { ClassPayload } from "@/lib/game/classes";

type Entry = { id: string; name: string; slug: string; payload: ClassPayload };
export function ClassCodex({ entries }: { entries: Entry[] }) {
  const [selected, setSelected] = useState(entries[0]?.slug ?? "");
  const [search, setSearch] = useState("");
  const visible = useMemo(() => entries.filter((entry) => `${entry.name} ${entry.payload.specialization}`.toLowerCase().includes(search.toLowerCase())), [entries, search]);
  const entry = entries.find((item) => item.slug === selected) ?? visible[0] ?? entries[0];
  if (!entry) return null;
  return <div className="lore-browser">
    <aside className="lore-browser__index"><label><span>Buscar classe</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou função"/></label><nav>{visible.map((item) => <button className={item.slug === entry.slug ? "is-active" : ""} onClick={() => setSelected(item.slug)} key={item.slug}><i className={item.payload.imageUrl ? "has-image" : ""} style={item.payload.imageUrl ? { backgroundImage: `url(${item.payload.imageUrl})` } : undefined}>{item.payload.imageUrl ? "" : item.name.slice(0,2).toUpperCase()}</i><span><strong>{item.name}</strong><small>{item.payload.specialization}</small></span><b>{"★".repeat(item.payload.difficulty)}</b></button>)}</nav></aside>
    <article className="lore-dossier"><header><div className={`lore-dossier__sigil ${entry.payload.imageUrl ? "has-image" : ""}`} style={entry.payload.imageUrl ? { backgroundImage: `url(${entry.payload.imageUrl})` } : undefined}>{entry.payload.imageUrl ? "" : entry.name.slice(0,2).toUpperCase()}</div><div><span className="eyebrow">Arquivo de classe</span><h2>{entry.name}</h2><p>{entry.payload.description}</p></div><dl><div><dt>Dificuldade</dt><dd>{entry.payload.difficulty}/5</dd></div><div><dt>Função</dt><dd>{entry.payload.specialization}</dd></div><div><dt>Atributos</dt><dd>{entry.payload.primaryAttributes.join(" · ")}</dd></div></dl></header>
      <section className="lore-resource"><div><small>Recurso exclusivo</small><h3>{entry.payload.resource.name}</h3><strong>{entry.payload.resource.initial} inicial · máximo {entry.payload.resource.maximum}</strong></div><p>{entry.payload.mechanic.description}</p></section>
      <section><div className="lore-section-title"><span>01</span><div><small>Especializações</small><h3>Caminhos de {entry.name}</h3></div></div><div className="path-dossier-grid">{entry.payload.paths.map((path) => <article key={path.key}><header><span>{path.name.slice(0,1)}</span><div><small>Caminho</small><h4>{path.name}</h4></div></header><p>{path.description}</p><div className="path-passive"><small>Passiva</small><b>{path.passive.name}</b><span>{path.passive.description}</span></div>{path.skills.map((skill) => <div className="path-technique" key={skill.key}><small>Nível {skill.level} · {skill.category}</small><b>{skill.name}</b><p>{skill.playerDescription}</p><span>{skill.cost} {entry.payload.resource.name} · CDR {skill.cooldown}</span></div>)}</article>)}</div></section>
      <section><div className="lore-section-title"><span>02</span><div><small>Progressão principal</small><h3>Habilidades da classe</h3></div></div><div className="ability-ledger">{entry.payload.progression.map((skill) => <article key={skill.key}><div><span>{String(skill.level).padStart(2,"0")}</span><small>Nível</small></div><section><header><b>{skill.name}</b><em>{skill.type} · {skill.category}</em></header><p>{skill.playerDescription}</p><footer><span>{skill.cost ? `${skill.cost} ${entry.payload.resource.name}` : "Sem custo"}</span><span>Recarga {skill.cooldown}</span><span>{skill.reachText}</span></footer></section></article>)}</div></section>
    </article>
  </div>;
}
