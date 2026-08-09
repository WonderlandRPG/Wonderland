import { describe, expect, it } from "vitest";

import { getUnlockedClassSkills } from "@/lib/game/classes";
import { officialClasses } from "@/lib/game/official-classes";
import { classPayloadSchema } from "@/lib/game/schemas";

describe("catálogo oficial de classes", () => {
  it("contém as 13 classes e toda a progressão do livro", () => {
    expect(officialClasses).toHaveLength(13);
    expect(new Set(officialClasses.map((entry) => entry.slug)).size).toBe(13);
    expect(officialClasses.reduce((sum, entry) => sum + entry.payload.progression.length, 0)).toBe(
      156,
    );
    expect(officialClasses.reduce((sum, entry) => sum + entry.payload.paths.length, 0)).toBe(26);
    expect(
      officialClasses.reduce(
        (sum, entry) =>
          sum + entry.payload.paths.reduce((pathSum, path) => pathSum + path.skills.length, 0),
        0,
      ),
    ).toBe(130);
  });

  it("valida todos os registros com o esquema usado pelo servidor", () => {
    officialClasses.forEach((entry) =>
      expect(classPayloadSchema.safeParse(entry.payload).success).toBe(true),
    );
  });

  it("usa multiplicadores para escalas e preserva percentuais modificadores", () => {
    const barbarian = officialClasses.find((entry) => entry.slug === "barbaro");
    const strike = barbarian?.payload.progression.find((skill) => skill.key === "golpe-selvagem");
    const ironSkin = barbarian?.payload.progression.find((skill) => skill.key === "pele-de-ferro");
    expect(strike?.effect).toContain("1x FOR");
    expect(strike?.effect).toContain("0,2x FOR");
    expect(ironSkin?.effect).toContain("26%");
    expect(ironSkin?.effect).toContain("0,84x RES");
  });

  it("desbloqueia habilidades somente até o nível atual", () => {
    const archer = officialClasses.find((entry) => entry.slug === "arqueiro");
    expect(archer).toBeDefined();
    expect(getUnlockedClassSkills(archer!.payload, 1)).toHaveLength(2);
    expect(getUnlockedClassSkills(archer!.payload, 20)).toHaveLength(6);
    expect(getUnlockedClassSkills(archer!.payload, 50)).toHaveLength(12);
  });
});
