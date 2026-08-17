import type { CSSProperties } from "react";
import { getAdventureRank } from "@/lib/game/ranks";

interface RankAtmosphereProps {
  rank?: string;
  variant?: "portrait" | "surface" | "preview";
  className?: string;
}

export function RankAtmosphere({
  rank = "E",
  variant = "portrait",
  className = "",
}: RankAtmosphereProps) {
  const definition = getAdventureRank(rank);
  return (
    <span
      aria-hidden="true"
      className={`rank-atmosphere is-${variant} ${className}`.trim()}
      data-rank={definition.key}
      style={{ "--rank-color": definition.color } as CSSProperties}
    >
      <i className="rank-atmosphere__a" />
      <i className="rank-atmosphere__b" />
      <i className="rank-atmosphere__c" />
    </span>
  );
}