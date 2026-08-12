"use client";
import { useMemo, useState } from "react";
import type { RacePayload } from "@/lib/game/races";
import { getStructuredRaceAbilities } from "@/lib/game/races";

type Entry = { id: string; name: string; slug: string; payload: RacePayload };
export function RaceCodex({ entries }: { entries: Entry[] }) {
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
  const abilities = getStructuredRaceAbilities(entry.payload);
  return (
    <div className="lore-browser">
      <aside className="lore-browser__index">
        <label>
          <span>Buscar raça</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou estilo"
          />
        </label>
        <nav>
          {visible.map((item) => (
            <button
              className={item.slug === entry.slug ? "is-active" : ""}
              onClick={() => setSelected(item.slug)}
              key={item.slug}
            >
              <i
                className={item.payload.imageUrl ? "has-image" : ""}
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
      <article className="lore-dossier">
        <header>
          <div
            className={`lore-dossier__sigil ${entry.payload.imageUrl ? "has-image" : ""}`}
            style={
              entry.payload.imageUrl
                ? { backgroundImage: `url(${entry.payload.imageUrl})` }
                : undefined
            }
          >
            {entry.payload.imageUrl ? "" : entry.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="eyebrow">Arquivo racial</span>
            <h2>{entry.name}</h2>
            <p>{entry.payload.description}</p>
          </div>
          <dl>
            <div>
              <dt>HP base</dt>
              <dd>{entry.payload.baseHp}</dd>
            </div>
            <div>
              <dt>Recurso racial</dt>
              <dd>{entry.payload.resource?.name ?? "Nenhum"}</dd>
            </div>
            <div>
              <dt>Dificuldade</dt>
              <dd>{entry.payload.difficulty}/5</dd>
            </div>
          </dl>
        </header>
        <section className="lore-resource">
          <div>
            <small>Mecânica racial</small>
            <h3>
              {entry.payload.resource?.name ?? entry.payload.mechanics[0]?.name ?? "Traço racial"}
            </h3>
            <strong>
              {entry.payload.resource
                ? `${entry.payload.resource.initial} inicial · máximo ${entry.payload.resource.maximum}`
                : "Passiva permanente"}
            </strong>
          </div>
          <p>{entry.payload.mechanics.map((item) => item.description).join(" ")}</p>
        </section>
        <section>
          <div className="lore-section-title">
            <span>01</span>
            <div>
              <small>Identidade</small>
              <h3>Traços e bônus raciais</h3>
            </div>
          </div>
          <div className="race-trait-grid">
            <article>
              <small>Bônus de atributos</small>
              <div>
                {Object.entries(entry.payload.attributeBonuses)
                  .filter(([, value]) => value > 0)
                  .map(([key, value]) => (
                    <span key={key}>
                      <b>{key}</b>+{value}
                    </span>
                  ))}
              </div>
            </article>
            {entry.payload.traits.map((trait) => (
              <article key={trait.name}>
                <small>Traço permanente</small>
                <h4>{trait.name}</h4>
                <p>{trait.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className="lore-section-title">
            <span>02</span>
            <div>
              <small>Progressão racial</small>
              <h3>Habilidades de {entry.name}</h3>
            </div>
          </div>
          <div className="ability-ledger">
            {abilities.map((skill) => (
              <article key={skill.key}>
                <div>
                  <span>{String(skill.level).padStart(2, "0")}</span>
                  <small>Nível</small>
                </div>
                <section>
                  <header>
                    <b>{skill.name}</b>
                    <em>
                      {skill.type} · {skill.category}
                    </em>
                  </header>
                  <p>{skill.playerDescription}</p>
                  <footer>
                    <span>
                      {skill.cost
                        ? `${skill.cost} ${entry.payload.resource?.name ?? "recurso"}`
                        : "Sem custo"}
                    </span>
                    <span>Recarga {skill.cooldown}</span>
                    <span>{skill.reachText}</span>
                  </footer>
                </section>
              </article>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
