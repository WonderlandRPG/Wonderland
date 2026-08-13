import { describe, expect, it } from "vitest";
import { getClassBasicAttackRange } from "@/lib/game/class-range";
describe("alcance básico por classe", () => {
  it("usa três casas para classes à distância", () =>
    expect(getClassBasicAttackRange("Arqueiro")).toBe(3));
  it("usa uma casa para classes corpo a corpo", () =>
    expect(getClassBasicAttackRange("Guerreiro")).toBe(1));
});
