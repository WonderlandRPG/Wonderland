"use client";

import { useMemo, useState } from "react";
import type { RacePayload } from "@/lib/game/races";
import { getStructuredRaceAbilities } from "@/lib/game/races";
import styles from "./grimoire.module.css";

type Entry = { id: string; name: string; slug: string; payload: RacePayload };

export function RaceGrimoire({ entries }: { entries: Entry[] }) {
  const [selected, setSelected] = useState(entries[0]?.slug ?? "");
  const [search, setSearch] = useState("");
  const visible = useMemo(
    () => entries.filter((entry) => `${entry.name} ${entry.payload.specialization}`.toLowerCase().includes(search.toLowerCase())),
    [entries, search],
  );
  const entry = entries.find((item) => item.slug === selected) ?? visible[0] ?? entries[0];
  if (!entry) return null;
  const abilities = getStructuredRaceAbilities(entry.payload);

  return (
    <div className={styles.book}>
      <aside className={styles.index}>
        <label className={styles.search}>
          <span>Índice dos povos</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Procure pelo nome ou estilo..." />
        </label>
        <nav className={styles.list}>
          {visible.map((item) => (
            <button aria-pressed={item.slug === entry.slug} className={`${styles.entry} ${item.slug === entry.slug ? styles.entryActive : ""}`} onClick={() => setSelected(item.slug)} key={item.slug} type="button">
              <i className={styles.portrait} style={item.payload.imageUrl ? { backgroundImage: `url(${item.payload.imageUrl})` } : undefined}>
                {item.payload.imageUrl ? "" : item.name.slice(0, 2).toUpperCase()}
              </i>
              <span><strong>{item.name}</strong><small>{item.payload.specialization}</small></span>
              <b>{"★".repeat(item.payload.difficulty)}</b>
            </button>
          ))}
        </nav>
        {visible.length === 0 ? <p className={styles.emptyIndex}>Nenhum povo encontrado.</p> : null}
      </aside>

      <article className={styles.sheet}>
        <header className={styles.showcase}>
          <div className={styles.art} style={entry.payload.imageUrl ? { backgroundImage: `url(${entry.payload.imageUrl})` } : undefined}>
            {entry.payload.imageUrl ? null : <span className={styles.artFallback}><b>{entry.name.slice(0, 1)}</b><small>{entry.name}</small></span>}
          </div>
          <div className={styles.identity}>
            <small>Povo de Wonderland</small>
            <h2>{entry.name}</h2>
            <strong>{entry.payload.specialization}</strong>
            <p>{entry.payload.description}</p>
            <dl className={styles.facts}>
              <div><dt>HP base</dt><dd>{entry.payload.baseHp}</dd></div>
              <div><dt>Recurso</dt><dd>{entry.payload.resource?.name ?? "Nenhum"}</dd></div>
              <div><dt>Dificuldade</dt><dd>{entry.payload.difficulty}/5</dd></div>
            </dl>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.mechanic}>
            <div><small>Mecânica racial</small><h3>{entry.payload.resource?.name ?? entry.payload.mechanics[0]?.name ?? "Traço racial"}</h3><strong>{entry.payload.resource ? `${entry.payload.resource.initial} inicial · máximo ${entry.payload.resource.maximum}` : "Passiva permanente"}</strong></div>
            <p>{entry.payload.mechanics.map((item) => item.description).join(" ")}</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}><span>I</span><div><small>Herança</small><h3>Traços e bônus raciais</h3></div></div>
          <div className={styles.cards}>
            <article className={styles.card}><small>Bônus de atributos</small><div className={styles.bonuses}>{Object.entries(entry.payload.attributeBonuses).filter(([, value]) => value > 0).map(([key, value]) => <span key={key}><b>{key}</b>+{value}</span>)}</div></article>
            {entry.payload.traits.map((trait) => <article className={styles.card} key={trait.name}><small>Traço permanente</small><h4>{trait.name}</h4><p>{trait.description}</p></article>)}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}><span>II</span><div><small>Despertar</small><h3>Habilidades de {entry.name}</h3></div></div>
          <div className={styles.ledger}>
            {abilities.map((skill) => (
              <article className={styles.skill} key={skill.key}>
                <div className={styles.level}><b>{String(skill.level).padStart(2, "0")}</b><small>Nível</small></div>
                <div className={styles.skillBody}><header><b>{skill.name}</b><em>{skill.type} · {skill.category}</em></header><p>{skill.playerDescription}</p><footer><span>{skill.cost ? `${skill.cost} ${entry.payload.resource?.name ?? "recurso"}` : "Sem custo"}</span><span>Recarga {skill.cooldown}</span><span>{skill.reachText}</span></footer></div>
              </article>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
