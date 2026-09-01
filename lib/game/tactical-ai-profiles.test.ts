import { describe, expect, it } from "vitest";

import { chooseTacticalProfileDestination } from "@/lib/game/tactical-ai-profiles";

const grid = { width: 8, height: 6 };
const empty = new Set<string>();

function decide(profile: "aggressive" | "ranged" | "controller", skillAvailable = true) {
  return chooseTacticalProfileDestination({
    profile,
    start: { x: 0, y: 2 },
    target: { x: 5, y: 2 },
    movement: 3,
    grid,
    blocked: empty,
    sightBlocked: empty,
    basicRange: 1,
    skillRange: profile === "ranged" ? 4 : 3,
    skillAvailable,
  });
}

describe("perfis de IA tática", () => {
  it("agressiva se aproxima para atacar", () => {
    const result = decide("aggressive", false);
    expect(result.distance).toBeLessThan(5);
    expect(result.position).not.toEqual({ x: 5, y: 2 });
  });

  it("ranged evita colar no alvo quando já tem alcance", () => {
    const result = decide("ranged", true);
    expect(result.canUseSkill).toBe(true);
    expect(result.distance).toBeGreaterThanOrEqual(2);
  });

  it("controladora prioriza uma casa em alcance da habilidade", () => {
    const result = decide("controller", true);
    expect(result.canUseSkill).toBe(true);
    expect(result.reason).toBe("posição de controle");
  });

  it("nunca ocupa a casa do alvo", () => {
    for (const profile of ["aggressive", "ranged", "controller"] as const) {
      const result = decide(profile, false);
      expect(result.position).not.toEqual({ x: 5, y: 2 });
    }
  });
});
