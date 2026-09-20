import type { ClassSkill } from "@/lib/game/classes";
import type { ReworkClass, ReworkRace } from "@/lib/game/rework-catalog";
import type { PassiveOption } from "@/lib/game/skill-loadout";

type ReworkCombat = ReworkClass["abilities"][number]["combat"];
type ReworkSource = {
  id: string;
  iconUrl?: string;
  name: string;
  description: string;
  unlockLevel: number;
  cooldown?: string;
  combat: ReworkCombat;
};

const OFFICIAL_ATTRIBUTES = ["FOR", "INT", "DEF", "RES", "INI"] as const;

function firstNumber(value = "", fallback = 0) {
  const match = value.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : fallback;
}

function parseCooldown(value = "") {
  return /sem recarga/i.test(value) ? 0 : Math.max(0, Math.round(firstNumber(value)));
}

function parseRange(value = "") {
  if (/pessoal|pr[oó]prio|adjacente/i.test(value)) return /adjacente/i.test(value) ? 1 : 0;
  if (/mapa|global/i.test(value)) return 12;
  return Math.max(0, Math.round(firstNumber(value, 1)));
}

function parseArea(value = "") {
  const square = value.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (square) return Math.max(0, Math.floor((Number(square[1]) - 1) / 2));
  if (/cone|linha|cruz|adjacente|[aá]rea/i.test(value)) return 1;
  if (/raio/i.test(value)) return Math.max(1, Math.round(firstNumber(value, 1)));
  return 0;
}

function parseScaling(text: string) {
  const scaling: ClassSkill["scaling"] = [];
  for (const attribute of OFFICIAL_ATTRIBUTES) {
    const direct = new RegExp(`(\\d+(?:[.,]\\d+)?)%[^\\n]{0,20}\\[?${attribute}\\]?`, "i").exec(
      text,
    );
    const prose = new RegExp(`(\\d+(?:[.,]\\d+)?)%[^\\n]{0,25}(?:da|de)\\s+${attribute}`, "i").exec(
      text,
    );
    const match = direct ?? prose;
    if (match) scaling.push({ attribute, multiplier: Number(match[1].replace(",", ".")) / 100 });
  }
  return scaling.length ? scaling : [{ attribute: "FOR" as const, multiplier: 0.75 }];
}

function damageType(value = ""): ClassSkill["damageType"] {
  return /f[ií]sic/i.test(value)
    ? "physical"
    : /m[aá]g|sagrado|natureza|luz/i.test(value)
      ? "magic"
      : "none";
}

function makeOperation(source: ReworkSource): ClassSkill["operations"] {
  const text = `${source.name} ${source.description} ${source.combat.power ?? ""} ${source.combat.adjustment ?? ""}`;
  const scaling = parseScaling(text);
  const duration = Math.max(0, Math.round(firstNumber(source.combat.duration, 1)));
  const type = damageType(`${source.combat.damageType ?? ""} ${text}`);
  const target = /cura|recuper|restaura|escudo|barreira|redu[cç][aã]o de dano|si mesmo/i.test(text)
    ? ("self" as const)
    : parseArea(source.combat.area) > 0
      ? ("area" as const)
      : ("enemy" as const);
  const common = {
    target,
    base: 0,
    scaling,
    damageType: type,
    status: "",
    duration,
    chance: 100,
    stacks: 0,
    maxStacks: 0,
    distance: 0,
    modifiers: [],
  };
  const operations: ClassSkill["operations"] = [];

  if (/teleport/i.test(text))
    operations.push({
      ...common,
      operation: "TELEPORT",
      target: "self",
      damageType: "none",
      distance: parseRange(source.combat.range),
    });
  else if (/voe|voar|avan[cç]a|desloc|mova|move-se|salta|investida/i.test(text))
    operations.push({
      ...common,
      operation: "MOVE",
      target: "self",
      damageType: "none",
      distance: parseRange(source.combat.range),
    });
  if (/empurra/i.test(text))
    operations.push({
      ...common,
      operation: "PUSH",
      target: "enemy",
      damageType: "none",
      distance: Math.max(1, Math.round(firstNumber(text, 1))),
    });
  if (/cura|recupera|restaura.*hp/i.test(text))
    operations.push({ ...common, operation: "HEAL", target: "self", damageType: "none" });
  if (/escudo|barreira/i.test(text))
    operations.push({ ...common, operation: "SHIELD", target: "self", damageType: "none" });
  if (/paralis|atordoa|stun/i.test(text))
    operations.push({
      ...common,
      operation: "STUN",
      target: "enemy",
      damageType: "none",
      duration: Math.max(1, duration),
    });
  if (/enra[ií]za|imobiliza|root/i.test(text))
    operations.push({
      ...common,
      operation: "ROOT",
      target: "enemy",
      damageType: "none",
      duration: Math.max(1, duration),
    });
  if (/silencia|silence/i.test(text))
    operations.push({
      ...common,
      operation: "SILENCE",
      target: "enemy",
      damageType: "none",
      duration: Math.max(1, duration),
    });
  if (/medo|fear/i.test(text))
    operations.push({
      ...common,
      operation: "FEAR",
      target: "enemy",
      damageType: "none",
      duration: Math.max(1, duration),
    });
  if (/provoca|taunt/i.test(text))
    operations.push({
      ...common,
      operation: "TAUNT",
      target: "enemy",
      damageType: "none",
      duration: Math.max(1, duration),
    });
  if (
    /dano|golpe|ataca|atinge|explode|dispara|expele|impacto|corta|perfura/i.test(text) ||
    type !== "none"
  ) {
    operations.unshift({
      ...common,
      operation: "DAMAGE",
      target: parseArea(source.combat.area) > 0 ? "area" : "enemy",
      damageType: type === "none" ? "physical" : type,
    });
  }
  if (!operations.length) {
    operations.push({
      ...common,
      operation: /reduz|enfraquece|penalidade/i.test(text) ? "DEBUFF" : "BUFF",
      target: /reduz|enfraquece|penalidade/i.test(text) ? "enemy" : "self",
      damageType: "none",
      status: source.id,
      duration: Math.max(1, duration),
      modifiers: [
        {
          attribute: /velocidade|iniciativa/i.test(text) ? "INI" : "DEF",
          value: /reduz|enfraquece|penalidade/i.test(text) ? -15 : 15,
        },
      ],
    });
  }
  return operations;
}

function toSkill(
  source: ReworkSource,
  resourceKey: "class" | "race",
): ClassSkill & { iconUrl?: string } {
  const operations = makeOperation(source);
  const isDamage = operations.some((entry) => entry.operation === "DAMAGE");
  const isHeal = operations.some((entry) => entry.operation === "HEAL");
  const isShield = operations.some((entry) => entry.operation === "SHIELD");
  const area = parseArea(source.combat.area);
  return {
    iconUrl: source.iconUrl,
    key: source.id,
    name: source.name,
    level: source.unlockLevel,
    category: resourceKey === "class" ? "Classe" : "Raça",
    type: "Ativa",
    effect: source.description,
    kind: isDamage ? "damage" : isHeal ? "heal" : isShield ? "shield" : "utility",
    damageType: isDamage
      ? (operations.find((entry) => entry.operation === "DAMAGE")?.damageType ?? "physical")
      : "none",
    target: operations.some((entry) => entry.target === "area")
      ? "area"
      : operations.every((entry) => entry.target === "self")
        ? "self"
        : "enemy",
    resource: "none",
    resourceKey,
    cost: 0,
    cooldown: parseCooldown(source.cooldown),
    range: parseRange(source.combat.range),
    area,
    duration: Math.max(...operations.map((entry) => entry.duration), 0),
    scaling: operations.find((entry) => entry.scaling.length)?.scaling ?? [],
    reachText: source.combat.range,
    conditions: [],
    systemRule: "Executa no tabuleiro os efeitos estruturados do Rework.",
    playerDescription: source.description,
    chance: 100,
    maxStacks: 0,
    operations,
  };
}

export function getReworkClassCombatSkills(
  entry: ReworkClass,
  level: number,
  pathKey?: string | null,
) {
  return entry.abilities.flatMap((ability) => {
    if (
      ability.kind === "Passiva" ||
      ability.kind === "Ataque básico" ||
      ability.unlockLevel > level
    )
      return [];
    const variant = pathKey
      ? ability.variants.find(
          (candidate) => candidate.pathId === pathKey && candidate.unlockLevel <= level,
        )
      : null;
    return [
      toSkill(
        {
          id: ability.id,
          iconUrl: ability.iconUrl,
          name: variant?.name ?? ability.name,
          description: variant?.description ?? ability.description,
          unlockLevel: ability.unlockLevel,
          cooldown: ability.cooldown,
          combat: variant?.combat ?? ability.combat,
        },
        "class",
      ),
    ];
  });
}

export function getReworkRaceCombatSkills(entry: ReworkRace, level: number) {
  return entry.powers.flatMap((power) =>
    power.kind === "Habilidade" && power.unlockLevel <= level
      ? [
          toSkill(
            {
              id: power.id,
              iconUrl: power.iconUrl,
              name: power.name,
              description: power.description,
              unlockLevel: power.unlockLevel,
              cooldown: power.cooldown,
              combat: { range: power.range ?? "Pessoal", area: power.area ?? "1" },
            },
            "race",
          ),
        ]
      : [],
  );
}

export function getReworkPassiveOptions(
  entry: ReworkClass,
  race: ReworkRace,
  level: number,
): PassiveOption[] {
  return [
    ...entry.abilities
      .filter((ability) => ability.kind === "Passiva" && ability.unlockLevel <= level)
      .map((ability) => ({
        key: ability.id,
        name: ability.name,
        description: ability.description,
        source: "Classe" as const,
      })),
    ...race.powers
      .filter((power) => power.kind === "Característica" && power.unlockLevel <= level)
      .map((power) => ({
        key: power.id,
        name: power.name,
        description: power.description,
        source: "Raça" as const,
      })),
  ];
}

export function getReworkBasicAttack(entry: ReworkClass) {
  const ability = entry.abilities.find((candidate) => candidate.kind === "Ataque básico");
  return ability ? toSkill({ ...ability, combat: ability.combat }, "class") : null;
}
