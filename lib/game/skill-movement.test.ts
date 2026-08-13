import { describe, expect, it } from "vitest";
import { resolveSkillMovement } from "@/lib/game/skill-movement";
const skill = (operations: unknown[]) => ({ operations, range: 6 }) as never;
describe("movimento de habilidades", () => {
  it("avança exatamente a distância declarada sem atravessar o alvo", () => {
    expect(
      resolveSkillMovement(
        skill([{ operation: "MOVE", distance: 3 }]),
        { x: 1, y: 1 },
        { x: 8, y: 1 },
      ).actor,
    ).toEqual({ x: 4, y: 1 });
  });
  it("executa todas as operações em sequência", () => {
    expect(
      resolveSkillMovement(
        skill([
          { operation: "MOVE", distance: 2 },
          { operation: "PUSH", distance: 2 },
        ]),
        { x: 1, y: 1 },
        { x: 6, y: 1 },
      ),
    ).toEqual({ actor: { x: 3, y: 1 }, target: { x: 8, y: 1 } });
  });
  it("não inventa deslocamento usando apenas o alcance", () => {
    expect(
      resolveSkillMovement(
        skill([{ operation: "MOVE", distance: 0 }]),
        { x: 1, y: 1 },
        { x: 8, y: 1 },
      ).actor,
    ).toEqual({ x: 1, y: 1 });
  });
});
