"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { BestiaryCreature, CreatureRank } from "@/lib/game/bestiary";
import { creatureRanks, getCreatureWeaknessKind } from "@/lib/game/bestiary";

const rankCopy: Record<CreatureRank, string> = {
  E: "Inofensivas ou facilmente contidas",
  D: "Ameaças pequenas e territoriais",
  C: "Predadores e monstros de grande porte",
  B: "Caçadores sobrenaturais e líderes de matilha",
  A: "Criaturas capazes de destruir expedições",
  S: "Calamidades com risco extremo de vida",
  EX: "Entidades que podem mudar o mundo",
};

export function BestiaryCatalog({
  creatures,
  initialQuery = "",
}: {
  creatures: BestiaryCreature[];
  initialQuery?: string;
}) {
  const [rank, setRank] = useState<CreatureRank | "TODOS">("TODOS");
  const [category, setCategory] = useState("TODAS");
  const [query, setQuery] = useState(initialQuery);
  const categories = useMemo(
    () =>
      [...new Set(creatures.map((creature) => creature.category))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [creatures],
  );
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return creatures.filter(
      (creature) =>
        (rank === "TODOS" || creature.rank === rank) &&
        (category === "TODAS" || creature.category === category) &&
        (!normalized ||
          [creature.name, creature.category, creature.description, ...creature.habitats]
            .join(" ")
            .toLocaleLowerCase("pt-BR")
            .includes(normalized)),
    );
  }, [category, creatures, query, rank]);

  return (
    <>
      <section className="bestiary-controls" aria-label="Filtros do bestiário">
        <label>
          <span>Procurar criatura</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, espécie ou habitat..."
            type="search"
            value={query}
          />
        </label>
        <label>
          <span>Família</span>
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="TODAS">Todas as famílias</option>
            {categories.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </label>
        <div className="bestiary-rank-filter">
          <span>Periculosidade</span>
          <div>
            <button
              className={rank === "TODOS" ? "is-active" : ""}
              onClick={() => setRank("TODOS")}
              type="button"
            >
              Todos
            </button>
            {creatureRanks.map((entry) => (
              <button
                className={rank === entry ? "is-active" : ""}
                data-rank={entry}
                key={entry}
                onClick={() => setRank(entry)}
                type="button"
              >
                {entry}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="bestiary-result-line">
        <span>{visible.length} registros encontrados</span>
        {rank !== "TODOS" ? (
          <p>
            <b>Rank {rank}</b> · {rankCopy[rank]}
          </p>
        ) : (
          <p>Arquivo completo da Guilda</p>
        )}
      </div>
      <section className="bestiary-grid">
        {visible.map((creature) => (
          <article className="bestiary-card" data-rank={creature.rank} key={creature.id}>
            <div className="bestiary-card__portrait">
              <Image
                alt={`Ilustração de ${creature.name}`}
                fill
                sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 33vw"
                src={creature.imageUrl}
              />
              <span className="bestiary-card__rank" aria-label={`Criatura Rank ${creature.rank}`}>
                RANK <b>{creature.rank}</b>
              </span>
            </div>
            <header>
              <div>
                <small>{creature.category}</small>
                <h2>{creature.name}</h2>
              </div>
            </header>
            <p className="bestiary-card__description">{creature.description}</p>
            <dl>
              <div>
                <dt>Tamanho</dt>
                <dd>{creature.size}</dd>
              </div>
              <div>
                <dt>Reação comum</dt>
                <dd>{creature.disposition}</dd>
              </div>
            </dl>
            <div className="bestiary-card__section">
              <small>COMPORTAMENTO EM CAMPO</small>
              <p>{creature.behavior}</p>
            </div>
            <div className="bestiary-card__section is-weakness">
              <small>FRAQUEZAS CONHECIDAS</small>
              <ul>
                {creature.weaknesses.map((weakness) => (
                  <li key={weakness}>{weakness}</li>
                ))}
              </ul>
              <strong className="bestiary-card__combat-effect">
                No PvE: +25% de dano {getCreatureWeaknessKind(creature.weaknesses) === "physical" ? "físico" : "mágico"}
              </strong>
            </div>
            <footer>
              <small>Habitat</small>
              <span>{creature.habitats.join(" · ")}</span>
            </footer>
          </article>
        ))}
      </section>
      {!visible.length ? (
        <div className="bestiary-empty">
          <span>?</span>
          <h2>Nenhum registro encontrado</h2>
          <p>Tente outro Rank, família ou termo de busca.</p>
        </div>
      ) : null}
    </>
  );
}
