import { describe, expect, it } from "vitest";

import {
  canEquipItemInSlot,
  compatibleEquipSlots,
  getBasicAttackRange,
} from "@/lib/game/equipment";

describe("regras de armas e espaços", () => {
  it("permite uma arma principal de uma mão nos dois espaços de arma", () => {
    expect(canEquipItemInSlot("main_weapon", false, "main_weapon")).toBe(true);
    expect(canEquipItemInSlot("main_weapon", false, "off_weapon")).toBe(true);
    expect(compatibleEquipSlots("main_weapon", false)).toEqual(["main_weapon", "off_weapon"]);
  });

  it("reserva os dois espaços para qualquer arma de duas mãos", () => {
    expect(compatibleEquipSlots("main_weapon", true)).toEqual(["main_weapon", "off_weapon"]);
    expect(compatibleEquipSlots("off_weapon", true)).toEqual(["main_weapon", "off_weapon"]);
  });

  it("calcula o alcance básico pela arma realmente equipada", () => {
    expect(
      getBasicAttackRange([
        { name: "Arco do Bosque", category: "Arco", equippedSlot: "main_weapon" },
      ]),
    ).toBe(5);
    expect(
      getBasicAttackRange([
        { name: "Espada curta", category: "Espada", equippedSlot: "off_weapon" },
      ]),
    ).toBe(1);
  });
});
