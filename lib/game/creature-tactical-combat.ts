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
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function normalizeProfile(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
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
    ? (profile.aiProfile as TacticalAiProfile)
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
    skills: Array.isArray(profile.skills) ? (profile.skills as ClassSkill[]) : [],
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
  {
    key: "eletricidade",
    patterns: [/\beletric/, /\braio\b/, /\btrovao/, /\btrovej/, /\blightning/, /\bthunder/],
  },
  { key: "sagrado", patterns: [/\bsagrad/, /\bluz sagrada/, /\bdivin/, /\bholy\b/] },
  { key: "acido", patterns: [/\bacido\b/, /\bcorros/, /\bacid\b/] },
  { key: "prata", patterns: [/\bprata\b/, /\bsilver\b/] },
  { key: "veneno", patterns: [/\bveneno/, /\bvenenoso/, /\btoxina/, /\bpoison/] },
];

const damageTypeAliases: Array<{ key: string; patterns: RegExp[] }> = [
  { key: "physical", patterns: [/\bfisic/, /\bphysical\b/] },
  { key: "magic", patterns: [/\bmagic/, /\bmagico/, /\bmagica/] },
];

const controlAliases: Array<{ key: string; patterns: RegExp[] }> = [
  { key: "root", patterns: [/\broot\b/, /enraiz/, /imobil/, /prisao/] },
  { key: "stun", patterns: [/\bstun\b/, /atordo/, /aturdid/] },
  { key: "fear", patterns: [/\bfear\b/, /\bmedo\b/, /amedront/] },
  { key: "silence", patterns: [/\bsilence\b/, /silencio/, /silenciad/] },
  { key: "taunt", patterns: [/\btaunt\b/, /provoc/] },
];

function keysFromAliases(text: string, aliases: Array<{ key: string; patterns: RegExp[] }>) {
  const source = normalized(text);
  return aliases
    .filter(({ patterns }) => patterns.some((pattern) => pattern.test(source)))
    .map(({ key }) => key);
}

function affinityKeysFromText(text: string) {
  return keysFromAliases(text, affinityAliases);
}

function resistanceKeysFromText(text: string) {
  return [
    ...keysFromAliases(text, affinityAliases),
    ...keysFromAliases(text, damageTypeAliases),
    ...keysFromAliases(text, controlAliases),
  ];
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

function getSkillDamageResistanceKeys(skill: ClassSkill) {
  const keys = new Set(getSkillAffinityKeys(skill));
  if (skill.damageType === "physical" || skill.damageType === "magic") keys.add(skill.damageType);
  for (const operation of skill.operations) {
    if (operation.operation !== "DAMAGE") continue;
    if (operation.damageType === "physical" || operation.damageType === "magic") {
      keys.add(operation.damageType);
    }
  }
  return keys;
}

function findMatchedEntry(entries: string[], keys: Set<string>) {
  for (const entry of entries) {
    const entryKeys = resistanceKeysFromText(entry);
    const key = entryKeys.find((candidate) => keys.has(candidate));
    if (key) return { entry, key };
  }
  return null;
}

function findMatchedWeaknessDetail(skill: ClassSkill, weaknesses: string[]) {
  const affinities = getSkillAffinityKeys(skill);
  if (!affinities.size) return null;
  for (const weakness of weaknesses) {
    const weaknessKeys = affinityKeysFromText(weakness);
    const key = weaknessKeys.find((candidate) => affinities.has(candidate));
    if (key) return { entry: weakness, key };
  }
  return null;
}

export function findMatchedCreatureWeakness(skill: ClassSkill, weaknesses: string[]) {
  return findMatchedWeaknessDetail(skill, weaknesses)?.entry ?? null;
}

export function findMatchedCreatureResistance(skill: ClassSkill, resistances: string[]) {
  return findMatchedEntry(resistances, getSkillDamageResistanceKeys(skill))?.entry ?? null;
}

export function applyCreatureDamageTraits(input: {
  before: CombatantState;
  after: CombatantState;
  skill: ClassSkill;
  weaknesses: string[];
  resistances: string[];
  weaknessMultiplier?: number;
  resistanceMultiplier?: number;
}) {
  const damage = Math.max(0, input.before.hp - input.after.hp);
  const weakness = findMatchedWeaknessDetail(input.skill, input.weaknesses);
  const resistance = findMatchedEntry(input.resistances, getSkillDamageResistanceKeys(input.skill));

  if (damage <= 0) {
    return {
      target: input.after,
      weakness: null,
      resistance: null,
      bonusDamage: 0,
      reducedDamage: 0,
      neutralized: false,
    };
  }

  if (weakness && resistance && weakness.key === resistance.key) {
    return {
      target: input.after,
      weakness: weakness.entry,
      resistance: resistance.entry,
      bonusDamage: 0,
      reducedDamage: 0,
      neutralized: true,
    };
  }

  const bonusDamage = weakness
    ? Math.max(1, Math.round(damage * (input.weaknessMultiplier ?? 0.25)))
    : 0;
  const reducedDamage = resistance
    ? Math.max(1, Math.round(damage * (input.resistanceMultiplier ?? 0.25)))
    : 0;
  const adjustedDamage = Math.max(0, damage + bonusDamage - reducedDamage);

  return {
    target: { ...input.after, hp: Math.max(0, input.before.hp - adjustedDamage) },
    weakness: weakness?.entry ?? null,
    resistance: resistance?.entry ?? null,
    bonusDamage,
    reducedDamage,
    neutralized: false,
  };
}

export function applyCreatureWeaknessBonus(input: {
  before: CombatantState;
  after: CombatantState;
  skill: ClassSkill;
  weaknesses: string[];
  multiplier?: number;
}) {
  const result = applyCreatureDamageTraits({
    ...input,
    resistances: [],
    weaknessMultiplier: input.multiplier,
  });
  return {
    target: result.target,
    weakness: result.weakness,
    bonusDamage: result.bonusDamage,
  };
}

export function applyCreatureBasicAttackResistance(input: {
  before: CombatantState;
  after: CombatantState;
  damageType: "physical" | "magic";
  resistances: string[];
  multiplier?: number;
}) {
  const match = findMatchedEntry(input.resistances, new Set([input.damageType]));
  const damage = Math.max(0, input.before.hp - input.after.hp);
  if (!match || damage <= 0) {
    return { target: input.after, resistance: null, reducedDamage: 0 };
  }
  const reducedDamage = Math.max(1, Math.round(damage * (input.multiplier ?? 0.25)));
  return {
    target: { ...input.after, hp: Math.min(input.before.hp, input.after.hp + reducedDamage) },
    resistance: match.entry,
    reducedDamage,
  };
}

function operationStatusKey(operation: ClassSkill["operations"][number], skill: ClassSkill) {
  if (operation.status) return operation.status;
  if (["ROOT", "STUN", "SILENCE", "FEAR", "TAUNT"].includes(operation.operation)) {
    return `${operation.operation.toLowerCase()}-${skill.key}`;
  }
  return skill.key;
}

export function applyCreatureControlResistances(input: {
  before: CombatantState;
  after: CombatantState;
  skill: ClassSkill;
  resistances: string[];
}) {
  let target = input.after;
  const resisted: Array<{ resistance: string; operation: string; reducedTurns: number }> = [];

  for (const operation of input.skill.operations) {
    if (!["ROOT", "STUN", "SILENCE", "FEAR", "TAUNT", "DEBUFF", "APPLY_STATUS"].includes(operation.operation)) {
      continue;
    }
    if (operation.target !== "enemy" && operation.target !== "area") continue;

    const operationKeys = new Set([
      ...keysFromAliases(`${operation.operation} ${operation.status}`, controlAliases),
      ...keysFromAliases(operation.status, affinityAliases),
    ]);
    if (!operationKeys.size) continue;
    const resistance = findMatchedEntry(input.resistances, operationKeys);
    if (!resistance) continue;

    const key = operationStatusKey(operation, input.skill);
    const status = target.statuses[key];
    const previousDuration = input.before.statuses[key]?.duration ?? 0;
    if (!status || status.duration <= previousDuration) continue;

    const nextDuration = Math.max(previousDuration, status.duration - 1);
    const statuses = { ...target.statuses };
    if (nextDuration <= 0) delete statuses[key];
    else statuses[key] = { ...status, duration: nextDuration };
    target = { ...target, statuses };
    resisted.push({
      resistance: resistance.entry,
      operation: operation.operation,
      reducedTurns: status.duration - nextDuration,
    });
  }

  return { target, resisted };
}

export function createDefaultCreatureSkill(creature: TacticalBestiaryCreature): ClassSkill {
  const profile = creature.combatProfile.aiProfile;
  const damageType = creature.combatProfile.basicAttackDamageType;
  const scalingAttribute = damageType === "magic" ? "INT" : "FOR";
  const range =
    profile === "ranged"
      ? Math.max(3, creature.combatProfile.basicAttackRange)
      : profile === "controller"
        ? 3
        : Math.max(1, creature.combatProfile.basicAttackRange);
  const base = profile === "aggressive" ? 45 : profile === "ranged" ? 35 : 30;
  const operations: ClassSkill["operations"] = [
    {
      operation: "DAMAGE",
      target: "enemy",
      base,
      scaling: [
        { attribute: scalingAttribute, multiplier: profile === "controller" ? 0.75 : 0.9 },
      ],
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
    name:
      profile === "controller"
        ? "Técnica de Controle"
        : profile === "ranged"
          ? "Ataque à Distância"
          : "Investida Brutal",
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
    scaling: [
      { attribute: scalingAttribute, multiplier: profile === "controller" ? 0.75 : 0.9 },
    ],
    reachText: `${range} casa(s)`,
    conditions: [],
    systemRule:
      profile === "controller"
        ? "Dano seguido de ROOT."
        : profile === "aggressive"
          ? "Dano seguido de PUSH."
          : "Dano a distância.",
    playerDescription: `Habilidade tática provisória gerada a partir do perfil ${profile}.`,
    chance: 100,
    maxStacks: 1,
    operations,
  };
}
