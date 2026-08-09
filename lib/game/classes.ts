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
  };
}

export function createEmptyClassPayload(): ClassPayload {
  return {
    description: "",
    imageUrl: "",
    difficulty: 1,
    complexity: "Fácil",
    specialization: "DPS Físico",
    primaryAttributes: ["FOR"],
    affinities: { FOR: 3, DEF: 3, RES: 3, INI: 3, INT: 1, ARC: 1 },
    mechanic: { name: "Recurso de classe", description: "Descreva a mecânica exclusiva." },
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
