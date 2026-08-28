"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { RankBadge } from "@/components/characters/rank-badge";
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
  const [selectedCreature, setSelectedCreature] = useState<BestiaryCreature | null>(null);
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

  useEffect(() => {
    if (!selectedCreature) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCreature(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedCreature]);

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
            <button
              aria-label={`Abrir ficha de ${creature.name}`}
              className="bestiary-card__trigger"
              onClick={() => setSelectedCreature(creature)}
              type="button"
            >
              <Image
                alt={`Ilustração de ${creature.name}`}
                fill
                sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 33vw"
                src={creature.imageUrl}
              />
              <span className="bestiary-card__caption">
                <small>{creature.category}</small>
                <strong>{creature.name}</strong>
                <em>Ver ficha completa</em>
              </span>
              <span className="bestiary-card__rank">
                <RankBadge compact rank={creature.rank} />
              </span>
            </button>
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
      {selectedCreature ? (
        <div
          aria-label={`Ficha de ${selectedCreature.name}`}
          aria-modal="true"
          className="bestiary-modal"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedCreature(null);
          }}
          role="dialog"
        >
          <article className="bestiary-modal__card" data-rank={selectedCreature.rank}>
            <button
              aria-label="Fechar ficha"
              className="bestiary-modal__close"
              onClick={() => setSelectedCreature(null)}
              type="button"
            >
              ×
            </button>
            <div className="bestiary-modal__portrait">
              <Image
                alt={`Ilustração de ${selectedCreature.name}`}
                fill
                sizes="(max-width: 760px) 100vw, 42vw"
                src={selectedCreature.imageUrl}
              />
              <span className="bestiary-modal__rank">
                <RankBadge compact rank={selectedCreature.rank} />
              </span>
            </div>
            <div className="bestiary-modal__content">
              <header>
                <small>{selectedCreature.category}</small>
                <h2>{selectedCreature.name}</h2>
              </header>
              <p className="bestiary-card__description">{selectedCreature.description}</p>
              <dl>
                <div>
                  <dt>Tamanho</dt>
                  <dd>{selectedCreature.size}</dd>
                </div>
                <div>
                  <dt>Reação comum</dt>
                  <dd>{selectedCreature.disposition}</dd>
                </div>
              </dl>
              <div className="bestiary-card__section">
                <small>COMPORTAMENTO EM CAMPO</small>
                <p>{selectedCreature.behavior}</p>
              </div>
              <div className="bestiary-card__section is-weakness">
                <small>FRAQUEZAS CONHECIDAS</small>
                <ul>
                  {selectedCreature.weaknesses.map((weakness) => (
                    <li key={weakness}>{weakness}</li>
                  ))}
                </ul>
                <strong className="bestiary-card__combat-effect">
                  No PvE: +25% de dano{" "}
                  {getCreatureWeaknessKind(selectedCreature.weaknesses) === "physical"
                    ? "físico"
                    : "mágico"}
                </strong>
              </div>
              <footer>
                <small>Habitat</small>
                <span>{selectedCreature.habitats.join(" · ")}</span>
              </footer>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
