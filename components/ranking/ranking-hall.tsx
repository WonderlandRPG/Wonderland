"use client";

import { useState } from "react";
import styles from "./ranking.module.css";
import Link from "next/link";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { PlayerRanking } from "@/components/ranking/player-ranking";
import { RankBadge } from "@/components/characters/rank-badge";
import type { PvpRankingEntry, RankingEntry } from "@/lib/game/player-portal";
import type { EquippedTitleData } from "@/components/characters/equipped-title";
import { parseTitleStyle } from "@/lib/game/title-style";

type PvpDisplayEntry = PvpRankingEntry & { level: number };

function titleData(entry: Pick<PvpRankingEntry, "title_name" | "title_style" | "title_rarity">): EquippedTitleData | null {
  if (!entry.title_name) return null;
  const style = entry.title_style;
  const titleStyle = style && typeof style === "object" && !Array.isArray(style)
    ? parseTitleStyle(style)
    : null;
  return { name: entry.title_name, rarity: entry.title_rarity ?? "title", titleStyle };
}

export function RankingHall({ currentCharacterId, levelEntries, pvpEntries }: { currentCharacterId: string; levelEntries: RankingEntry[]; pvpEntries: PvpDisplayEntry[] }) {
  const [mode, setMode] = useState<"level" | "pvp">("level");
  return (
    <section className={styles.root}>
      <header className="champion-hall__switcher">
        <div><small>LIVRO DE HONRA</small><h2>Escolha o registro</h2></div>
        <nav aria-label="Tipo de ranking">
          <button aria-pressed={mode === "level"} className={mode === "level" ? "is-active" : ""} onClick={() => setMode("level")} type="button"><span>Ⅰ</span><div><small>PROGRESSÃO DOS AVENTUREIROS</small><strong>Nível & Experiência</strong></div></button>
          <button aria-pressed={mode === "pvp"} className={mode === "pvp" ? "is-active" : ""} onClick={() => setMode("pvp")} type="button"><span>Ⅱ</span><div><small>ARENA DOS REINOS</small><strong>Vitórias & Derrotas</strong></div></button>
        </nav>
      </header>
      {mode === "level" ? <PlayerRanking currentCharacterId={currentCharacterId} entries={levelEntries} /> : <PvpRanking currentCharacterId={currentCharacterId} entries={pvpEntries} />}
    </section>
  );
}

function PvpRanking({ currentCharacterId, entries }: { currentCharacterId: string; entries: PvpDisplayEntry[] }) {
  if (!entries.length) return <section className="champion-empty"><span>⚔</span><h2>O salão aguarda seu primeiro campeão</h2><p>As placas de honra serão gravadas depois da primeira luta oficial.</p></section>;
  const leader = entries[0];
  return (
    <div className="duelboard-hall">
      <section className="duelboard-banner">
        <div className="duelboard-banner__portrait official-pvp-card-host">
          <span className="leaderboard-crown" aria-label="Primeiro colocado">♛</span>
          <CharacterPortraitCard
            imageUrl={leader.image_url}
            level={leader.level}
            name={leader.name}
            rank={leader.adventure_rank}
            title={titleData(leader)}
            cosmetics={leader.cosmetics}
            variant="standard"
          />
        </div>
        <div><small>CAMPEÃO DA ARENA</small><h2>{leader.name}</h2><strong>{Number(leader.win_rate).toFixed(1)}%</strong><p>{leader.victories} vitórias em {leader.matches} partidas</p></div>
        <aside><span>W</span><small>PLACA DE HONRA</small></aside>
      </section>
      <section className="duelboard-roll">
        <header><div><small>REGISTRO OFICIAL</small><h2>Ordem dos duelistas</h2></div><span>{entries.length} nomes gravados</span></header>
        <div>
          {entries.map((entry) => (
            <Link className={`duelboard-roll__entry ${entry.id === currentCharacterId ? "is-current" : ""}`} href={`/jogadores/${entry.id}`} key={entry.id}>
              <b>{String(entry.position).padStart(2, "0")}</b>
              <span className="duelboard-roll__identity">
                <CharacterPortraitCard imageUrl={entry.image_url} level={entry.level} name={entry.name} rank={entry.adventure_rank} title={titleData(entry)} cosmetics={entry.cosmetics} variant="compact" />
                <span><strong>{entry.name}</strong><small>{entry.race_name} · {entry.class_name}</small></span>
              </span>
              <RankBadge compact rank={entry.adventure_rank} />
              <dl><div><dt>Lutas</dt><dd>{entry.matches}</dd></div><div><dt>Vitórias</dt><dd>{entry.victories}</dd></div><div><dt>Derrotas</dt><dd>{entry.defeats}</dd></div><div><dt>Taxa</dt><dd>{Number(entry.win_rate).toFixed(1)}%</dd></div></dl>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
