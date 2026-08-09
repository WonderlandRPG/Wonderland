export const equipmentSlots = [
  { key: "head", label: "Cabeça", emoji: "🪖" },
  { key: "torso", label: "Peitoral", emoji: "🦺" },
  { key: "hands", label: "Mãos", emoji: "🧤" },
  { key: "legs", label: "Pernas", emoji: "👖" },
  { key: "feet", label: "Pés", emoji: "👢" },
  { key: "main_weapon", label: "Arma principal", emoji: "⚔️" },
  { key: "off_weapon", label: "Arma secundária", emoji: "🛡️" },
  { key: "necklace", label: "Colar", emoji: "📿" },
  { key: "ring_1", label: "Anel I", emoji: "💍" },
  { key: "ring_2", label: "Anel II", emoji: "💍" },
  { key: "earring_1", label: "Brinco I", emoji: "💎" },
  { key: "earring_2", label: "Brinco II", emoji: "💎" },
  { key: "cape", label: "Capa", emoji: "🧣" },
] as const;

export type EquipmentSlot = (typeof equipmentSlots)[number]["key"];

export function itemSlotEmoji(slot: string) {
  if (slot === "ring") return "💍";
  if (slot === "earring") return "💎";
  return equipmentSlots.find((entry) => entry.key === slot)?.emoji ?? "🎒";
}

export function itemSlotLabel(slot: string) {
  if (slot === "ring") return "Anel";
  if (slot === "earring") return "Brinco";
  return equipmentSlots.find((entry) => entry.key === slot)?.label ?? slot;
}

export function defaultEquipSlot(slot: string): EquipmentSlot | null {
  if (slot === "ring") return "ring_1";
  if (slot === "earring") return "earring_1";
  return equipmentSlots.some((entry) => entry.key === slot) ? (slot as EquipmentSlot) : null;
}
