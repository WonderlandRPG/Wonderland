import { describe, expect, it } from "vitest";
import { applyDamage, createCombatant } from "@/lib/game/combat";
import { resolveJrpgSkill } from "@/lib/game/jrpg-skill";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";

import { reworkClasses, reworkRaces } from "@/lib/game/rework-catalog";
import {
  getReworkBasicAttack,
  getReworkClassCombatSkills,
  getReworkRaceCombatSkills,
  getReworkSkillTargetReach,
} from "@/lib/game/rework-combat";

describe("contrato executável do combate Rework", () => {
  const fighter = (id: string) => createCombatant({
    id, name: id, baseHp: 500, baseMana: 0, usesMana: false,
    attributes: { FOR: 100, INT: 100, DEF: 0, RES: 0, INI: 10, ARC: 100 },
  });
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

  it("não envia habilidades ativas sem regra executável para o PvE tático", () => {
    const skills = [
      ...reworkClasses.flatMap((entry) => getReworkClassCombatSkills(entry, 100)),
      ...reworkRaces.flatMap((entry) => getReworkRaceCombatSkills(entry, 100)),
    ];
    for (const skill of skills) {
      const actor = { ...fighter("actor"), hp: 300 };
      const target = { ...fighter("target"), hp: 400 };
      const result = resolveTacticalSkill(actor, target, skill);
      expect(result.event.kind, `${skill.key}: ${skill.name} — ${result.event.message}`).not.toBe("error");
    }
  });

  it("não perde efeitos fundamentais descritos no catálogo", () => {
    const skills = [
      ...reworkClasses.flatMap((entry) => getReworkClassCombatSkills(entry, 100)),
      ...reworkRaces.flatMap((entry) => getReworkRaceCombatSkills(entry, 100)),
    ];
    for (const skill of skills) {
      const description = skill.playerDescription.toLowerCase();
      const operations = new Set(skill.operations.map((operation) => operation.operation));
      if (/\bempurra\b/.test(description)) expect(operations.has("PUSH"), skill.name).toBe(true);
      if (/teleport/.test(description)) expect(operations.has("TELEPORT"), skill.name).toBe(true);
      if (/enra[ií]za|imobiliza|\bprende\b/.test(description)) expect(operations.has("ROOT"), skill.name).toBe(true);
      if (/silencia|impede o uso da pr[oó]xima habilidade/.test(description))
        expect(operations.has("SILENCE"), skill.name).toBe(true);
      if (/remove (?:um )?(?:efeito|penalidade)/.test(description))
        expect(operations.has("REMOVE_STATUS"), skill.name).toBe(true);
    }
  });

  it("permite que uma área centrada no conjurador alcance alvos dentro do raio", () => {
    expect(getReworkSkillTargetReach({ range: 0, area: 2 })).toBe(2);
    expect(getReworkSkillTargetReach({ range: 0, area: 1 })).toBe(1);
    expect(getReworkSkillTargetReach({ range: 5, area: 2 })).toBe(5);
  });

  it("aplica redução real de dano no PvE tático e no PvP", () => {
    const barbarian = reworkClasses.find((entry) => entry.id === "barbaro")!;
    const skill = getReworkClassCombatSkills(barbarian, 100).find((entry) => entry.name === "Pele de Guerra")!;
    expect(skill.operations.some((operation) => operation.damageReductionPercent === 25)).toBe(true);
    const tactical = resolveTacticalSkill(fighter("pve"), fighter("enemy"), skill);
    const versus = resolveJrpgSkill(fighter("pvp"), fighter("enemy"), skill);
    expect(tactical.actor.hp - applyDamage(tactical.actor, 100).hp).toBe(75);
    expect(versus.actor.hp - applyDamage(versus.actor, 100).hp).toBe(75);
  });

  it("remove penalidade e cura o aliado com Pó Restaurador", () => {
    const fairy = reworkRaces.find((entry) => entry.id === "fada")!;
    const skill = getReworkRaceCombatSkills(fairy, 100).find((entry) => entry.name === "Pó Restaurador")!;
    expect(skill.target).toBe("ally");
    const ally = {
      ...fighter("ally"), hp: 300,
      statuses: { poison: { name: "Veneno", duration: 2, stacks: 1, modifiers: {}, beneficial: false } },
    };
    const result = resolveJrpgSkill(fighter("fairy"), ally, skill);
    expect(result.target.hp).toBeGreaterThan(ally.hp);
    expect(result.target.statuses.poison).toBeUndefined();
  });

  it("prende o alvo com Raízes do Primeiro Bosque", () => {
    const elf = reworkRaces.find((entry) => entry.id === "elfo")!;
    const skill = getReworkRaceCombatSkills(elf, 100).find((entry) => entry.name === "Raízes do Primeiro Bosque")!;
    expect(skill.operations.some((operation) => operation.operation === "ROOT")).toBe(true);
    const result = resolveTacticalSkill(fighter("elf"), fighter("target"), skill);
    expect(Object.values(result.target.statuses).some((status) => /ra[ií]z/i.test(status.name))).toBe(true);
  });
});
