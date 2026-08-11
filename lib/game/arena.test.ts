import { describe, expect, it } from "vitest";
import {
  arenaMonsters,
  arenaRewards,
  buildAdaptiveMonsterAttributes,
  getMovementRange,
  tacticalGrid,
} from "@/lib/game/arena";

describe("Arena expandida", () => {
  it("possui dez monstros distintos", () => {
    expect(arenaMonsters).toHaveLength(10);
    expect(new Set(arenaMonsters.map((m) => m.key)).size).toBe(10);
  });
  it("preserva exatamente o total de atributos do jogador", () => {
    const player = { FOR: 80, DEF: 60, RES: 50, INI: 40, INT: 30, ARC: 20 };
    const monster = buildAdaptiveMonsterAttributes(player, arenaMonsters[0].weights);
    expect(Object.values(monster).reduce((a, b) => a + b, 0)).toBe(
      Object.values(player).reduce((a, b) => a + b, 0),
    );
  });
  it("mantém a tabela oficial de recompensas", () => {
    expect(arenaRewards.E).toEqual({ xp: 500, wg: 100 });
    expect(arenaRewards.EX).toEqual({ xp: 30000, wg: 25000 });
  });
  it("usa o mapa 20×14 e limita o movimento entre uma e oito casas", () => {
    expect(tacticalGrid).toEqual({ width: 20, height: 14 });
    expect(getMovementRange(0)).toBe(1);
    expect(getMovementRange(49)).toBe(1);
    expect(getMovementRange(50)).toBe(2);
    expect(getMovementRange(200)).toBe(8);
    expect(getMovementRange(999)).toBe(8);
  });
});
