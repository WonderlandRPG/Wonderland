import { describe, expect, it } from "vitest";

import {
  buildCharacterAttributes,
  buildCharacterStats,
  createEmptyAllocation,
  defaultCharacterRules,
  getAllocatedTotal,
  getUnlockedRaceAbilities,
} from "@/lib/game/characters";
import { defaultCombatRules } from "@/lib/game/combat";
import { officialRaces } from "@/lib/game/official-races";

describe("personagens e fichas", () => {
  const aengel = officialRaces.find((entry) => entry.slug === "aengel")!;

  it("exige e soma os 100 pontos distribuíveis", () => {
    const allocation = { ...createEmptyAllocation(), FOR: 40, DEF: 20, RES: 20, INI: 20 };
    expect(getAllocatedTotal(allocation)).toBe(100);
  });

  it("combina 20 pontos base, distribuição e bônus da raça", () => {
    const allocation = { ...createEmptyAllocation(), FOR: 100 };
    const final = buildCharacterAttributes(allocation, aengel.payload);
    expect(final.FOR).toBe(20 + 100 + aengel.payload.attributeBonuses.FOR);
    expect(final.ARC).toBe(20 + aengel.payload.attributeBonuses.ARC);
  });

  it("recalcula os derivados quando o bônus racial muda", () => {
    const allocation = { ...createEmptyAllocation(), RES: 100 };
    const original = buildCharacterStats(
      allocation,
      aengel.payload,
      defaultCharacterRules,
      defaultCombatRules,
    );
    const balancedRace = {
      ...aengel.payload,
      attributeBonuses: {
        ...aengel.payload.attributeBonuses,
        RES: aengel.payload.attributeBonuses.RES + 10,
      },
    };
    const balanced = buildCharacterStats(
      allocation,
      balancedRace,
      defaultCharacterRules,
      defaultCombatRules,
    );
    expect(balanced.maxHp).toBe(original.maxHp + 50);
  });

  it("desbloqueia a progressão racial pelo nível da ficha", () => {
    expect(getUnlockedRaceAbilities(aengel.payload, 1).every((entry) => entry.level <= 1)).toBe(
      true,
    );
    expect(getUnlockedRaceAbilities(aengel.payload, 100)).toHaveLength(
      aengel.payload.abilitiesV2.filter((entry) => entry.type !== "Passiva").length,
    );
  });
});
