import { describe, expect, it } from "vitest";

import { createCombatant, defaultCombatRules } from "@/lib/game/combat";
import { prepareArenaSkill } from "@/lib/game/classes";
import { prepareClassCombatSkills, rebalanceCombatSkill } from "@/lib/game/class-combat-profile";
import { resolveJrpgSkill } from "@/lib/game/jrpg-skill";
import { officialClasses } from "@/lib/game/official-classes";
import { getForcedTargetId } from "@/lib/game/turn-engine";

const attributes = { FOR: 180, DEF: 120, RES: 120, INI: 100, INT: 180, ARC: 180 };

function fighter(id: string) {
  return createCombatant({
    id,
    name: id,
    attributes,
    baseHp: 1600,
    baseMana: 1200,
    classResource: { name: "Recurso", initial: 9999, maximum: 9999 },
    raceResource: { name: "Racial", initial: 9999, maximum: 9999 },
  });
}

describe("auditoria completa das habilidades oficiais", () => {
  it("executa todas as habilidades principais e de caminho sem erro no motor compartilhado", () => {
    const failures: string[] = [];
    let audited = 0;
    for (const entry of officialClasses) {
      const raw = [
        ...entry.payload.progression,
        ...entry.payload.paths.flatMap((path) => path.skills),
      ];
      const skills = prepareClassCombatSkills(entry.name, entry.payload, raw).map(prepareArenaSkill);
      for (const skill of skills) {
        audited += 1;
        const actor = fighter(`${entry.slug}-actor`);
        const enemy = fighter(`${entry.slug}-enemy`);
        const target = skill.target === "self" || skill.target === "ally" ? actor : enemy;
        const result = resolveJrpgSkill(actor, target, skill, defaultCombatRules);
        if (result.event.kind === "error") failures.push(`${entry.name} — ${skill.name}: ${result.event.message}`);
      }
    }
    expect(audited).toBeGreaterThanOrEqual(250);
    expect(failures).toEqual([]);
  });

  it("reforça multiplicadores e garante buffs/debuffs relevantes", () => {
    for (const entry of officialClasses) {
      for (const skill of entry.payload.progression) {
        const balanced = rebalanceCombatSkill(skill);
        balanced.operations.forEach((operation, index) => {
          const original = skill.operations[index];
          if (operation.operation === "DAMAGE" && original.scaling.length)
            expect(operation.scaling[0].multiplier).toBeGreaterThan(original.scaling[0].multiplier);
          if (["BUFF", "DEBUFF"].includes(operation.operation)) {
            expect(operation.duration).toBeGreaterThanOrEqual(2);
            operation.modifiers.forEach((modifier) => expect(Math.abs(modifier.value)).toBeGreaterThanOrEqual(10));
          }
        });
      }
    }
  });

  it("faz Provocação realmente prender o alvo ao Cavaleiro", () => {
    const knight = officialClasses.find((entry) => entry.slug === "cavaleiro")!;
    const taunt = prepareClassCombatSkills(knight.name, knight.payload, knight.payload.progression)
      .map(prepareArenaSkill)
      .find((skill) => skill.operations.some((operation) => operation.operation === "TAUNT"))!;
    const actor = fighter("cavaleiro");
    const target = fighter("inimigo");
    const result = resolveJrpgSkill(actor, target, taunt);
    expect(getForcedTargetId(result.target)).toBe(actor.id);
  });
});
