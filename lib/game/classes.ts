import { z } from "zod";

import { classPayloadSchema, type AttributeKey } from "@/lib/game/schemas";

export type ClassPayload = z.infer<typeof classPayloadSchema>;
export type ClassSkill = ClassPayload["progression"][number];
export type ClassPath = ClassPayload["paths"][number];

export function createClassSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function createEmptyClassSkill(level = 1): ClassSkill {
  return {
    key: "nova-habilidade",
    name: "Nova habilidade",
    level,
    category: "Utilidade",
    type: "Ativa",
    effect: "Descreva o efeito estruturado da habilidade.",
    kind: "utility",
    damageType: "none",
    target: "enemy",
    resource: "none",
    cost: 0,
    cooldown: 0,
    range: 1,
    area: 0,
    duration: 0,
    scaling: [],
    reachText: "1 casa",
    conditions: [],
    systemRule: "Executa as operações na ordem cadastrada.",
    playerDescription: "Descreva o efeito para o jogador.",
    chance: 100,
    maxStacks: 0,
    operations: [
      {
        operation: "APPLY_STATUS",
        target: "enemy",
        base: 0,
        scaling: [],
        damageType: "none",
        status: "novo-efeito",
        duration: 1,
        chance: 100,
        stacks: 1,
        maxStacks: 1,
        distance: 0,
        modifiers: [],
      },
    ],
  };
}

export function createEmptyClassPayload(): ClassPayload {
  return {
    engineContractVersion: 1,
    description: "",
    imageUrl: "",
    difficulty: 1,
    complexity: "Fácil",
    specialization: "DPS Físico",
    primaryAttributes: ["FOR"],
    affinities: { FOR: 3, DEF: 3, RES: 3, INI: 3, INT: 1, ARC: 1 },
    mechanic: { name: "Recurso de classe", description: "Descreva a mecânica exclusiva." },
    resource: {
      name: "Recurso",
      initial: 0,
      maximum: 100,
      generationRules: ["Defina como o recurso é gerado."],
      consumptionRules: ["Defina como o recurso é consumido."],
      resetRules: ["O recurso retorna ao valor inicial no começo de cada combate."],
      generationEvents: [{ trigger: "BASIC_ATTACK_HIT", amount: 10, limitPerAction: 1 }],
    },
    passive: { name: "Passiva da classe", description: "Descreva a passiva permanente." },
    progression: [],
    paths: [],
  };
}

export function parseClassPayload(payload: unknown) {
  return classPayloadSchema.safeParse(payload);
}

export function getClassAffinity(payload: ClassPayload, attribute: AttributeKey) {
  return payload.affinities[attribute];
}

export function getUnlockedClassSkills(payload: ClassPayload, level: number) {
  return payload.progression
    .filter((skill) => skill.level <= level)
    .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
}

export function prepareArenaSkill(skill: ClassSkill): ClassSkill {
  if (/passiva/i.test(skill.type)) return skill;
  const derivedCost =
    20 +
    Math.ceil(skill.level / 10) * 5 +
    (skill.kind === "damage" ? 10 : 0) +
    Math.min(15, skill.area * 5);
  const derivedCooldown =
    skill.level >= 80 ? 5 : skill.level >= 50 ? 4 : skill.kind === "utility" ? 3 : 2;
  return {
    ...skill,
    resource: skill.resource === "none" || skill.cost === 0 ? "mana" : skill.resource,
    cost: skill.cost > 0 ? skill.cost : derivedCost,
    cooldown: skill.cooldown > 0 ? skill.cooldown : derivedCooldown,
  };
}
