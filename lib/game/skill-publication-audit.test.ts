import { describe, expect, it } from "vitest";

import { createEmptyClassSkill } from "@/lib/game/classes";
import { officialClasses } from "@/lib/game/official-classes";
import { officialRaces } from "@/lib/game/official-races";
import {
  auditClassForPublication,
  auditRaceForPublication,
  auditSkillForPublication,
} from "@/lib/game/skill-publication-audit";

describe("auditoria de publicação das habilidades", () => {
  it("aprova o catálogo oficial inteiro", () => {
    const failures = [
      ...officialClasses.flatMap((entry) =>
        auditClassForPublication(entry.payload).issues.map(
          (issue) => `Classe ${entry.name} — ${issue.skillName}: ${issue.message}`,
        ),
      ),
      ...officialRaces.flatMap((entry) =>
        auditRaceForPublication(entry.payload).issues.map(
          (issue) => `Raça ${entry.name} — ${issue.skillName}: ${issue.message}`,
        ),
      ),
    ];
    expect(failures).toEqual([]);
  });

  it("bloqueia habilidade ativa sem comportamento real", () => {
    const skill = createEmptyClassSkill();
    expect(auditSkillForPublication(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-mechanics" }),
        expect.objectContaining({ code: "missing-modifier" }),
      ]),
    );
  });

  it("bloqueia descrição que promete dano sem uma operação DAMAGE", () => {
    const skill = createEmptyClassSkill();
    skill.effect = "Causa dano físico no alvo.";
    skill.playerDescription = skill.effect;
    expect(auditSkillForPublication(skill)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "description-mismatch" })]),
    );
  });

  it("valida o contrato exato de uma área 3x3", () => {
    const skill = createEmptyClassSkill();
    skill.effect = "Afeta uma área 3x3.";
    skill.playerDescription = skill.effect;
    skill.target = "area";
    skill.area = 2;
    skill.operations[0] = {
      ...skill.operations[0],
      operation: "STUN",
      target: "area",
      duration: 1,
    };
    expect(auditSkillForPublication(skill)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "description-mismatch" })]),
    );
    skill.area = 1;
    expect(auditSkillForPublication(skill)).toEqual([]);
  });

  it("bloqueia chaves repetidas em caminhos e progressão", () => {
    const payload = structuredClone(officialClasses[0].payload);
    payload.paths[0].skills[0].key = payload.progression[0].key;
    expect(auditClassForPublication(payload).issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "duplicate-key" })]),
    );
  });

  it("bloqueia habilidade racial estruturada inválida", () => {
    const payload = structuredClone(officialRaces[0].payload);
    payload.abilitiesV2[0] = { name: "Sem contrato" };
    expect(auditRaceForPublication(payload).issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "invalid-structured-skill" })]),
    );
  });
});
