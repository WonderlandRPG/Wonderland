import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { reworkClasses, reworkRaces, validateReworkCatalogIconCoverage } from "@/lib/game/rework-catalog";

describe("catálogo canônico de classes e raças do Rework", () => {
  it("mantém exatamente as 17 classes e 11 raças oficiais", () => {
    expect(reworkClasses).toHaveLength(17);
    expect(reworkRaces).toHaveLength(11);
    expect(new Set(reworkClasses.map((entry) => entry.id)).size).toBe(17);
    expect(new Set(reworkRaces.map((entry) => entry.id)).size).toBe(11);
  });

  it("oferece seis técnicas e três caminhos completos por classe", () => {
    for (const entry of reworkClasses) {
      expect(entry.abilities).toHaveLength(6);
      expect(entry.paths).toHaveLength(3);
      expect(entry.abilities.every((ability) => ability.variants.length === 3)).toBe(true);
      expect(entry.abilities.every((ability) => !("cost" in ability) && !("resource" in ability))).toBe(true);
    }
  });

  it("oferece característica e duas habilidades sem custo por raça", () => {
    for (const entry of reworkRaces) {
      expect(entry.powers.map((power) => power.kind)).toEqual(["Característica", "Habilidade", "Habilidade"]);
      expect(entry.powers.every((power) => !("cost" in power) && !("resource" in power))).toBe(true);
    }
  });

  it("possui um ícone real para cada técnica", () => {
    const missing = validateReworkCatalogIconCoverage((iconUrl) =>
      fs.existsSync(path.join(process.cwd(), "public", iconUrl)),
    );
    expect(missing).toEqual([]);
  });
});
