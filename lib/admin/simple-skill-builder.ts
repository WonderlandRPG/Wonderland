import { z } from "zod";
import { classSkillSchema, type AttributeKey } from "@/lib/game/schemas";
import type { ClassSkill } from "@/lib/game/classes";

export const simpleSkillDraftSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(8).max(700),
  level: z.coerce.number().int().min(1).max(100).default(1),
  effectType: z.enum(["damage", "heal", "shield", "buff", "debuff", "stun"]),
  targetSide: z.enum(["self", "ally", "enemy"]),
  targetCount: z.coerce.number().int().min(1).max(4).default(1),
  attribute: z.enum(["FOR", "DEF", "RES", "INI", "INT", "ARC"]).default("FOR"),
  multiplier: z.coerce.number().min(0).max(10).default(1),
  baseValue: z.coerce.number().min(0).max(100000).default(0),
  damageType: z.enum(["physical", "magic", "true", "none"]).default("none"),
  resource: z.enum(["mana", "life", "special", "none"]).default("none"),
  resourceKey: z.enum(["class", "race"]).default("class"),
  cost: z.coerce.number().min(0).max(10000).default(0),
  cooldown: z.coerce.number().int().min(0).max(20).default(0),
  duration: z.coerce.number().int().min(0).max(20).default(0),
  chance: z.coerce.number().min(1).max(100).default(100),
  modifierAttribute: z.enum(["FOR", "DEF", "RES", "INI", "INT", "ARC"]).default("FOR"),
  modifierValue: z.coerce.number().min(0).max(9999).default(0),
  statusName: z.string().trim().max(80).default(""),
});

export type SimpleSkillDraft = z.infer<typeof simpleSkillDraftSchema>;

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "nova-habilidade";
}

function category(type: SimpleSkillDraft["effectType"]) {
  return ({ damage: "Dano", heal: "Cura", shield: "Escudo", buff: "Buff", debuff: "Debuff", stun: "Controle" } as const)[type];
}

function kind(type: SimpleSkillDraft["effectType"]): ClassSkill["kind"] {
  if (type === "damage") return "damage";
  if (type === "heal") return "heal";
  if (type === "shield") return "shield";
  return "utility";
}

export function buildClassSkillFromSimpleDraft(input: SimpleSkillDraft): ClassSkill {
  const draft = simpleSkillDraftSchema.parse(input);
  const isArea = draft.targetCount > 1;
  const opTarget = draft.targetSide === "self" ? "self" : draft.targetSide;
  const scaling = draft.multiplier > 0 ? [{ attribute: draft.attribute as AttributeKey, multiplier: draft.multiplier }] : [];
  const operationScaling = scaling;
  const status = draft.statusName || (draft.effectType === "buff" ? "fortalecido" : draft.effectType === "debuff" ? "enfraquecido" : draft.effectType === "stun" ? "atordoado" : "");
  const operation: ClassSkill["operations"][number] = {
    operation: draft.effectType === "damage" ? "DAMAGE" : draft.effectType === "heal" ? "HEAL" : draft.effectType === "shield" ? "SHIELD" : draft.effectType === "buff" ? "BUFF" : draft.effectType === "debuff" ? "DEBUFF" : "STUN",
    target: opTarget,
    base: draft.baseValue,
    scaling: operationScaling,
    damageType: draft.effectType === "damage" ? draft.damageType : "none",
    status,
    duration: draft.effectType === "damage" || draft.effectType === "heal" || draft.effectType === "shield" ? 0 : Math.max(1, draft.duration),
    chance: draft.chance,
    stacks: 1,
    maxStacks: 1,
    distance: 0,
    modifiers: draft.effectType === "buff" ? [{ attribute: draft.modifierAttribute, value: draft.modifierValue }] : draft.effectType === "debuff" ? [{ attribute: draft.modifierAttribute, value: -draft.modifierValue }] : [],
  };
  const targetText = draft.targetSide === "self" ? "si mesmo" : draft.targetSide === "ally" ? "aliado" : "inimigo";
  const amountText = isArea ? `${draft.targetCount} alvos` : `1 ${targetText}`;
  const multiplierText = draft.multiplier > 0 ? `${draft.multiplier}x ${draft.attribute}` : "sem multiplicador";
  const skill: ClassSkill = {
    key: slug(draft.name), name: draft.name, level: draft.level, category: category(draft.effectType), type: "Ativa", effect: draft.description,
    kind: kind(draft.effectType), damageType: draft.effectType === "damage" ? draft.damageType : "none", target: isArea ? "area" : draft.targetSide,
    resource: draft.resource, resourceKey: draft.resourceKey, cost: draft.cost, cooldown: draft.cooldown, range: 0, area: isArea ? draft.targetCount : 0,
    duration: draft.duration, scaling, reachText: isArea ? `${draft.targetCount} alvos selecionáveis` : `Alvo selecionado: ${targetText}`, conditions: [],
    systemRule: `Executa ${operation.operation} em ${amountText}. Base ${draft.baseValue}; escala ${multiplierText}; chance ${draft.chance}%.`,
    playerDescription: draft.description, chance: draft.chance, maxStacks: 1, operations: [operation],
  };
  return classSkillSchema.parse(skill);
}

export function simpleDraftDefaults(): SimpleSkillDraft {
  return { name: "Nova habilidade", description: "Descreva o que a habilidade faz para o jogador.", level: 1, effectType: "damage", targetSide: "enemy", targetCount: 1, attribute: "FOR", multiplier: 1, baseValue: 0, damageType: "physical", resource: "none", resourceKey: "class", cost: 0, cooldown: 0, duration: 0, chance: 100, modifierAttribute: "FOR", modifierValue: 0, statusName: "" };
}
