"use client";

import { useState } from "react";
import Link from "next/link";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { PlayerRanking } from "@/components/ranking/player-ranking";
import { RankBadge } from "@/components/characters/rank-badge";
import type { PvpRankingEntry, RankingEntry } from "@/lib/game/player-portal";
import { EquippedTitle, type EquippedTitleData } from "@/components/characters/equipped-title";

type PvpDisplayEntry = PvpRankingEntry & { level: number };

function titleData(entry: Pick<PvpRankingEntry, "title_name" | "title_style" | "title_rarity">): EquippedTitleData | null {
  if (!entry.title_name) return null;
  const style = entry.title_style;
  const titleStyle = style && typeof style === "object" && !Array.isArray(style)
    ? { primary: String(style.primary ?? "#fff1b5"), secondary: String(style.secondary ?? "#1f7a4c"), glow: String(style.glow ?? "#d7ad45") }
    : null;
  return { name: entry.title_name, rarity: entry.title_rarity ?? "title", titleStyle };
}

export function RankingHall({ levelEntries, pvpEntries }: { levelEntries: RankingEntry[]; pvpEntries: PvpDisplayEntry[] }) {
  const [mode, setMode] = useState<"level" | "pvp">("level");
  return (
    <section className="champions-hall">
      <header className="champions-hall__switcher">
        <div><small>LIVRO DE HONRA</small><h2>Escolha o registro</h2></div>
        <nav aria-label="Tipo de ranking">
          <button className={mode === "level" ? "is-active" : ""} onClick={() => setMode("level")} type="button"><span>Ⅰ</span><div><small>PROGRESSÃO DOS AVENTUREIROS</small><strong>Nível & Experiência</strong></div></button>
          <button className={mode === "pvp" ? "is-active" : ""} onClick={() => setMode("pvp")} type="button"><span>Ⅱ</span><div><small>ARENA DOS REINOS</small><strong>Vitórias & Derrotas</strong></div></button>
        </nav>
      </header>
      {mode === "level" ? <PlayerRanking entries={levelEntries} /> : <PvpRanking entries={pvpEntries} />}
    </section>
  );
}

function PvpRanking({ entries }: { entries: PvpDisplayEntry[] }) {
  if (!entries.length) return <section className="champions-empty"><span>⚔</span><h2>O salão aguarda seu primeiro campeão</h2><p>As placas de honra serão gravadas depois da primeira luta oficial.</p></section>;
  const leader = entries[0];
  return (
    <div className="duelist-hall">
      <section className="duelist-banner">
        <div className="duelist-banner__portrait official-pvp-card-host">
          <span className="ranking-crown" aria-label="Primeiro colocado">♛</span>
          <CharacterPortraitCard
            imageUrl={leader.image_url}
            level={leader.level}
            name={leader.name}
            rank={leader.adventure_rank}
            title={titleData(leader)}
            variant="standard"
          />
        </div>
        <div><small>CAMPEÃO DA ARENA</small><h2>{leader.name}</h2><EquippedTitle title={titleData(leader)} /><strong>{Number(leader.win_rate).toFixed(1)}%</strong><p>{leader.victories} vitórias em {leader.matches} partidas</p></div>
        <aside><span>W</span><small>PLACA DE HONRA</small></aside>
      </section>
      <section className="duelist-roll">
        <header><div><small>REGISTRO OFICIAL</small><h2>Ordem dos duelistas</h2></div><span>{entries.length} nomes gravados</span></header>
        <div>
          {entries.map((entry) => (
            <Link className="duelist-roll__entry" href={`/jogadores/${entry.id}`} key={entry.id}>
              <b>{String(entry.position).padStart(2, "0")}</b>
              <span className="duelist-roll__identity">
                <CharacterPortraitCard imageUrl={entry.image_url} level={entry.level} name={entry.name} rank={entry.adventure_rank} title={titleData(entry)} variant="compact" />
                <span><strong>{entry.name}</strong><EquippedTitle title={titleData(entry)} /><small>{entry.race_name} · {entry.class_name}</small></span>
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
