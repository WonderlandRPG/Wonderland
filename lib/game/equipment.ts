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
  { key: "title", label: "Título" },
] as const;

export type EquipmentSlot = (typeof equipmentSlots)[number]["key"];

export type WeaponSlot = "main_weapon" | "off_weapon";

export function isWeaponSlot(slot: string): slot is WeaponSlot {
  return slot === "main_weapon" || slot === "off_weapon";
}

export function canEquipItemInSlot(itemSlot: string, twoHanded: boolean, targetSlot: string) {
  if (itemSlot === "ring") return targetSlot === "ring_1" || targetSlot === "ring_2";
  if (itemSlot === "earring") return targetSlot === "earring_1" || targetSlot === "earring_2";
  if (isWeaponSlot(itemSlot)) {
    if (twoHanded) return isWeaponSlot(targetSlot);
    if (itemSlot === "main_weapon") return isWeaponSlot(targetSlot);
    return targetSlot === "off_weapon";
  }
  return itemSlot === targetSlot;
}

export function compatibleEquipSlots(itemSlot: string, twoHanded: boolean): EquipmentSlot[] {
  return equipmentSlots
    .map((slot) => slot.key)
    .filter((slot) => canEquipItemInSlot(itemSlot, twoHanded, slot));
}

export function getBasicAttackRange(
  items: Array<{ name: string; category: string; equippedSlot: string | null }>,
) {
  return items
    .filter((item) => item.equippedSlot && isWeaponSlot(item.equippedSlot))
    .reduce((maximum, weapon) => {
      const text = `${weapon.name} ${weapon.category}`.toLocaleLowerCase("pt-BR");
      if (/arco|besta|rifle|pistola/.test(text)) return Math.max(maximum, 5);
      if (/cajado|grim[oó]rio|orbe|varinha/.test(text)) return Math.max(maximum, 4);
      if (/lan[çc]a|alabarda|corrente|chicote/.test(text)) return Math.max(maximum, 2);
      return Math.max(maximum, 1);
    }, 1);
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
