import { describe, expect, it } from "vitest";

import { chooseTacticalAiDestination } from "@/lib/game/tactical-ai";
import { tacticalPositionKey } from "@/lib/game/tactical-grid";

const grid = { width: 8, height: 6 };

function decide(overrides: Partial<Parameters<typeof chooseTacticalAiDestination>[0]> = {}) {
  return chooseTacticalAiDestination({
    start: { x: 6, y: 2 },
    target: { x: 1, y: 2 },
    movement: 3,
    grid,
    blocked: new Set<string>(),
    sightBlocked: new Set<string>(),
    basicRange: 1,
    skillRange: 3,
    skillAvailable: true,
    ...overrides,
  });
}

describe("IA tática", () => {
  it("prioriza entrar no alcance da habilidade antes de apenas encurtar distância", () => {
    const decision = decide();
    expect(decision.canUseSkill).toBe(true);
    expect(decision.distance).toBeLessThanOrEqual(3);
  });

  it("prioriza ataque básico quando a habilidade está indisponível", () => {
    const decision = decide({
      start: { x: 4, y: 2 },
      movement: 3,
      skillAvailable: false,
    });
    expect(decision.canBasicAttack).toBe(true);
    expect(decision.distance).toBe(1);
  });

  it("não atravessa uma casa bloqueada para obter posição impossível", () => {
    const blocked = new Set(["5,2", "5,1", "5,3"]);
    const decision = decide({ blocked, sightBlocked: blocked });
    expect(blocked.has(tacticalPositionKey(decision.position))).toBe(false);
  });

  it("prefere linha de visão quando ainda não consegue atacar", () => {
    const sightBlocked = new Set(["4,2"]);
    const decision = decide({
      start: { x: 6, y: 2 },
      target: { x: 1, y: 2 },
      movement: 1,
      skillRange: 2,
      sightBlocked,
    });
    expect(decision.hasLineOfSight || decision.distance < 5).toBe(true);
  });
});
