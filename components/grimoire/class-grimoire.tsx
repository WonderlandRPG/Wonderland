"use client";

import { useMemo, useState } from "react";
import type { ClassPayload } from "@/lib/game/classes";
import styles from "./grimoire.module.css";

type Entry = { id: string; name: string; slug: string; payload: ClassPayload };

export function ClassGrimoire({ entries }: { entries: Entry[] }) {
  const [selected, setSelected] = useState(entries[0]?.slug ?? "");
  const [search, setSearch] = useState("");
  const visible = useMemo(
    () =>
      entries.filter((entry) =>
        `${entry.name} ${entry.payload.specialization}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [entries, search],
  );
  const entry = entries.find((item) => item.slug === selected) ?? visible[0] ?? entries[0];
  if (!entry) return null;

  return (
    <div className={styles.book}>
      <aside className={styles.index}>
        <label className={styles.search}>
          <span>Índice das vocações</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Procure pela classe ou função..."
          />
        </label>
        <nav className={styles.list}>
          {visible.map((item) => (
            <button
              aria-pressed={item.slug === entry.slug}
              className={`${styles.entry} ${item.slug === entry.slug ? styles.entryActive : ""}`}
              data-ui="catalog-entry"
              onClick={() => setSelected(item.slug)}
              type="button"
              key={item.slug}
            >
              <i
                className={styles.portrait}
                style={
                  item.payload.imageUrl
                    ? { backgroundImage: `url(${item.payload.imageUrl})` }
                    : undefined
                }
              >
                {item.payload.imageUrl ? "" : item.name.slice(0, 2).toUpperCase()}
              </i>
              <span>
                <strong>{item.name}</strong>
                <small>{item.payload.specialization}</small>
              </span>
              <b>{"★".repeat(item.payload.difficulty)}</b>
            </button>
          ))}
        </nav>
      </aside>

      <article className={styles.sheet}>
        <header className={styles.showcase}>
          <div
            className={styles.art}
            style={
              entry.payload.imageUrl
                ? { backgroundImage: `url(${entry.payload.imageUrl})` }
                : undefined
            }
          />
          <div className={styles.identity}>
            <small>Vocação de aventureiro</small>
            <h2>{entry.name}</h2>
            <strong>{entry.payload.specialization}</strong>
            <p>{entry.payload.description}</p>
            <dl className={styles.facts}>
              <div>
                <dt>Dificuldade</dt>
                <dd>{entry.payload.difficulty}/5</dd>
              </div>
              <div>
                <dt>Função</dt>
                <dd>{entry.payload.specialization}</dd>
              </div>
              <div>
                <dt>Atributos</dt>
                <dd>{entry.payload.primaryAttributes.join(" · ")}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.mechanic}>
            <div>
              <small>Recurso exclusivo</small>
              <h3>{entry.payload.resource.name}</h3>
              <strong>
                {entry.payload.resource.initial} inicial · máximo {entry.payload.resource.maximum}
              </strong>
            </div>
            <p>{entry.payload.mechanic.description}</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>I</span>
            <div>
              <small>Nível 50</small>
              <h3>Caminhos de {entry.name}</h3>
            </div>
          </div>
          <div className={styles.pathGrid}>
            {entry.payload.paths.map((path) => (
              <article className={styles.path} key={path.key}>
                <small>Desbloqueio no nível {path.unlockLevel}</small>
                <h4>{path.name}</h4>
                <p>{path.description}</p>
                <div className={styles.pathMeta}>
                  <small>Missão de escolha</small>
                  <h4>{path.quest.title}</h4>
                  <p>{path.quest.briefing}</p>
                  <ol>
                    {path.quest.objectives.map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ol>
                </div>
                <div className={styles.pathMeta}>
                  <small>Passiva</small>
                  <h4>{path.passive.name}</h4>
                  <p>{path.passive.description}</p>
                </div>
                {path.skills.map((skill) => (
                  <div className={styles.pathMeta} key={skill.key}>
                    <small>
                      Nível {skill.level} · {skill.category}
                    </small>
                    <h4>{skill.name}</h4>
                    <p>{skill.playerDescription}</p>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>II</span>
            <div>
              <small>Progressão principal</small>
              <h3>Habilidades da classe</h3>
            </div>
          </div>
          <div className={styles.ledger}>
            {entry.payload.progression.map((skill) => (
              <article className={styles.skill} key={skill.key}>
                <div className={styles.level}>
                  <b>{String(skill.level).padStart(2, "0")}</b>
                  <small>Nível</small>
                </div>
                <div className={styles.skillBody}>
                  <header>
                    <b>{skill.name}</b>
                    <em>
                      {skill.type} · {skill.category}
                    </em>
                  </header>
                  <p>{skill.playerDescription}</p>
                  <footer>
                    <span>
                      {skill.cost ? `${skill.cost} ${entry.payload.resource.name}` : "Sem custo"}
                    </span>
                    <span>Recarga {skill.cooldown}</span>
                    <span>{skill.reachText}</span>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
