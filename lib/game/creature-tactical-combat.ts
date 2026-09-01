import type { CombatAttributes, CombatantState } from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import type { TacticalAiProfile } from "@/lib/game/tactical-ai-profiles";

export type CreatureCombatProfile = {
  version: number;
  hp: number;
  attributes: CombatAttributes;
  movement: number;
  basicAttackRange: number;
  basicAttackDamageType: "physical" | "magic";
  aiProfile: TacticalAiProfile;
  resistances: string[];
  skills: ClassSkill[];
};

export type TacticalBestiaryCreature = {
  id: string;
  slug: string;
  name: string;
  category: string;
  rank: string;
  behavior: string;
  weaknesses: string[];
  description: string;
  imageUrl?: string;
  combatProfile: CreatureCombatProfile;
};

const rankDefaults: Record<string, { hp: number; stat: number }> = {
  E: { hp: 300, stat: 40 },
  D: { hp: 450, stat: 55 },
  C: { hp: 650, stat: 75 },
  B: { hp: 900, stat: 100 },
  A: { hp: 1300, stat: 135 },
  S: { hp: 1800, stat: 180 },
  EX: { hp: 2500, stat: 240 },
};

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function textArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function normalizeProfile(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function parseCreatureCombatProfile(rank: string, value: unknown): CreatureCombatProfile {
  const profile = normalizeProfile(value);
  const defaults = rankDefaults[rank] ?? rankDefaults.D;
  const rawAttributes = normalizeProfile(profile.attributes);
  const stat = defaults.stat;
  const attributes: CombatAttributes = {
    FOR: numberValue(rawAttributes.FOR, stat),
    DEF: numberValue(rawAttributes.DEF, stat),
    RES: numberValue(rawAttributes.RES, stat),
    INI: numberValue(rawAttributes.INI, stat),
    INT: numberValue(rawAttributes.INT, stat),
    ARC: numberValue(rawAttributes.ARC, stat),
  };
  const aiProfile = ["aggressive", "ranged", "controller"].includes(String(profile.aiProfile))
    ? profile.aiProfile as TacticalAiProfile
    : "aggressive";
  return {
    version: Math.max(1, Math.round(numberValue(profile.version, 1))),
    hp: Math.max(1, Math.round(numberValue(profile.hp, defaults.hp))),
    attributes,
    movement: Math.max(0, Math.round(numberValue(profile.movement, 3))),
    basicAttackRange: Math.max(1, Math.round(numberValue(profile.basicAttackRange, 1))),
    basicAttackDamageType: profile.basicAttackDamageType === "magic" ? "magic" : "physical",
    aiProfile,
    resistances: textArray(profile.resistances),
    skills: Array.isArray(profile.skills) ? profile.skills as ClassSkill[] : [],
  };
}

function normalized(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const affinityAliases: Array<{ key: string; patterns: RegExp[] }> = [
  { key: "fogo", patterns: [/\bfogo\b/, /\bchama/, /\bflame/, /\bfire\b/, /\bincendi/] },
  { key: "frio", patterns: [/\bfrio\b/, /\bgelo\b/, /\bglacial/, /\bice\b/, /\bfrost/] },
  { key: "eletricidade", patterns: [/\beletric/, /\braio\b/, /\btrovao/, /\btrovej/, /\blightning/, /\bthunder/] },
  { key: "sagrado", patterns: [/\bsagrad/, /\bluz sagrada/, /\bdivin/, /\bholy\b/] },
  { key: "acido", patterns: [/\bacido\b/, /\bcorros/, /\bacid\b/] },
  { key: "prata", patterns: [/\bprata\b/, /\bsilver\b/] },
];

function affinityKeysFromText(text: string) {
  const source = normalized(text);
  return affinityAliases
    .filter(({ patterns }) => patterns.some((pattern) => pattern.test(source)))
    .map(({ key }) => key);
}

export function getSkillAffinityKeys(skill: ClassSkill) {
  const text = [
    skill.name,
    skill.effect,
    skill.systemRule,
    skill.playerDescription,
    ...skill.operations.map((operation) => operation.status),
  ].join(" ");
  return new Set(affinityKeysFromText(text));
}

export function findMatchedCreatureWeakness(skill: ClassSkill, weaknesses: string[]) {
  const affinities = getSkillAffinityKeys(skill);
  if (!affinities.size) return null;
  for (const weakness of weaknesses) {
    const weaknessKeys = affinityKeysFromText(weakness);
    if (weaknessKeys.some((key) => affinities.has(key))) return weakness;
  }
  return null;
}

export function applyCreatureWeaknessBonus(input: {
  before: CombatantState;
  after: CombatantState;
  skill: ClassSkill;
  weaknesses: string[];
  multiplier?: number;
}) {
  const weakness = findMatchedCreatureWeakness(input.skill, input.weaknesses);
  const damage = Math.max(0, input.before.hp - input.after.hp);
  if (!weakness || damage <= 0) {
    return { target: input.after, weakness: null, bonusDamage: 0 };
  }
  const multiplier = input.multiplier ?? 0.25;
  const bonusDamage = Math.max(1, Math.round(damage * multiplier));
  return {
    target: { ...input.after, hp: Math.max(0, input.after.hp - bonusDamage) },
    weakness,
    bonusDamage,
  };
}

export function createDefaultCreatureSkill(creature: TacticalBestiaryCreature): ClassSkill {
  const profile = creature.combatProfile.aiProfile;
  const damageType = creature.combatProfile.basicAttackDamageType;
  const scalingAttribute = damageType === "magic" ? "INT" : "FOR";
  const range = profile === "ranged" ? Math.max(3, creature.combatProfile.basicAttackRange) : profile === "controller" ? 3 : Math.max(1, creature.combatProfile.basicAttackRange);
  const base = profile === "aggressive" ? 45 : profile === "ranged" ? 35 : 30;
  const operations: ClassSkill["operations"] = [
    {
      operation: "DAMAGE",
      target: "enemy",
      base,
      scaling: [{ attribute: scalingAttribute, multiplier: profile === "controller" ? 0.75 : 0.9 }],
      damageType,
      status: "",
      duration: 0,
      chance: 100,
      stacks: 0,
      maxStacks: 0,
      distance: 0,
      modifiers: [],
    },
  ];
  if (profile === "controller") {
    operations.push({
      operation: "ROOT",
      target: "enemy",
      base: 0,
      scaling: [],
      damageType: "none",
      status: `controle-${creature.slug}`,
      duration: 1,
      chance: 100,
      stacks: 1,
      maxStacks: 1,
      distance: 0,
      modifiers: [],
    });
  }
  if (profile === "aggressive") {
    operations.push({
      operation: "PUSH",
      target: "enemy",
      base: 0,
      scaling: [],
      damageType: "none",
      status: "",
      duration: 0,
      chance: 100,
      stacks: 0,
      maxStacks: 0,
      distance: 1,
      modifiers: [],
    });
  }
  return {
    key: `criatura-${creature.slug}-tatico`,
    name: profile === "controller" ? "Técnica de Controle" : profile === "ranged" ? "Ataque à Distância" : "Investida Brutal",
    level: 1,
    category: "Criatura",
    type: "Ativa",
    effect: `Ação tática padrão de ${creature.name}.`,
    kind: "damage",
    damageType,
    target: "enemy",
    resource: "none",
    resourceKey: "class",
    cost: 0,
    cooldown: profile === "ranged" ? 1 : 2,
    range,
    area: 0,
    duration: profile === "controller" ? 1 : 0,
    scaling: [{ attribute: scalingAttribute, multiplier: profile === "controller" ? 0.75 : 0.9 }],
    reachText: `${range} casa(s)`,
    conditions: [],
    systemRule: profile === "controller" ? "Dano seguido de ROOT." : profile === "aggressive" ? "Dano seguido de PUSH." : "Dano a distância.",
    playerDescription: `Habilidade tática provisória gerada a partir do perfil ${profile}.`,
    chance: 100,
    maxStacks: 1,
    operations,
  };
}
