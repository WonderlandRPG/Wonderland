"use client";

import Link from "next/link";
import { useState } from "react";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { PlayerRanking } from "@/components/ranking/player-ranking";
import { RankBadge } from "@/components/characters/rank-badge";
import type { PvpRankingEntry, RankingEntry } from "@/lib/game/player-portal";
import type { EquippedTitleData } from "@/components/characters/equipped-title";
import styles from "./ranking.module.css";

type PvpDisplayEntry = PvpRankingEntry & { level: number };

function titleData(
  entry: Pick<PvpRankingEntry, "title_name" | "title_style" | "title_rarity">,
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

export function RankingHall({
  currentCharacterId,
  levelEntries,
  pvpEntries,
}: {
  currentCharacterId: string;
  levelEntries: RankingEntry[];
  pvpEntries: PvpDisplayEntry[];
}) {
  const [mode, setMode] = useState<"level" | "pvp">("level");
  return (
    <section className={styles.hall}>
      <header className={styles.modeSwitcher} data-wl-surface="dark">
        <div>
          <span className={styles.eyebrow}>Livro de honra</span>
          <h2>Escolha a classificação</h2>
        </div>
        <nav aria-label="Tipo de ranking">
          <button
            aria-pressed={mode === "level"}
            className={mode === "level" ? styles.activeMode : ""}
            onClick={() => setMode("level")}
            type="button"
          >
            <span aria-hidden="true">Ⅰ</span>
            <div>
              <small>Progressão</small>
              <strong>Nível & Experiência</strong>
            </div>
          </button>
          <button
            aria-pressed={mode === "pvp"}
            className={mode === "pvp" ? styles.activeMode : ""}
            onClick={() => setMode("pvp")}
            type="button"
          >
            <span aria-hidden="true">Ⅱ</span>
            <div>
              <small>Arena dos Reinos</small>
              <strong>Vitórias & Derrotas</strong>
            </div>
          </button>
        </nav>
      </header>
      {mode === "level" ? (
        <PlayerRanking currentCharacterId={currentCharacterId} entries={levelEntries} />
      ) : (
        <PvpRanking currentCharacterId={currentCharacterId} entries={pvpEntries} />
      )}
    </section>
  );
}

function PvpRanking({
  currentCharacterId,
  entries,
}: {
  currentCharacterId: string;
  entries: PvpDisplayEntry[];
}) {
  if (!entries.length)
    return (
      <section className={styles.empty} data-wl-surface="raised">
        <span aria-hidden="true">⚔</span>
        <h2>O salão aguarda seu primeiro campeão</h2>
        <p>As placas de honra serão gravadas depois da primeira luta oficial.</p>
      </section>
    );
  const leader = entries[0];
  return (
    <div className={styles.pvpHall}>
      <section className={styles.pvpChampion} data-wl-surface="dark">
        <div className={styles.pvpPortrait}>
          <span className={styles.crown} aria-hidden="true">
            ♛
          </span>
          <CharacterPortraitCard
            imageUrl={leader.image_url}
            level={leader.level}
            name={leader.name}
            rank={leader.adventure_rank}
            title={titleData(leader)}
            cosmetics={leader.cosmetics}
            variant="ranking"
          />
        </div>
        <div className={styles.championCopy}>
          <span className={styles.eyebrow}>Campeão da Arena</span>
          <h2>{leader.name}</h2>
          <p>
            {leader.race_name} · {leader.class_name}
          </p>
          <strong>{Number(leader.win_rate).toFixed(1)}%</strong>
          <small>
            {leader.victories} vitórias em {leader.matches} partidas
          </small>
        </div>
        <div className={styles.championMark}>
          <span>W</span>
          <small>Placa de honra</small>
        </div>
      </section>
      <section className={styles.board} data-wl-surface="raised">
        <header className={styles.boardHeader}>
          <div>
            <span className={styles.eyebrow}>Registro oficial</span>
            <h2>Ordem dos duelistas</h2>
            <p>{entries.length} nomes gravados</p>
          </div>
        </header>
        <div className={`${styles.listHeader} ${styles.pvpColumns}`} aria-hidden="true">
          <span>Posição</span>
          <span>Duelista</span>
          <span>Rank</span>
          <span>Combates</span>
        </div>
        <div className={styles.rankingList}>
          {entries.map((entry) => (
            <Link
              className={`${styles.rankingEntry} ${styles.pvpEntry} ${entry.id === currentCharacterId ? styles.current : ""}`}
              href={`/jogadores/${entry.id}`}
              key={entry.id}
            >
              <strong className={styles.position}>#{entry.position}</strong>
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
                </span>
              </span>
              <span className={styles.rankCell}>
                <RankBadge compact rank={entry.adventure_rank} />
                <small>Rank {entry.adventure_rank}</small>
              </span>
              <dl className={styles.combatStats}>
                <div>
                  <dt>Lutas</dt>
                  <dd>{entry.matches}</dd>
                </div>
                <div>
                  <dt>Vitórias</dt>
                  <dd>{entry.victories}</dd>
                </div>
                <div>
                  <dt>Derrotas</dt>
                  <dd>{entry.defeats}</dd>
                </div>
                <div>
                  <dt>Taxa</dt>
                  <dd>{Number(entry.win_rate).toFixed(1)}%</dd>
                </div>
              </dl>
              {entry.id === currentCharacterId ? <em className={styles.youBadge}>Você</em> : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
