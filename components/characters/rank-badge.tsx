import { getAdventureRank } from "@/lib/game/ranks";

export function RankBadge({ rank, compact = false }: { rank: string; compact?: boolean }) {
  const definition = getAdventureRank(rank);
  return (
    <span
      className={`rank-badge ${compact ? "is-compact" : ""} ${definition.key === "EX" ? "is-ex" : ""}`}
      data-rank-tier={definition.key}
      style={{ "--rank-color": definition.color } as React.CSSProperties}
      title={`Rank ${definition.key} · ${definition.colorName}`}
    >
      <small>Rank</small>
      <b>{definition.key}</b>
    </span>
  );
}
