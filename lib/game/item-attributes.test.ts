import { describe, expect, it } from "vitest";
import { itemPower, itemPowerDelta, normalizeItemAttributes } from "@/lib/game/item-attributes";

describe("atributos oficiais de itens", () => {
  it("converte ARC legado para HP sem perder valor", () => {
    expect(normalizeItemAttributes({ FOR: 4, ARC: 7 })).toEqual({ FOR: 4, HP: 7 });
  });

  it("soma ARC e HP quando ambos existem durante a transição", () => {
    expect(normalizeItemAttributes({ HP: 10, ARC: 2 })).toEqual({ HP: 12 });
  });

  it("descarta atributos que não pertencem ao Rework", () => {
    expect(normalizeItemAttributes({ FOR: 3, SORTE: 99 })).toEqual({ FOR: 3 });
  });

  it("calcula poder e projeção de troca", () => {
    expect(itemPower({ FOR: 3, HP: 8 })).toBe(11);
    expect(itemPowerDelta({ FOR: 5, HP: 8 }, [{ FOR: 3, HP: 2 }])).toBe(8);
  });
});
