import type { CSSProperties } from "react";
import { getAdventureRank } from "@/lib/game/ranks";

export function RankBadge({ rank, compact = false }: { rank: string; compact?: boolean }) {
  const definition = getAdventureRank(rank);
  const style = { "--rank-color": definition.color } as CSSProperties;

  return (
    <span
      className={`rank-emblem ${compact ? "is-compact" : ""} ${definition.key === "EX" ? "is-ex" : ""}`}
      data-rank={definition.key}
      style={style}
      title={`Rank ${definition.key} · ${definition.title}`}
    >
      <svg aria-hidden="true" viewBox="0 0 96 112">
        <path className="rank-emblem__halo" d="M48 3 84 19 91 60 72 94 48 109 24 94 5 60 12 19Z" />
        <path className="rank-emblem__frame" d="M48 10 77 23 83 58 67 87 48 100 29 87 13 58 19 23Z" />
        <path className="rank-emblem__core" d="M48 18 70 28 75 56 62 79 48 89 34 79 21 56 26 28Z" />
        <path className="rank-emblem__mark" d="M48 8v10M15 58H5M91 58H81M26 91l7-9M70 91l-7-9" />
        <text
          className="rank-emblem__letter"
          dominantBaseline="central"
          textAnchor="middle"
          x="48"
          y="55"
        >
          {definition.key}
        </text>
      </svg>
      <span className="sr-only">Rank {definition.key}</span>
    </span>
  );
}