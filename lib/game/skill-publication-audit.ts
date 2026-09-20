import type { ClassPayload, ClassSkill } from "@/lib/game/classes";
import type { RacePayload } from "@/lib/game/races";
import { classSkillSchema } from "@/lib/game/schemas";
import { hasTacticalMechanicalEffect } from "@/lib/game/tactical-skill";

export type SkillAuditIssueCode =
  | "duplicate-key"
  | "invalid-structured-skill"
  | "missing-mechanics"
  | "missing-power"
  | "missing-duration"
  | "missing-modifier"
  | "missing-distance"
  | "invalid-area"
  | "description-mismatch"
  | "kind-mismatch";

export type SkillAuditIssue = {
  code: SkillAuditIssueCode;
  skillKey: string;
  skillName: string;
  path: string;
  message: string;
};

export type SkillPublicationAudit = {
  publishable: boolean;
  auditedSkills: number;
  issues: SkillAuditIssue[];
};

const statusOperations = new Set(["BUFF", "DEBUFF", "APPLY_STATUS", "SUMMON"]);
const durationOperations = new Set([
  "BUFF",
  "DEBUFF",
  "APPLY_STATUS",
  "SUMMON",
  "STUN",
  "ROOT",
  "SILENCE",
  "FEAR",
  "TAUNT",
]);
const spatialOperations = new Set(["MOVE", "TELEPORT", "PUSH"]);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isPassiveOrReaction(skill: ClassSkill) {
  return /passiva|reacao/i.test(normalizeText(skill.type));
}

function operationHasPower(skill: ClassSkill, operation: ClassSkill["operations"][number]) {
  const scaling = operation.scaling.length ? operation.scaling : skill.scaling;
  return operation.base > 0 || scaling.some((entry) => entry.multiplier > 0);
}

function issue(
  skill: Pick<ClassSkill, "key" | "name">,
  path: string,
  code: SkillAuditIssueCode,
  message: string,
): SkillAuditIssue {
  return { code, skillKey: skill.key, skillName: skill.name, path, message };
}

export function auditSkillForPublication(skill: ClassSkill, path = skill.key) {
  const issues: SkillAuditIssue[] = [];
  if (isPassiveOrReaction(skill)) return issues;

  if (!hasTacticalMechanicalEffect(skill)) {
    issues.push(
      issue(skill, path, "missing-mechanics", "habilidade ativa sem efeito mecânico executável"),
    );
  }

  for (const [index, operation] of skill.operations.entries()) {
    const operationPath = `${path}.operations.${index}`;
    if (
      ["DAMAGE", "HEAL", "SHIELD", "RESOURCE_GAIN", "RESOURCE_COST"].includes(
        operation.operation,
      ) &&
      !operationHasPower(skill, operation)
    ) {
      issues.push(
        issue(
          skill,
          operationPath,
          "missing-power",
          `${operation.operation} precisa de valor base ou escala maior que zero`,
        ),
      );
    }
    if (
      statusOperations.has(operation.operation) &&
      !operation.modifiers.some((modifier) => modifier.value !== 0)
    ) {
      issues.push(
        issue(
          skill,
          operationPath,
          "missing-modifier",
          `${operation.operation} precisa alterar ao menos um atributo`,
        ),
      );
    }
    if (
      durationOperations.has(operation.operation) &&
      Math.max(operation.duration, skill.duration) <= 0
    ) {
      issues.push(
        issue(
          skill,
          operationPath,
          "missing-duration",
          `${operation.operation} precisa ter duração`,
        ),
      );
    }
    if (spatialOperations.has(operation.operation) && operation.distance <= 0) {
      issues.push(
        issue(
          skill,
          operationPath,
          "missing-distance",
          `${operation.operation} precisa informar a distância em casas`,
        ),
      );
    }
  }

  if (skill.target === "area" && skill.area <= 0) {
    issues.push(
      issue(
        skill,
        path,
        "invalid-area",
        "habilidade de área precisa ter raio de pelo menos 1 casa",
      ),
    );
  }

  const operations = new Set(skill.operations.map((operation) => operation.operation));
  if (skill.kind === "damage" && !operations.has("DAMAGE")) {
    issues.push(
      issue(skill, path, "kind-mismatch", "habilidade de dano não possui operação DAMAGE"),
    );
  }
  if (skill.kind === "heal" && !operations.has("HEAL")) {
    issues.push(issue(skill, path, "kind-mismatch", "habilidade de cura não possui operação HEAL"));
  }
  if (skill.kind === "shield" && !operations.has("SHIELD")) {
    issues.push(
      issue(skill, path, "kind-mismatch", "habilidade de escudo não possui operação SHIELD"),
    );
  }

  const description = normalizeText(`${skill.effect} ${skill.playerDescription}`);
  const expectations: Array<[RegExp, ClassSkill["operations"][number]["operation"], string]> = [
    [
      /\b(?:causa|causar|causando|inflige|sofre)\b.{0,40}\bdano\b|\bdano\b.{0,40}\b(?:fisico|magico|verdadeiro)\b/,
      "DAMAGE",
      "a descrição promete dano",
    ],
    [
      /\b(?:cura|recupera|restaura)\b.{0,30}\b(?:hp|vida|aliado|alvo)\b/,
      "HEAL",
      "a descrição promete cura",
    ],
    [/\bescudo\b/, "SHIELD", "a descrição promete escudo"],
    [/\bteleport/, "TELEPORT", "a descrição promete teleporte"],
  ];
  for (const [pattern, expectedOperation, message] of expectations) {
    if (pattern.test(description) && !operations.has(expectedOperation)) {
      issues.push(
        issue(
          skill,
          path,
          "description-mismatch",
          `${message}, mas não possui ${expectedOperation}`,
        ),
      );
    }
  }
  if (/\b3\s*[x×]\s*3\b/.test(description) && (skill.target !== "area" || skill.area !== 1)) {
    issues.push(
      issue(skill, path, "description-mismatch", "área 3×3 deve usar alvo de área com raio 1"),
    );
  }

  return issues;
}

function auditSkills(entries: Array<{ skill: ClassSkill; path: string }>): SkillPublicationAudit {
  const issues: SkillAuditIssue[] = [];
  const keys = new Map<string, string>();
  for (const { skill, path } of entries) {
    const previousPath = keys.get(skill.key);
    if (previousPath) {
      issues.push(
        issue(skill, path, "duplicate-key", `chave repetida; já utilizada em ${previousPath}`),
      );
    } else {
      keys.set(skill.key, path);
    }
    issues.push(...auditSkillForPublication(skill, path));
  }
  return { publishable: issues.length === 0, auditedSkills: entries.length, issues };
}

export function auditClassForPublication(payload: ClassPayload): SkillPublicationAudit {
  return auditSkills([
    ...payload.progression.map((skill, index) => ({ skill, path: `progression.${index}` })),
    ...payload.paths.flatMap((classPath, pathIndex) =>
      classPath.skills.map((skill, skillIndex) => ({
        skill,
        path: `paths.${pathIndex}.skills.${skillIndex}`,
      })),
    ),
  ]);
}

export function auditRaceForPublication(payload: RacePayload): SkillPublicationAudit {
  const issues: SkillAuditIssue[] = [];
  const entries: Array<{ skill: ClassSkill; path: string }> = [];
  for (const [group, skills] of [
    ["abilitiesV2", payload.abilitiesV2],
    ["traitsV2", payload.traitsV2],
  ] as const) {
    for (const [index, rawSkill] of skills.entries()) {
      const parsed = classSkillSchema.safeParse(rawSkill);
      if (!parsed.success) {
        issues.push({
          code: "invalid-structured-skill",
          skillKey: `${group}-${index}`,
          skillName: `${group} #${index + 1}`,
          path: `${group}.${index}`,
          message: parsed.error.issues
            .map((entry) => `${entry.path.join(".")}: ${entry.message}`)
            .join("; "),
        });
        continue;
      }
      entries.push({ skill: parsed.data, path: `${group}.${index}` });
    }
  }
  const audited = auditSkills(entries);
  return {
    publishable: issues.length === 0 && audited.publishable,
    auditedSkills: entries.length,
    issues: [...issues, ...audited.issues],
  };
}

export function formatSkillAuditIssues(audit: SkillPublicationAudit, limit = 20) {
  return audit.issues
    .slice(0, limit)
    .map((entry) => `${entry.path} (${entry.skillName}): ${entry.message}`);
}
