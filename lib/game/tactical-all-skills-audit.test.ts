import { describe, expect, it } from "vitest";

import { createCombatant } from "@/lib/game/combat";
import { prepareClassCombatSkills } from "@/lib/game/class-combat-profile";
import { officialClasses } from "@/lib/game/official-classes";
import { hasTacticalMechanicalEffect, resolveTacticalSkill } from "@/lib/game/tactical-skill";

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

function isActiveSkill(type: string) {
  return !/passiva|reação|reacao/i.test(type);
}

describe("auditoria tática de todas as habilidades oficiais", () => {
  it("executa toda habilidade ATIVA mecanicamente definida e rejeita legadas inertes sem consumir recursos", () => {
    const failures: string[] = [];
    const inertFailures: string[] = [];
    let audited = 0;
    let passiveOrReactive = 0;
    let inertLegacy = 0;

    for (const entry of officialClasses) {
      const raw = [
        ...entry.payload.progression,
        ...entry.payload.paths.flatMap((path) => path.skills),
      ];
      const skills = prepareClassCombatSkills(entry.name, entry.payload, raw);

      for (const skill of skills) {
        if (!isActiveSkill(skill.type)) {
          passiveOrReactive += 1;
          continue;
        }
        audited += 1;

        const actor = fighter(`${entry.slug}-actor`);
        const target = fighter(`${entry.slug}-target`);
        const deterministic = {
          ...skill,
          operations: skill.operations.map((operation) => ({ ...operation, chance: 100 })),
        };

        if (!hasTacticalMechanicalEffect(deterministic)) {
          inertLegacy += 1;
          const result = resolveTacticalSkill(actor, target, deterministic);
          const unchangedResource =
            result.actor.mana === actor.mana &&
            result.actor.classResource === actor.classResource &&
            result.actor.raceResource === actor.raceResource;
          const noCooldown = result.actor.cooldowns[skill.key] === undefined;
          if (result.event.kind !== "error" || !unchangedResource || !noCooldown) {
            inertFailures.push(`${entry.name} — ${skill.name}`);
          }
          continue;
        }

        const result = resolveTacticalSkill(actor, target, deterministic);
        if (result.event.kind === "error") {
          failures.push(`${entry.name} — ${skill.name}: ${result.event.message}`);
        }
      }
    }

    expect(passiveOrReactive).toBeGreaterThan(0);
    expect(audited).toBeGreaterThanOrEqual(200);
    expect(inertLegacy).toBeGreaterThan(0);
    expect(failures).toEqual([]);
    expect(inertFailures).toEqual([]);
  });

  it("faz toda operação DAMAGE ATIVA contra inimigo reduzir HP de verdade", () => {
    const failures: string[] = [];
    let offensiveAudited = 0;

    for (const entry of officialClasses) {
      const raw = [
        ...entry.payload.progression,
        ...entry.payload.paths.flatMap((path) => path.skills),
      ];
      const skills = prepareClassCombatSkills(entry.name, entry.payload, raw);

      for (const skill of skills) {
        if (!isActiveSkill(skill.type)) continue;
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
