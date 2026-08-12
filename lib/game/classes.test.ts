import { describe, expect, it } from "vitest";

import { getUnlockedClassSkills, getUnlockedPathSkills } from "@/lib/game/classes";
import { officialClasses } from "@/lib/game/official-classes";
import { classPayloadSchema } from "@/lib/game/schemas";

describe("catálogo oficial de classes", () => {
  it("contém as 17 classes do novo roster estruturado", () => {
    expect(officialClasses).toHaveLength(17);
    expect(new Set(officialClasses.map((entry) => entry.slug)).size).toBe(17);
    expect(officialClasses.reduce((sum, entry) => sum + entry.payload.progression.length, 0)).toBe(
      85,
    );
    expect(officialClasses.every((entry) => entry.payload.engineContractVersion === 1)).toBe(true);
  });

  it("valida todos os registros com o esquema usado pelo servidor", () => {
    officialClasses.forEach((entry) =>
      expect(classPayloadSchema.safeParse(entry.payload).success).toBe(true),
    );
  });

  it("concede seis técnicas estruturadas por caminho do nível 50 ao 100", () => {
    const paths = officialClasses.flatMap((entry) => entry.payload.paths);
    expect(paths).toHaveLength(34);
    expect(paths.every((path) => path.skills.length === 6)).toBe(true);
    expect(paths.flatMap((path) => path.skills)).toHaveLength(204);
    expect(
      paths.every((path) => path.unlockLevel === 50 && path.quest.objectives.length >= 2),
    ).toBe(true);
    const barbarian = officialClasses.find((entry) => entry.slug === "barbaro")!;
    expect(getUnlockedPathSkills(barbarian.payload, "berserker", 49)).toHaveLength(0);
    expect(getUnlockedPathSkills(barbarian.payload, "berserker", 50)).toHaveLength(1);
    expect(getUnlockedPathSkills(barbarian.payload, "berserker", 100)).toHaveLength(6);
  });

  it("usa operações genéricas e regras separadas da descrição", () => {
    const barbarian = officialClasses.find((entry) => entry.slug === "barbaro");
    const strike = barbarian?.payload.progression.find((skill) => skill.key === "golpe-selvagem");
    expect(strike?.operations[0]?.operation).toBe("DAMAGE");
    expect(strike?.operations[0]?.scaling).toEqual([{ attribute: "FOR", multiplier: 1.25 }]);
    expect(strike?.systemRule).not.toBe(strike?.playerDescription);
  });

  it("desbloqueia habilidades somente até o nível atual", () => {
    const archer = officialClasses.find((entry) => entry.slug === "arqueiro");
    expect(archer).toBeDefined();
    expect(getUnlockedClassSkills(archer!.payload, 1)).toHaveLength(2);
    expect(getUnlockedClassSkills(archer!.payload, 20)).toHaveLength(3);
    expect(getUnlockedClassSkills(archer!.payload, 50)).toHaveLength(5);
  });
});
