export type CharacterCosmeticSlot = "card" | "aura" | "border";

export type CharacterCosmeticLoadout = {
  card: string | null;
  aura: string | null;
  border: string | null;
};

export const emptyCharacterCosmetics: CharacterCosmeticLoadout = {
  card: null,
  aura: null,
  border: null,
};

export const bloodyMoonCosmeticKeys = {
  card: "epitafio-lua-carmesim",
  aura: "procissao-almas-rubras",
  border: "portico-lua-sangrenta",
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
