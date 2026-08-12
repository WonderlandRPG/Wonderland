"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayerRanking } from "@/components/ranking/player-ranking";
import { RankBadge } from "@/components/characters/rank-badge";
import type { PvpRankingEntry, RankingEntry } from "@/lib/game/player-portal";

export function RankingHall({
  levelEntries,
  pvpEntries,
}: {
  levelEntries: RankingEntry[];
  pvpEntries: PvpRankingEntry[];
}) {
  const [mode, setMode] = useState<"level" | "pvp">("level");
  return (
    <div className="ranking-hall">
      <nav className="ranking-mode-tabs" aria-label="Tipo de ranking">
        <button
          className={mode === "level" ? "is-active" : ""}
          onClick={() => setMode("level")}
          type="button"
        >
          <small>Progressão geral</small>
          <strong>Ranking por nível</strong>
          <span>Nível e XP</span>
        </button>
        <button
          className={mode === "pvp" ? "is-active" : ""}
          onClick={() => setMode("pvp")}
          type="button"
        >
          <small>Arena competitiva</small>
          <strong>Ranking PvP</strong>
          <span>Taxa de vitória</span>
        </button>
      </nav>
      {mode === "level" ? (
        <PlayerRanking entries={levelEntries} />
      ) : (
        <PvpRanking entries={pvpEntries} />
      )}
    </div>
  );
}

function PvpRanking({ entries }: { entries: PvpRankingEntry[] }) {
  if (!entries.length)
    return (
      <section className="ranking-empty pvp-ranking-empty">
        <span>VS</span>
        <h2>A temporada PvP aguarda seu primeiro campeão</h2>
        <p>As classificações aparecerão quando uma luta oficial for concluída.</p>
      </section>
    );
  const leader = entries[0];
  return (
    <div className="pvp-ranking">
      <section className="pvp-ranking-hero">
        <div>
          <span className="eyebrow">Temporada competitiva</span>
          <h2>Glória na Arena</h2>
          <p>
            A taxa de vitória define a posição. Em caso de empate, vence quem possuir mais vitórias
            e partidas.
          </p>
        </div>
        <article>
          <Avatar entry={leader} />
          <div>
            <small>Líder PvP</small>
            <h3>{leader.name}</h3>
            <strong>{Number(leader.win_rate).toFixed(1)}%</strong>
            <span>
              {leader.victories} vitórias em {leader.matches} partidas
            </span>
          </div>
        </article>
      </section>
      <section className="ranking-board pvp-ranking-board">
        <header className="ranking-board__header">
          <div>
            <span className="eyebrow">Classificação oficial</span>
            <h2>Melhores duelistas</h2>
          </div>
          <small>{entries.length} combatentes classificados</small>
        </header>
        <div className="pvp-ranking-table">
          <div className="pvp-ranking-labels">
            <span>Posição</span>
            <span>Personagem</span>
            <span>Partidas</span>
            <span>Vitórias</span>
            <span>Derrotas</span>
            <span>Taxa</span>
          </div>
          {entries.map((entry) => (
            <Link href={`/jogadores/${entry.user_id}`} key={entry.id}>
              <b>#{entry.position}</b>
              <span className="pvp-ranking-player">
                <Avatar entry={entry} />
                <span>
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.race_name} · {entry.class_name}
                  </small>
                </span>
                <RankBadge compact rank={entry.adventure_rank} />
              </span>
              <span>{entry.matches}</span>
              <span className="is-win">{entry.victories}</span>
              <span className="is-loss">{entry.defeats}</span>
              <strong className="pvp-win-rate">{Number(entry.win_rate).toFixed(1)}%</strong>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Avatar({ entry }: { entry: { name: string; image_url: string | null } }) {
  return (
    <span
      className={`ranking-avatar ${entry.image_url ? "is-image" : ""}`}
      style={entry.image_url ? { backgroundImage: `url(${entry.image_url})` } : undefined}
    >
      {entry.image_url ? "" : entry.name.slice(0, 2).toUpperCase()}
    </span>
  );
}
