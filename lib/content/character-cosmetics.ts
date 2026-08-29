import type { Json } from "@/lib/db/types";

export const characterCosmeticSlots = ["card", "frame", "background", "aura", "theme"] as const;
export type CharacterCosmeticSlot = (typeof characterCosmeticSlots)[number];

export type CharacterCosmeticLoadout = Record<CharacterCosmeticSlot, string | null>;

export type CharacterCosmeticDefinition = {
  key: string;
  slot: CharacterCosmeticSlot;
  name: string;
  collection: string;
  collectionLabel: string;
  description: string;
  rarity: "event";
  year: number;
  icon: string;
};

export const festivalDasAlmas2026 = [
  { key: "noite-das-almas", slot: "card", name: "Noite das Almas", collection: "festival-das-almas-2026", collectionLabel: "Festival das Almas 2026", description: "Card sombrio com luar alaranjado, névoa violeta e acabamento de noite assombrada.", rarity: "event", year: 2026, icon: "☾" },
  { key: "espinhos-do-alem", slot: "frame", name: "Espinhos do Além", collection: "festival-das-almas-2026", collectionLabel: "Festival das Almas 2026", description: "Moldura negra tomada por espinhos, metal envelhecido e pequenos brilhos espectrais.", rarity: "event", year: 2026, icon: "✥" },
  { key: "cemiterio-lua-sangrenta", slot: "background", name: "Cemitério da Lua Sangrenta", collection: "festival-das-almas-2026", collectionLabel: "Festival das Almas 2026", description: "Fundo de ficha com cemitério em névoa, silhuetas góticas e uma lua rubra no horizonte.", rarity: "event", year: 2026, icon: "◉" },
  { key: "almas-errantes", slot: "aura", name: "Almas Errantes", collection: "festival-das-almas-2026", collectionLabel: "Festival das Almas 2026", description: "Aura animada de névoa, fagulhas e pequenos espíritos orbitando o retrato.", rarity: "event", year: 2026, icon: "✦" },
  { key: "noite-de-halloween", slot: "theme", name: "Noite de Halloween", collection: "festival-das-almas-2026", collectionLabel: "Festival das Almas 2026", description: "Tema completo da ficha em obsidiana, violeta, cobre queimado e verde espectral.", rarity: "event", year: 2026, icon: "♜" },
] as const satisfies readonly CharacterCosmeticDefinition[];

export const characterCosmeticCatalog: readonly CharacterCosmeticDefinition[] = festivalDasAlmas2026;
const catalogByKey = new Map(characterCosmeticCatalog.map((item) => [item.key, item]));

export const emptyCharacterCosmetics: CharacterCosmeticLoadout = { card: null, frame: null, background: null, aura: null, theme: null };

export function getCharacterCosmetic(key: string | null | undefined) {
  return key ? catalogByKey.get(key) ?? null : null;
}

export function isValidCharacterCosmetic(slot: CharacterCosmeticSlot, key: string) {
  return catalogByKey.get(key)?.slot === slot;
}

export function parseCharacterCosmetics(value: Json | null | undefined): CharacterCosmeticLoadout {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...emptyCharacterCosmetics };
  const source = value as Record<string, Json | undefined>;
  return Object.fromEntries(characterCosmeticSlots.map((slot) => {
    const candidate = typeof source[slot] === "string" ? source[slot] as string : null;
    return [slot, candidate && isValidCharacterCosmetic(slot, candidate) ? candidate : null];
  })) as CharacterCosmeticLoadout;
}

export const cosmeticSlotLabels: Record<CharacterCosmeticSlot, string> = {
  card: "Card de Personagem",
  frame: "Moldura da Ficha",
  background: "Fundo da Ficha",
  aura: "Aura",
  theme: "Tema da Ficha",
};
