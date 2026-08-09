import { describe, expect, it } from "vitest";

import { buildCharacterAttributes, createEmptyAllocation } from "@/lib/game/characters";
import { createEmptyItemPayload, sumItemBonuses } from "@/lib/game/items";
import { officialRaces } from "@/lib/game/official-races";

describe("itens e equipamentos", () => {
  it("soma bônus de todos os equipamentos ativos", () => {
    const sword = {
      payload: { ...createEmptyItemPayload(), attributeBonuses: { FOR: 12, INI: 2 } },
    };
    const armor = {
      payload: { ...createEmptyItemPayload(), attributeBonuses: { DEF: 10, RES: 8 } },
    };
    expect(sumItemBonuses([sword, armor])).toEqual({
      FOR: 12,
      DEF: 10,
      RES: 8,
      INI: 2,
      INT: 0,
      ARC: 0,
    });
  });

  it("aplica equipamentos depois da base, distribuição e raça", () => {
    const human = officialRaces.find((entry) => entry.slug === "humano")!;
    const allocation = { ...createEmptyAllocation(), FOR: 100 };
    const withoutItem = buildCharacterAttributes(allocation, human.payload);
    const withItem = buildCharacterAttributes(allocation, human.payload, undefined, { FOR: 25 });
    expect(withItem.FOR).toBe(withoutItem.FOR + 25);
  });
});
