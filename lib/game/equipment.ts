export const equipmentSlots = [
  { key: "head", label: "Cabeça" },
  { key: "torso", label: "Peitoral" },
  { key: "hands", label: "Mãos" },
  { key: "legs", label: "Pernas" },
  { key: "feet", label: "Pés" },
  { key: "main_weapon", label: "Arma principal" },
  { key: "off_weapon", label: "Arma secundária" },
  { key: "necklace", label: "Colar" },
  { key: "ring_1", label: "Anel I" },
  { key: "ring_2", label: "Anel II" },
  { key: "earring_1", label: "Brinco I" },
  { key: "earring_2", label: "Brinco II" },
  { key: "cape", label: "Capa" },
] as const;

export type EquipmentSlot = (typeof equipmentSlots)[number]["key"];

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
