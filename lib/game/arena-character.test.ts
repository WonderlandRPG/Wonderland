import { describe, expect, it } from "vitest";
import { getClassBasicAttackDamageType } from "@/lib/game/class-combat-profile";
import { getClassBasicAttackRange } from "@/lib/game/class-range";
import { officialClasses } from "@/lib/game/official-classes";

describe("alcance básico por classe", () => {
  it("usa três casas para classes à distância", () =>
    expect(getClassBasicAttackRange("Arqueiro")).toBe(3));
  it("usa uma casa para classes corpo a corpo", () =>
    expect(getClassBasicAttackRange("Guerreiro")).toBe(1));

  it("mantém ataque físico em classes marciais mesmo sem FOR primária", () => {
    const knight = officialClasses.find((entry) => entry.slug === "cavaleiro")!;
    expect(getClassBasicAttackDamageType(knight.name, knight.payload)).toBe("physical");
  });

  it("mantém ataque mágico em classes conjuradoras", () => {
    const mage = officialClasses.find((entry) => entry.slug === "mago")!;
    expect(getClassBasicAttackDamageType(mage.name, mage.payload)).toBe("magic");
  });
});
