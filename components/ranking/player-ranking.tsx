"use client";

import Link from "next/link";
import { useState } from "react";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { RankBadge } from "@/components/characters/rank-badge";
import type { EquippedTitleData } from "@/components/characters/equipped-title";
import { kingdomName } from "@/lib/game/kingdoms";
import type { RankingEntry } from "@/lib/game/player-portal";
import styles from "./ranking.module.css";

const rankOrder = ["Todos", "E", "D", "C", "B", "A", "S", "EX"] as const;
const adventureRankOrder = ["E", "D", "C", "B", "A", "S", "EX"] as const;

function titleData(
  entry: Pick<RankingEntry, "title_name" | "title_style" | "title_rarity">,
): EquippedTitleData | null {
  if (!entry.title_name) return null;
  const style = entry.title_style;
  const titleStyle =
    style && typeof style === "object" && !Array.isArray(style)
      ? {
          primary: String(style.primary ?? "#fff1b5"),
          secondary: String(style.secondary ?? "#1f7a4c"),
          glow: String(style.glow ?? "#d7ad45"),
        }
      : null;
  return { name: entry.title_name, rarity: entry.title_rarity ?? "title", titleStyle };
}

export function PlayerRanking({
  currentCharacterId,
  entries,
}: {
  currentCharacterId: string;
  entries: RankingEntry[];
}) {
  const [query, setQuery] = useState("");
  const [rank, setRank] = useState<(typeof rankOrder)[number]>("Todos");
  const leaders = entries.slice(0, 3);
  const podium = [leaders[1], leaders[0], leaders[2]].filter(Boolean).map((entry) => ({
    entry,
    position: entries.indexOf(entry) + 1,
  }));
  const highestRank = entries.reduce(
    (highest, entry) =>
      adventureRankOrder.indexOf(entry.adventure_rank as (typeof adventureRankOrder)[number]) >
      adventureRankOrder.indexOf(highest as (typeof adventureRankOrder)[number])
        ? entry.adventure_rank
        : highest,
    "E",
  );
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const visible = entries.filter(
    (entry) =>
      (rank === "Todos" || entry.adventure_rank === rank) &&
      (!normalized ||
        `${entry.name} ${entry.race_name} ${entry.class_name} ${kingdomName(entry.kingdom)}`
          .toLocaleLowerCase("pt-BR")
          .includes(normalized)),
  );
  const currentEntry = entries.find((entry) => entry.id === currentCharacterId);

  if (!entries.length) {
    return (
      <div className={styles.empty} data-wl-surface="raised">
        <span aria-hidden="true">♜</span>
        <h2>O primeiro lugar ainda está livre</h2>
        <p>Os aventureiros aparecerão aqui assim que começarem a progredir.</p>
      </div>
    );
  }

  return (
    <div className={styles.levelRanking}>
      <section className={styles.summary} data-wl-surface="dark">
        <div className={styles.summaryCopy}>
          <span className={styles.eyebrow}>Temporada inaugural</span>
          <h2>Progresso dos aventureiros</h2>
          <p>O nível define a posição. A experiência acumulada decide os empates.</p>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>Competidores</dt>
            <dd>{entries.length}</dd>
          </div>
          <div>
            <dt>Maior nível</dt>
            <dd>{entries[0]?.level ?? 0}</dd>
          </div>
          <div>
            <dt>Rank mais alto</dt>
            <dd>{highestRank}</dd>
          </div>
          <div className={styles.selfStat}>
            <dt>Sua posição</dt>
            <dd>{currentEntry ? `#${currentEntry.rank}` : "—"}</dd>
            <small>{currentEntry ? `Nível ${currentEntry.level}` : "Sem registro"}</small>
          </div>
        </dl>
      </section>

      <section
        className={styles.podiumSection}
        aria-labelledby="ranking-podium-title"
        data-wl-surface="dark"
      >
        <header className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Destaques</span>
            <h2 id="ranking-podium-title">Pódio da temporada</h2>
          </div>
          <p>Os três aventureiros com maior progresso.</p>
        </header>
        <div className={styles.podium}>
          {podium.map(({ entry, position }) => (
            <Link
              className={`${styles.podiumPlace} ${styles[`place${position}`]} ${entry.id === currentCharacterId ? styles.current : ""}`}
              href={`/jogadores/${entry.id}`}
              key={entry.id}
            >
              <span className={styles.medal} aria-label={`${position}º colocado`}>
                {position}
              </span>
              {position === 1 ? (
                <span className={styles.crown} aria-hidden="true">
                  ♛
                </span>
              ) : null}
              <span className={styles.podiumPortrait}>
                <CharacterPortraitCard
                  imageUrl={entry.image_url}
                  level={entry.level}
                  name={entry.name}
                  rank={entry.adventure_rank}
                  title={titleData(entry)}
                  cosmetics={entry.cosmetics}
                  variant="ranking"
                />
              </span>
              <span className={styles.podiumDetails}>
                <small>{position === 1 ? "Líder da temporada" : `${position}º colocado`}</small>
                <strong>{entry.name}</strong>
                <span>
                  {entry.race_name} · {entry.class_name}
                </span>
                <span className={styles.score}>
                  <b>Nível {entry.level}</b>
                  <small>{entry.xp.toLocaleString("pt-BR")} XP</small>
                </span>
                {entry.id === currentCharacterId ? <em className={styles.youBadge}>Você</em> : null}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.board} data-wl-surface="raised">
        <header className={styles.boardHeader}>
          <div>
            <span className={styles.eyebrow}>Classificação geral</span>
            <h2>Todos os jogadores</h2>
            <p>
              {visible.length} de {entries.length} aventureiros exibidos
            </p>
          </div>
          <label className={styles.search}>
            <span>Buscar aventureiro</span>
            <input
              data-wl-field
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, raça, classe ou reino"
              type="search"
              value={query}
            />
          </label>
        </header>
        <nav className={styles.filters} aria-label="Filtrar por Rank">
          {rankOrder.map((option) => (
            <button
              aria-pressed={rank === option}
              data-wl-action={rank === option ? "primary" : undefined}
              className={rank === option ? styles.activeFilter : ""}
              key={option}
              onClick={() => setRank(option)}
              type="button"
            >
              {option === "Todos" ? option : `Rank ${option}`}
            </button>
          ))}
        </nav>
        <div className={styles.listHeader} aria-hidden="true">
          <span>Posição</span>
          <span>Aventureiro</span>
          <span>Progresso</span>
          <span>Rank</span>
        </div>
        <div className={styles.rankingList} role="list" aria-label="Ranking de jogadores">
          {visible.map((entry) => (
            <Link
              className={`${styles.rankingEntry} ${entry.id === currentCharacterId ? styles.current : ""}`}
              href={`/jogadores/${entry.id}`}
              key={entry.id}
              role="listitem"
            >
              <strong className={styles.position}>#{entry.rank}</strong>
              <span className={styles.playerCell}>
                <CharacterPortraitCard
                  imageUrl={entry.image_url}
                  level={entry.level}
                  name={entry.name}
                  rank={entry.adventure_rank}
                  title={titleData(entry)}
                  cosmetics={entry.cosmetics}
                  variant="compact"
                />
                <span className={styles.identity}>
                  <b>{entry.name}</b>
                  <small>
                    {entry.race_name} · {entry.class_name}
                  </small>
                  <em>{kingdomName(entry.kingdom)}</em>
                </span>
              </span>
              <span className={styles.progress}>
                <b>Nível {entry.level}</b>
                <small>{entry.xp.toLocaleString("pt-BR")} XP</small>
              </span>
              <span className={styles.rankCell}>
                <RankBadge compact rank={entry.adventure_rank} />
                <small>Rank {entry.adventure_rank}</small>
              </span>
              {entry.id === currentCharacterId ? <em className={styles.youBadge}>Você</em> : null}
            </Link>
          ))}
          {!visible.length ? (
            <div className={styles.noResults}>
              <strong>Nenhum aventureiro encontrado</strong>
              <p>Tente outro nome ou selecione um Rank diferente.</p>
              <button
                data-wl-action="primary"
                onClick={() => {
                  setQuery("");
                  setRank("Todos");
                }}
                type="button"
              >
                Limpar filtros
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
