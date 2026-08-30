"use client";

import Link from "next/link";
import { useState } from "react";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { RankBadge } from "@/components/characters/rank-badge";
import { EquippedTitle, type EquippedTitleData } from "@/components/characters/equipped-title";
import { kingdomName } from "@/lib/game/kingdoms";
import type { RankingEntry } from "@/lib/game/player-portal";

const rankOrder = ["Todos", "E", "D", "C", "B", "A", "S", "EX"] as const;
const adventureRankOrder = ["E", "D", "C", "B", "A", "S", "EX"] as const;

function titleData(entry: Pick<RankingEntry, "title_name" | "title_style" | "title_rarity">): EquippedTitleData | null {
  if (!entry.title_name) return null;
  const style = entry.title_style;
  const titleStyle = style && typeof style === "object" && !Array.isArray(style)
    ? {
        primary: String(style.primary ?? "#fff1b5"),
        secondary: String(style.secondary ?? "#1f7a4c"),
        glow: String(style.glow ?? "#d7ad45"),
      }
    : null;
  return { name: entry.title_name, rarity: entry.title_rarity ?? "title", titleStyle };
}

function PlayerTitle({ entry }: { entry: RankingEntry }) {
  return <EquippedTitle title={titleData(entry)} />;
}

export function PlayerRanking({ entries }: { entries: RankingEntry[] }) {
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

  if (!entries.length) {
    return (
      <div className="ranking-empty">
        <span aria-hidden="true">♜</span>
        <h2>O primeiro lugar ainda está livre</h2>
        <p>Os aventureiros aparecerão aqui assim que começarem a progredir.</p>
      </div>
    );
  }

  return (
    <div className="player-ranking">
      <section className="ranking-season-banner">
        <div>
          <span className="eyebrow">Temporada inaugural</span>
          <h2>Salão dos grandes aventureiros</h2>
          <p>O nível define a posição. A experiência decide os empates.</p>
        </div>
        <dl>
          <div><dt>Competidores</dt><dd>{entries.length}</dd></div>
          <div><dt>Maior nível</dt><dd>{entries[0]?.level ?? 0}</dd></div>
          <div><dt>Rank mais alto</dt><dd>{highestRank}</dd></div>
        </dl>
      </section>

      <section className="ranking-podium" aria-label="Pódio dos três melhores jogadores">
        {podium.map(({ entry, position }) => (
          <Link className={`ranking-podium__place is-place-${position}`} href={`/jogadores/${entry.id}`} key={entry.id}>
            <b className="ranking-podium__number">{position}</b>
            <span className="ranking-podium__portrait official-ranking-card-host">
              {position === 1 ? <span className="ranking-crown" aria-label="Primeiro colocado">♛</span> : null}
              <CharacterPortraitCard
                className="ranking-character-card"
                imageUrl={entry.image_url}
                level={entry.level}
                name={entry.name}
                rank={entry.adventure_rank}
                title={titleData(entry)}
                cosmetics={entry.cosmetics}
                variant="standard"
              />
            </span>
            <div>
              <small>{position === 1 ? "Líder da temporada" : `${position}º colocado`}</small>
              <h3>{entry.name}</h3>
              <PlayerTitle entry={entry} />
              <p>{entry.race_name} · {entry.class_name}</p>
              <strong className="ranking-podium__score">Nível {entry.level} <small>{entry.xp.toLocaleString("pt-BR")} XP</small></strong>
            </div>
          </Link>
        ))}
      </section>

      <section className="ranking-board">
        <header className="ranking-board__header">
          <div><span className="eyebrow">Classificação geral</span><h2>Todos os jogadores</h2></div>
          <label className="ranking-search"><span className="sr-only">Buscar jogador</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jogador, raça ou classe..." type="search" value={query} /></label>
        </header>
        <nav className="ranking-filters" aria-label="Filtrar por Rank">
          {rankOrder.map((option) => (
            <button aria-pressed={rank === option} className={rank === option ? "is-active" : ""} key={option} onClick={() => setRank(option)} type="button">
              {option === "Todos" ? option : `Rank ${option}`}
            </button>
          ))}
        </nav>
        <div className="ranking-table" role="table" aria-label="Ranking de jogadores">
          <div className="ranking-table__labels" role="row"><span>Posição</span><span>Jogador</span><span>Reino</span><span>Progresso</span><span>Rank</span></div>
          {visible.map((entry) => (
            <Link href={`/jogadores/${entry.id}`} key={entry.id} role="row">
              <strong className="ranking-position">#{entry.rank}</strong>
              <span className="ranking-player-cell">
                <CharacterPortraitCard imageUrl={entry.image_url} level={entry.level} name={entry.name} rank={entry.adventure_rank} title={titleData(entry)} cosmetics={entry.cosmetics} variant="compact" />
                <span><b>{entry.name}</b><PlayerTitle entry={entry} /><small>{entry.race_name} · {entry.class_name}</small></span>
              </span>
              <span className="ranking-kingdom">{kingdomName(entry.kingdom)}</span>
              <span className="ranking-level"><b>Nível {entry.level}</b><small>{entry.xp.toLocaleString("pt-BR")} XP</small></span>
              <RankBadge compact rank={entry.adventure_rank} />
            </Link>
          ))}
          {!visible.length ? <p className="ranking-no-results">Nenhum aventureiro encontrado com esses filtros.</p> : null}
        </div>
      </section>
    </div>
  );
}
