"use client";

import Link from "next/link";
import { useState } from "react";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { RankBadge } from "@/components/characters/rank-badge";
import type { EquippedTitleData } from "@/components/characters/equipped-title";
import { kingdomName } from "@/lib/game/kingdoms";
import type { RankingEntry } from "@/lib/game/player-portal";
import { parseTitleStyle } from "@/lib/game/title-style";

const rankOrder = ["Todos", "E", "D", "C", "B", "A", "S", "EX"] as const;
const adventureRankOrder = ["E", "D", "C", "B", "A", "S", "EX"] as const;

function titleData(entry: Pick<RankingEntry, "title_name" | "title_style" | "title_rarity">): EquippedTitleData | null {
  if (!entry.title_name) return null;
  const style = entry.title_style;
  const titleStyle = style && typeof style === "object" && !Array.isArray(style)
    ? parseTitleStyle(style)
    : null;
  return { name: entry.title_name, rarity: entry.title_rarity ?? "title", titleStyle };
}

export function PlayerRanking({ currentCharacterId, entries }: { currentCharacterId: string; entries: RankingEntry[] }) {
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
      <div className="leaderboard-empty">
        <span aria-hidden="true">♜</span>
        <h2>O primeiro lugar ainda está livre</h2>
        <p>Os aventureiros aparecerão aqui assim que começarem a progredir.</p>
      </div>
    );
  }

  return (
    <div className="player-ranking">
      <section className="leaderboard-season-banner">
        <div>
          <span className="eyebrow">Temporada inaugural</span>
          <h2>Salão dos grandes aventureiros</h2>
          <p>O nível define a posição. A experiência decide os empates.</p>
        </div>
        <dl>
          <div><dt>Competidores</dt><dd>{entries.length}</dd></div>
          <div><dt>Maior nível</dt><dd>{entries[0]?.level ?? 0}</dd></div>
          <div><dt>Rank mais alto</dt><dd>{highestRank}</dd></div>
          <div className="leaderboard-self"><dt>Sua posição</dt><dd>{currentEntry ? `#${currentEntry.rank}` : "—"}</dd><small>{currentEntry ? `Nível ${currentEntry.level}` : "Sem registro"}</small></div>
        </dl>
      </section>

      <section className="leaderboard-podium" aria-label="Pódio dos três melhores jogadores">
        {podium.map(({ entry, position }) => (
          <Link className={`leaderboard-podium__place is-place-${position} ${entry.id === currentCharacterId ? "is-current" : ""}`} href={`/jogadores/${entry.id}`} key={entry.id}>
            <b className="leaderboard-podium__number">{position}</b>
            <span className="leaderboard-podium__portrait official-leaderboard-card-host">
              {position === 1 ? <span className="leaderboard-crown" aria-label="Primeiro colocado">♛</span> : null}
              <CharacterPortraitCard
                className="leaderboard-character-card"
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
              <p>{entry.race_name} · {entry.class_name}</p>
              <strong className="leaderboard-podium__score">Nível {entry.level} <small>{entry.xp.toLocaleString("pt-BR")} XP</small></strong>
            </div>
          </Link>
        ))}
      </section>

      <section className="leaderboard-board">
        <header className="leaderboard-board__header">
          <div><span className="eyebrow">Classificação geral</span><h2>Todos os jogadores</h2></div>
          <label className="leaderboard-search"><span className="sr-only">Buscar jogador</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jogador, raça ou classe..." type="search" value={query} /></label>
        </header>
        <nav className="leaderboard-filters" aria-label="Filtrar por Rank">
          {rankOrder.map((option) => (
            <button aria-pressed={rank === option} className={rank === option ? "is-active" : ""} key={option} onClick={() => setRank(option)} type="button">
              {option === "Todos" ? option : `Rank ${option}`}
            </button>
          ))}
        </nav>
        <p className="leaderboard-result-count" aria-live="polite">{visible.length} de {entries.length} aventureiros</p>
        <div className="leaderboard-grid" role="list" aria-label="Ranking de jogadores">
          {visible.map((entry) => (
            <Link className={`leaderboard-grid__entry ${entry.id === currentCharacterId ? "is-current" : ""}`} href={`/jogadores/${entry.id}`} key={entry.id} role="listitem">
              <strong className="leaderboard-grid__position"><small>Posição</small>#{entry.rank}</strong>
              <span className="leaderboard-grid__portrait">
                <CharacterPortraitCard
                  className="leaderboard-character-card leaderboard-grid-character-card"
                  imageUrl={entry.image_url}
                  level={entry.level}
                  name={entry.name}
                  rank={entry.adventure_rank}
                  title={titleData(entry)}
                  cosmetics={entry.cosmetics}
                  variant="standard"
                />
              </span>
              <span className="leaderboard-grid__details">
                <span className="leaderboard-grid__identity"><b>{entry.name}</b><small>{entry.race_name} · {entry.class_name}</small><em>{kingdomName(entry.kingdom)}</em></span>
                <span className="leaderboard-grid__metrics">
                  <span className="leaderboard-grid__progress"><small>Progresso</small><b>Nível {entry.level}</b><em>{entry.xp.toLocaleString("pt-BR")} XP</em></span>
                  <span className="leaderboard-grid__rank"><RankBadge compact rank={entry.adventure_rank} /><small>Rank {entry.adventure_rank}</small></span>
                </span>
              </span>
            </Link>
          ))}
          {!visible.length ? <p className="leaderboard-no-results">Nenhum aventureiro encontrado com esses filtros.</p> : null}
        </div>
      </section>
    </div>
  );
}
