export const creatureRanks = ["E", "D", "C", "B", "A", "S", "EX"] as const;
export type CreatureRank = (typeof creatureRanks)[number];

export interface BestiaryCreature {
  id: string;
  slug: string;
  name: string;
  category: string;
  rank: CreatureRank;
  size: string;
  disposition: string;
  behavior: string;
  weaknesses: string[];
  habitats: string[];
  description: string;
}

export function parseTextList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}
