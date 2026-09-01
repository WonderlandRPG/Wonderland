import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import { prepareClassCombatSkills } from "@/lib/game/class-combat-profile";
import { officialClasses } from "@/lib/game/official-classes";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";

const attributes = { FOR: 220, DEF: 120, RES: 120, INI: 100, INT: 220, ARC: 220 };

function fighter(id: string) {
  return createCombatant({
    id,
    name: id,
    attributes,
    baseHp: 5000,
    baseMana: 5000,
    classResource: { name: "Recurso", initial: 9999, maximum: 9999 },
    raceResource: { name: "Racial", initial: 9999, maximum: 9999 },
    usesMana: true,
  });
}

describe("auditoria tática de todas as habilidades oficiais", () => {
  it("executa todas as habilidades no resolvedor tático sem erro", () => {
    const failures: string[] = [];
    let audited = 0;

    for (const entry of officialClasses) {
      const raw = [
        ...entry.payload.progression,
        ...entry.payload.paths.flatMap((path) => path.skills),
      ];
      const skills = prepareClassCombatSkills(entry.name, entry.payload, raw);

      for (const skill of skills) {
        audited += 1;
        const deterministic = {
          ...skill,
          operations: skill.operations.map((operation) => ({ ...operation, chance: 100 })),
        };
        const result = resolveTacticalSkill(
          fighter(`${entry.slug}-actor`),
          fighter(`${entry.slug}-target`),
          deterministic,
        );
        if (result.event.kind === "error") {
          failures.push(`${entry.name} — ${skill.name}: ${result.event.message}`);
        }
      }
    }

    expect(audited).toBeGreaterThanOrEqual(250);
    expect(failures).toEqual([]);
  });

  it("faz toda operação DAMAGE contra inimigo reduzir HP de verdade", () => {
    const failures: string[] = [];
    let offensiveAudited = 0;

    for (const entry of officialClasses) {
      const raw = [
        ...entry.payload.progression,
        ...entry.payload.paths.flatMap((path) => path.skills),
      ];
      const skills = prepareClassCombatSkills(entry.name, entry.payload, raw);

      for (const skill of skills) {
        const hasEnemyDamage = skill.operations.some(
          (operation) => operation.operation === "DAMAGE" && (operation.target === "enemy" || operation.target === "area"),
        );
        if (!hasEnemyDamage) continue;
        offensiveAudited += 1;

        const actor = fighter(`${entry.slug}-actor`);
        const target = fighter(`${entry.slug}-target`);
        const deterministic = {
          ...skill,
          operations: skill.operations.map((operation) => ({ ...operation, chance: 100 })),
        };
        const result = resolveTacticalSkill(actor, target, deterministic);
        if (result.target.hp >= target.hp) {
          failures.push(`${entry.name} — ${skill.name}: DAMAGE não reduziu HP (${target.hp} → ${result.target.hp})`);
        }
      }
    }

    expect(offensiveAudited).toBeGreaterThan(50);
    expect(failures).toEqual([]);
  });
});
