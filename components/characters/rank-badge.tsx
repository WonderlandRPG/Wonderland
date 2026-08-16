import { getAdventureRank } from "@/lib/game/ranks";

export function RankBadge({ rank }: { rank: string; compact?: boolean }) {
  const definition = getAdventureRank(rank);
  return <span>Rank {definition.key}</span>;
}
