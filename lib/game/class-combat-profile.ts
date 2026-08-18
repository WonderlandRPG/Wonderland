import type { ClassPayload, ClassSkill } from "@/lib/game/classes";
import type { AttributeKey } from "@/lib/game/schemas";

export type BasicAttackDamageType = "physical" | "magic";

export function getClassBasicAttackDamageType(payload: ClassPayload): BasicAttackDamageType {
  const primary = new Set(payload.primaryAttributes);
  if (primary.has("FOR") && !primary.has("INT")) return "physical";
  if (primary.has("INT") && !primary.has("FOR")) return "magic";
  if (primary.has("ARC") && !primary.has("FOR")) return "magic";

  const physicalAffinity = payload.affinities.FOR;
  const magicalAffinity = Math.max(payload.affinities.INT, payload.affinities.ARC);
  if (physicalAffinity !== magicalAffinity) return physicalAffinity > magicalAffinity ? "physical" : "magic";

  const specialization = payload.specialization.toLowerCase();
  if (/mágic|magic|suporte|invocador|controle/.test(specialization) && !/físic|fisic/.test(specialization)) {
    return "magic";
  }
  return "physical";
}

function inferredDamageAttribute(skill: ClassSkill, fallback: AttributeKey): AttributeKey {
  const strongest = [...skill.scaling].sort((a, b) => b.multiplier - a.multiplier)[0]?.attribute;
  return strongest ?? fallback;
}

function inferredDamageType(skill: ClassSkill, attribute: AttributeKey): "physical" | "magic" | "true" {
  if (skill.damageType !== "none") return skill.damageType;
  return attribute === "FOR" ? "physical" : "magic";
}

function hasDamageOperation(skill: ClassSkill) {
  return skill.operations.some((operation) => operation.operation === "DAMAGE");
}

function describesDamage(skill: ClassSkill) {
  const text = `${skill.effect} ${skill.playerDescription} ${skill.systemRule}`.toLowerCase();
  return /\b(dano|causa|causar|causando|sofre|atinge|golpe|ataca|ataque|explod|drena)\b/.test(text);
}

export function repairCombatSkill(skill: ClassSkill, fallbackAttribute: AttributeKey = "FOR"): ClassSkill {
  const offensiveIntent = skill.kind === "damage" || (skill.target === "enemy" && describesDamage(skill));
  if (!offensiveIntent || hasDamageOperation(skill)) return skill;

  const attribute = inferredDamageAttribute(skill, fallbackAttribute);
  const scaling = skill.scaling.length ? skill.scaling : [{ attribute, multiplier: 0.8 }];
  const damageType = inferredDamageType(skill, attribute);
  const damageOperation: ClassSkill["operations"][number] = {
    operation: "DAMAGE",
    target: "enemy",
    base: 0,
    scaling,
    damageType,
    status: "",
    duration: 0,
    chance: Math.max(1, skill.chance || 100),
    stacks: 0,
    maxStacks: 0,
    distance: 0,
    modifiers: [],
  };

  return {
    ...skill,
    kind: "damage",
    damageType,
    target: "enemy",
    scaling,
    operations: [damageOperation, ...skill.operations],
    systemRule: `${skill.systemRule} Auditoria JRPG: o componente ofensivo descrito é resolvido como dano real no combate.`,
  };
}

function mechanicSignature(skill: ClassSkill) {
  const operations = skill.operations.map((operation) => ({
    operation: operation.operation,
    target: operation.target,
    damageType: operation.damageType,
    scaling: operation.scaling,
    modifiers: operation.modifiers,
    duration: operation.duration,
    status: operation.status,
  }));
  return JSON.stringify({
    kind: skill.kind,
    target: skill.target,
    damageType: skill.damageType,
    resource: skill.resource,
    cost: skill.cost,
    cooldown: skill.cooldown,
    operations,
  });
}

export function dedupeCombatSkills(skills: ClassSkill[]) {
  const seen = new Set<string>();
  return skills.filter((skill) => {
    const signature = mechanicSignature(skill);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

const offensiveNames: Record<string, string> = {
  bardo: "Acorde Cortante",
  clerigo: "Luz Punitiva",
  clérigo: "Luz Punitiva",
  sacerdote: "Julgamento Luminoso",
  paladino: "Golpe Consagrado",
  oraculo: "Presságio Ruinoso",
  oráculo: "Presságio Ruinoso",
  xama: "Rajada Espiritual",
  xamã: "Rajada Espiritual",
  curandeiro: "Pulso Vital Invertido",
  druida: "Chicote de Espinhos",
  alquimista: "Frasco Volátil",
  invocador: "Comando Ofensivo",
  encantador: "Estilhaço Encantado",
};

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function buildOffensiveFallback(className: string, payload: ClassPayload): ClassSkill {
  const normalized = normalizeName(className);
  const name = offensiveNames[normalized] ?? `Investida de ${className}`;
  const primary = payload.primaryAttributes;
  const usesPhysical = primary.includes("FOR") && !primary.includes("INT") && !primary.includes("ARC");
  const damageType = usesPhysical ? "physical" as const : "magic" as const;
  const scaling = usesPhysical
    ? [{ attribute: "FOR" as const, multiplier: 0.9 }]
    : primary.includes("INT") && primary.includes("ARC")
      ? [
          { attribute: "INT" as const, multiplier: 0.55 },
          { attribute: "ARC" as const, multiplier: 0.45 },
        ]
      : [{ attribute: (primary.includes("INT") ? "INT" : "ARC") as AttributeKey, multiplier: 0.9 }];

  return {
    key: `jrpg-ofensiva-${normalized.replace(/[^a-z0-9]+/g, "-")}`,
    name,
    level: 1,
    category: "Ofensiva",
    type: "Ativa",
    effect: `${name} causa dano ${damageType === "physical" ? "físico" : "mágico"} usando os atributos principais da classe.`,
    kind: "damage",
    damageType,
    target: "enemy",
    resource: "none",
    resourceKey: "class",
    cost: 0,
    cooldown: 1,
    range: 0,
    area: 0,
    duration: 0,
    scaling,
    reachText: "Alvo selecionado",
    conditions: [],
    systemRule: "Habilidade ofensiva de segurança do kit JRPG. Garante que a classe consiga causar dano mesmo em uma construção focada em suporte.",
    playerDescription: `${name}: opção ofensiva confiável para quando cura, escudo ou suporte não forem necessários.`,
    chance: 100,
    maxStacks: 0,
    operations: [
      {
        operation: "DAMAGE",
        target: "enemy",
        base: 0,
        scaling,
        damageType,
        status: "",
        duration: 0,
        chance: 100,
        stacks: 0,
        maxStacks: 0,
        distance: 0,
        modifiers: [],
      },
    ],
  };
}

export function prepareClassCombatSkills(
  className: string,
  payload: ClassPayload,
  unlockedSkills: ClassSkill[],
) {
  const fallbackAttribute: AttributeKey = payload.primaryAttributes.includes("FOR")
    ? "FOR"
    : payload.primaryAttributes.includes("INT")
      ? "INT"
      : "ARC";
  const repaired = dedupeCombatSkills(
    unlockedSkills.map((skill) => repairCombatSkill(skill, fallbackAttribute)),
  );
  const hasOffensiveSkill = repaired.some(
    (skill) => skill.kind === "damage" && skill.operations.some((operation) => operation.operation === "DAMAGE"),
  );
  return hasOffensiveSkill ? repaired : [...repaired, buildOffensiveFallback(className, payload)];
}

export function prepareRaceCombatSkills(skills: ClassSkill[]) {
  return dedupeCombatSkills(skills.map((skill) => repairCombatSkill(skill, "INT")));
}
