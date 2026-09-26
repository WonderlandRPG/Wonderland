export const rankedTiers = [
  "Ferro",
  "Bronze",
  "Prata",
  "Ouro",
  "Platina",
  "Diamante",
  "Mestre",
  "Grão-Mestre",
  "Lenda",
] as const;

export type RankedTier = (typeof rankedTiers)[number];
export type RankedDivision = "IV" | "III" | "II" | "I" | null;

export type RankedStanding = {
  tier: RankedTier;
  division: RankedDivision;
  pdl: number;
  crest: string;
};

const tierCrests: Record<RankedTier, string> = {
  Ferro: "Fe",
  Bronze: "Br",
  Prata: "Pr",
  Ouro: "Au",
  Platina: "Pt",
  Diamante: "Di",
  Mestre: "Me",
  "Grão-Mestre": "GM",
  Lenda: "✦",
};

export function getRankedStanding(rawPdl: number): RankedStanding {
  const pdl = Math.max(0, Math.floor(rawPdl));
  if (pdl >= 2400) return { tier: "Lenda", division: null, pdl, crest: tierCrests.Lenda };
  if (pdl >= 2100)
    return { tier: "Grão-Mestre", division: null, pdl, crest: tierCrests["Grão-Mestre"] };
  if (pdl >= 1800) return { tier: "Mestre", division: null, pdl, crest: tierCrests.Mestre };

  const tierIndex = Math.min(5, Math.floor(pdl / 300));
  const tier = rankedTiers[tierIndex];
  const divisionIndex = Math.min(3, Math.floor((pdl % 300) / 75));
  const division = (["IV", "III", "II", "I"] as const)[divisionIndex];
  return { tier, division, pdl, crest: tierCrests[tier] };
}

export function areAdjacentRankedTiers(left: RankedTier, right: RankedTier) {
  return Math.abs(rankedTiers.indexOf(left) - rankedTiers.indexOf(right)) <= 1;
}

export function rankedPdlDelta({
  won,
  ownPdl,
  opponentPdl,
  placementGames,
}: {
  won: boolean;
  ownPdl: number;
  opponentPdl: number;
  placementGames: number;
}) {
  const expected = 1 / (1 + 10 ** ((opponentPdl - ownPdl) / 400));
  const factor = placementGames < 5 ? 64 : 32;
  return Math.round(factor * ((won ? 1 : 0) - expected));
}

export const rankedPlacementMatches = 5;
