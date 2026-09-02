export type CharacterCosmeticSlot = "card" | "aura" | "border";

export type CharacterCosmeticLoadout = {
  card: string | null;
  aura: string | null;
  border?: string | null;
};

export const emptyCharacterCosmetics: CharacterCosmeticLoadout = {
  card: null,
  aura: null,
  border: null,
};

export const halloween2026CosmeticKeys = {
  card: "noite-veu-partido",
  aura: "cortejo-fogos-fatuos",
  border: "trono-rei-oco",
} as const;

export const inauguration2026CosmeticKeys = {
  border: "moldura-fundadores-2026",
} as const;

export function parseCharacterCosmetics(value: unknown): CharacterCosmeticLoadout {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...emptyCharacterCosmetics };
  }

  const raw = value as Record<string, unknown>;
  return {
    card: typeof raw.card === "string" ? raw.card : null,
    aura: typeof raw.aura === "string" ? raw.aura : null,
    border: typeof raw.border === "string" ? raw.border : null,
  };
}
