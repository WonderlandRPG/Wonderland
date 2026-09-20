import { describe, expect, it } from "vitest";

import { reworkClasses, reworkRaces } from "@/lib/game/rework-catalog";
import {
  getReworkBasicAttack,
  getReworkClassCombatSkills,
  getReworkRaceCombatSkills,
} from "@/lib/game/rework-combat";

describe("contrato executável do combate Rework", () => {
  it("converte todas as habilidades ativas de classe em operações táticas", () => {
    for (const entry of reworkClasses) {
      const skills = getReworkClassCombatSkills(entry, 100);
      expect(skills, entry.name).toHaveLength(4);
      expect(getReworkBasicAttack(entry), entry.name).not.toBeNull();
      for (const skill of skills) {
        expect(skill.operations.length, `${entry.name}: ${skill.name}`).toBeGreaterThan(0);
        expect(JSON.stringify(skill), `${entry.name}: ${skill.name}`).not.toContain('"ARC"');
      }
    }
  });

  it("converte os dois poderes ativos de cada raça sem atributo legado", () => {
    for (const entry of reworkRaces) {
      const skills = getReworkRaceCombatSkills(entry, 100);
      expect(skills, entry.name).toHaveLength(2);
      for (const skill of skills) {
        expect(skill.operations.length, `${entry.name}: ${skill.name}`).toBeGreaterThan(0);
        expect(JSON.stringify(skill), `${entry.name}: ${skill.name}`).not.toContain('"ARC"');
      }
    }
  });

  it("preserva alcance, área e recarga como valores válidos", () => {
    const skills = [
      ...reworkClasses.flatMap((entry) => getReworkClassCombatSkills(entry, 100)),
      ...reworkRaces.flatMap((entry) => getReworkRaceCombatSkills(entry, 100)),
    ];
    for (const skill of skills) {
      expect(skill.range).toBeGreaterThanOrEqual(0);
      expect(skill.area).toBeGreaterThanOrEqual(0);
      expect(skill.cooldown).toBeGreaterThanOrEqual(0);
    }
  });
});
