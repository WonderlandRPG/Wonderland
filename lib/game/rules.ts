import { attributeKeys, attributesSchema, type AttributeKey } from "@/lib/game/schemas";

export type NumericInput = number | string | null | undefined;

export function toFiniteNumber(value: NumericInput, fallback = 0): number {
  if (typeof value === "string" && value.trim() === "") {
    return fallback;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value: NumericInput, minimum: number, maximum: number) {
  const safeValue = toFiniteNumber(value, minimum);
  return Math.min(Math.max(safeValue, minimum), maximum);
}

export interface ManaCalculationInput {
  baseMana: NumericInput;
  intelligence: NumericInput;
  intelligenceMultiplier: NumericInput;
  flatBonus?: NumericInput;
  percentageBonus?: NumericInput;
}

export function calculateMana(input: ManaCalculationInput): number {
  const base = Math.max(0, toFiniteNumber(input.baseMana));
  const intelligence = Math.max(0, toFiniteNumber(input.intelligence));
  const multiplier = toFiniteNumber(input.intelligenceMultiplier);
  const flatBonus = toFiniteNumber(input.flatBonus);
  const percentageBonus = toFiniteNumber(input.percentageBonus);
  const subtotal = Math.max(0, base + intelligence * multiplier + flatBonus);

  return Math.max(0, Math.round(subtotal * (1 + percentageBonus)));
}

export interface LevelThreshold {
  level: NumericInput;
  requiredXp: NumericInput;
}

export interface LevelCalculationInput {
  currentXp: NumericInput;
  currentLevel?: NumericInput;
  maxLevel: NumericInput;
  thresholds?: LevelThreshold[] | null;
}

export function calculateLevelFromXp(input: LevelCalculationInput): number {
  const maxLevel = Math.max(1, Math.floor(toFiniteNumber(input.maxLevel, 1)));
  const preservedLevel = Math.floor(clamp(input.currentLevel ?? 1, 1, maxLevel));
  const currentXp = Math.max(0, toFiniteNumber(input.currentXp));
  const thresholds = (input.thresholds ?? [])
    .map((entry) => ({
      level: Math.floor(toFiniteNumber(entry.level)),
      requiredXp: Math.max(0, toFiniteNumber(entry.requiredXp, Number.NaN)),
    }))
    .filter(
      (entry) => Number.isFinite(entry.requiredXp) && entry.level >= 1 && entry.level <= maxLevel,
    )
    .sort((left, right) => left.level - right.level);

  if (thresholds.length === 0) {
    return preservedLevel;
  }

  const calculatedLevel = thresholds.reduce(
    (level, entry) => (currentXp >= entry.requiredXp ? entry.level : level),
    1,
  );

  return Math.floor(clamp(calculatedLevel, 1, maxLevel));
}

export type AttributeInput = Partial<Record<AttributeKey, NumericInput>>;

export function normalizeAttributes(...sources: AttributeInput[]) {
  const normalized = Object.fromEntries(
    attributeKeys.map((key) => [
      key,
      sources.reduce((total, source) => total + toFiniteNumber(source[key]), 0),
    ]),
  );

  return attributesSchema.parse(normalized);
}
