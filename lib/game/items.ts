import { z } from "zod";

import { itemPayloadSchema, type AttributeKey } from "@/lib/game/schemas";

export type ItemPayload = z.infer<typeof itemPayloadSchema>;
export type EquipmentSlot = NonNullable<ItemPayload["equipmentSlot"]>;

export const equipmentSlotLabels: Record<EquipmentSlot, string> = {
  weapon: "Arma",
  head: "Cabeça",
  torso: "Torso",
  hands: "Mãos",
  feet: "Pés",
  accessory: "Acessório",
};

export function createEmptyItemPayload(): ItemPayload {
  return {
    description: "",
    imageUrl: "",
    category: "Equipamento",
    rarity: "Comum",
    priceWg: 0,
    levelRequirement: 1,
    equipmentSlot: "weapon",
    stackable: false,
    maxStack: 1,
    attributeBonuses: {},
    effects: [],
  };
}

export function parseItemPayload(payload: unknown) {
  return itemPayloadSchema.safeParse(payload);
}

export function createItemSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function sumItemBonuses(items: Array<{ payload: ItemPayload }>) {
  const keys: AttributeKey[] = ["FOR", "DEF", "RES", "INI", "INT", "ARC"];
  return Object.fromEntries(
    keys.map((key) => [
      key,
      items.reduce((sum, item) => sum + (item.payload.attributeBonuses[key] ?? 0), 0),
    ]),
  ) as Record<AttributeKey, number>;
}
