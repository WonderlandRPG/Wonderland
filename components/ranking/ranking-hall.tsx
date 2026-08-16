"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayerRanking } from "@/components/ranking/player-ranking";
import { RankBadge } from "@/components/characters/rank-badge";
import type { PvpRankingEntry, RankingEntry } from "@/lib/game/player-portal";

export function RankingHall({ levelEntries, pvpEntries }: { levelEntries: RankingEntry[]; pvpEntries: PvpRankingEntry[] }) {
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

function PvpRanking({ entries }: { entries: PvpRankingEntry[] }) {
  if (!entries.length) return <section className="champions-empty"><span>⚔</span><h2>O salão aguarda seu primeiro campeão</h2><p>As placas de honra serão gravadas depois da primeira luta oficial.</p></section>;
  const leader = entries[0];
  return (
    <div className="duelist-hall">
      <section className="duelist-banner">
        <div className="duelist-banner__portrait"><span className="ranking-crown" aria-label="Primeiro colocado">♛</span><Avatar entry={leader} /></div>
        <div><small>CAMPEÃO DA ARENA</small><h2>{leader.name}</h2>{leader.title_name ? <em>✦ {leader.title_name}</em> : null}<strong>{Number(leader.win_rate).toFixed(1)}%</strong><p>{leader.victories} vitórias em {leader.matches} partidas</p></div>
        <aside><span>W</span><small>PLACA DE HONRA</small></aside>
      </section>
      <section className="duelist-roll">
        <header><div><small>REGISTRO OFICIAL</small><h2>Ordem dos duelistas</h2></div><span>{entries.length} nomes gravados</span></header>
        <div>
          {entries.map((entry) => (
            <Link className="duelist-roll__entry" href={`/jogadores/${entry.id}`} key={entry.id}>
              <b>{String(entry.position).padStart(2, "0")}</b>
              <span className="duelist-roll__identity"><Avatar entry={entry} /><span><strong>{entry.name}</strong>{entry.title_name ? <em>✦ {entry.title_name}</em> : null}<small>{entry.race_name} · {entry.class_name}</small></span></span>
              <RankBadge compact rank={entry.adventure_rank} />
              <dl><div><dt>Lutas</dt><dd>{entry.matches}</dd></div><div><dt>Vitórias</dt><dd>{entry.victories}</dd></div><div><dt>Derrotas</dt><dd>{entry.defeats}</dd></div><div><dt>Taxa</dt><dd>{Number(entry.win_rate).toFixed(1)}%</dd></div></dl>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Avatar({ entry }: { entry: { name: string; image_url: string | null } }) {
  return <span className={`ranking-avatar ${entry.image_url ? "is-image" : ""}`} style={entry.image_url ? { backgroundImage: `url(${entry.image_url})` } : undefined}>{entry.image_url ? "" : entry.name.slice(0, 2).toUpperCase()}</span>;
}
