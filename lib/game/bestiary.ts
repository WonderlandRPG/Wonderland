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
  imageUrl: string;
}

export type CreatureWeaknessKind = "physical" | "magic";

export interface PveCreature extends BestiaryCreature {
  weaknessKind: CreatureWeaknessKind;
  weaknessMultiplier: number;
  weights: readonly [number, number, number, number, number, number];
}

export function parseTextList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

const physicalWeaknessTerms = [
  "articula", "asa", "cauda", "coração", "escama", "flanco", "guelra", "olho",
  "ponto cego", "ventre", "vibra", "filact", "núcleo", "rede", "arma", "artefato",
];

export function getCreatureImageUrl(slug: string) {
  return `/images/bestiary/${slug}.webp`;
}

export function getCreatureWeaknessKind(weaknesses: string[]): CreatureWeaknessKind {
  const joined = weaknesses.join(" ").toLocaleLowerCase("pt-BR");
  return physicalWeaknessTerms.some((term) => joined.includes(term)) ? "physical" : "magic";
}

export function getCreatureCombatWeights(category: string): PveCreature["weights"] {
  const value = category.toLocaleLowerCase("pt-BR");
  if (/morto|espírito|celestial|divindade/.test(value)) return [2, 3, 5, 3, 6, 5];
  if (/construto|golem|gigante/.test(value)) return [6, 6, 6, 1, 1, 2];
  if (/aberra|cósm|liminar|temporal/.test(value)) return [3, 4, 5, 4, 5, 6];
  if (/dragão|monstruosidade|demon/.test(value)) return [6, 4, 4, 4, 3, 3];
  if (/fera|inseto|artrópode|aquático/.test(value)) return [5, 3, 4, 6, 1, 2];
  return [3, 3, 4, 4, 4, 4];
}

export function toPveCreature(creature: BestiaryCreature): PveCreature {
  return {
    ...creature,
    weaknessKind: getCreatureWeaknessKind(creature.weaknesses),
    weaknessMultiplier: 1.25,
    weights: getCreatureCombatWeights(creature.category),
  };
}

export function getCreatureWeaknessBonus(
  damage: number,
  damageType: string | undefined,
  creature: Pick<PveCreature, "weaknessKind" | "weaknessMultiplier">,
) {
  if (damage <= 0 || damageType !== creature.weaknessKind) return 0;
  return Math.max(1, Math.round(damage * (creature.weaknessMultiplier - 1)));
}
