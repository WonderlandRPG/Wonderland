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
    resourceKey: "class",
    cost: 0,
    cooldown: 0,
    range: 1,
    area: 0,
    duration: 0,
    scaling: [],
    reachText: "Alvo selecionado",
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
  const parsed = classPayloadSchema.safeParse(payload);
  if (!parsed.success) return parsed;
  return {
    success: true as const,
    data: {
      ...parsed.data,
      paths: parsed.data.paths.map((path) => ({
        ...path,
        unlockLevel: Math.max(50, path.unlockLevel),
        skills: [...path.skills].sort(
          (left, right) => left.level - right.level || left.name.localeCompare(right.name),
        ),
      })),
    },
  };
}

export function getClassAffinity(payload: ClassPayload, attribute: AttributeKey) {
  return payload.affinities[attribute];
}

export function getUnlockedClassSkills(payload: ClassPayload, level: number) {
  return payload.progression
    .filter((skill) => skill.level <= level)
    .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
}

export function getClassPath(payload: ClassPayload, pathKey: string | null | undefined) {
  return payload.paths.find((path) => path.key === pathKey) ?? null;
}

export function getUnlockedPathSkills(payload: ClassPayload, pathKey: string | null | undefined, level: number) {
  return (getClassPath(payload, pathKey)?.skills ?? [])
    .filter((skill) => skill.level <= level)
    .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
}

function appendInitiativeModifier(modifiers: ClassSkill["operations"][number]["modifiers"], value: number) {
  const existing = modifiers.find((entry) => entry.attribute === "INI");
  return existing
    ? modifiers.map((entry) => entry.attribute === "INI" ? { ...entry, value: entry.value + value } : entry)
    : [...modifiers, { attribute: "INI" as const, value }];
}

export function prepareArenaSkill(skill: ClassSkill): ClassSkill {
  let convertedSpatial = false;
  const operations = skill.operations.map((operation) => {
    const distancePower = Math.max(5, operation.distance * 5);
    if (operation.operation === "MOVE" || operation.operation === "TELEPORT") {
      convertedSpatial = true;
      return {
        ...operation,
        operation: "BUFF" as const,
        target: "self" as const,
        status: operation.status || "impulso",
        duration: Math.max(1, operation.duration || 1),
        distance: 0,
        modifiers: appendInitiativeModifier(operation.modifiers, distancePower),
      };
    }
    if (operation.operation === "PUSH") {
      convertedSpatial = true;
      return {
        ...operation,
        operation: "DEBUFF" as const,
        target: "enemy" as const,
        status: operation.status || "desestabilizado",
        duration: Math.max(1, operation.duration || 1),
        distance: 0,
        modifiers: appendInitiativeModifier(operation.modifiers, -distancePower),
      };
    }
    if (operation.operation === "ROOT") {
      convertedSpatial = true;
      return {
        ...operation,
        operation: "DEBUFF" as const,
        target: "enemy" as const,
        status: operation.status || "enraizado",
        duration: Math.max(1, operation.duration || 1),
        distance: 0,
        modifiers: appendInitiativeModifier(operation.modifiers, -Math.max(10, distancePower)),
      };
    }
    return operation;
  });

  const targetCap = Math.max(2, Math.min(4, skill.area || 2));
  const reachText =
    skill.target === "self"
      ? "Próprio usuário"
      : skill.target === "area" || skill.area > 0
        ? `Até ${targetCap} alvos válidos`
        : skill.target === "ally"
          ? "Aliado selecionado"
          : "Inimigo selecionado";

  return {
    ...skill,
    range: 0,
    reachText,
    operations,
    playerDescription: convertedSpatial
      ? `${skill.playerDescription} No combate por turnos, deslocamento e empurrão são convertidos em prioridade de iniciativa.`
      : skill.playerDescription,
    systemRule: convertedSpatial
      ? `${skill.systemRule} Conversão JRPG: efeitos espaciais alteram INI em vez de casas.`
      : skill.systemRule,
  };
}
