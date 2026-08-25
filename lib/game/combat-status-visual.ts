export type CombatStatusVisualKind = "buff" | "debuff";
export type CombatStatusIconKey =
  | "for"
  | "def"
  | "res"
  | "ini"
  | "int"
  | "arc"
  | "bleed"
  | "poison"
  | "burn"
  | "silence"
  | "stun"
  | "regen"
  | "shield"
  | "root"
  | "fear"
  | "blind"
  | "curse"
  | "taunt"
  | "immune"
  | "stealth"
  | "haste"
  | "slow"
  | "vulnerable"
  | "summon"
  | "form"
  | "buff"
  | "debuff";

export const COMBAT_STATUS_ICON_PATHS: Record<CombatStatusIconKey, string[]> = {
  for: [
    "M5.4 14.1c1.9-1.2 3.1-3 3.5-5.4l2.2.8-.3 2.3c1.6-.8 3.2-.8 4.7-.1 2 .9 3.2 2.9 3.2 5.1 0 3.1-2.5 5.4-5.8 5.4H9.4c-3 0-5.2-1.6-6.2-4.2l2.2-3.9Zm8.2-10.6 3.4 1.3-1.7 3.5L12 7l1.6-3.5Z",
  ],
  def: [
    "M12 2.2 20 5.4v5.8c0 5.2-3.2 9-8 11.2-4.8-2.2-8-6-8-11.2V5.4L12 2.2Zm0 3.2L7.2 7.3v3.9c0 3.4 1.7 6.1 4.8 7.8 3.1-1.7 4.8-4.4 4.8-7.8V7.3L12 5.4Z",
  ],
  res: [
    "M12 21.8S3.6 17 3.6 10.5C3.6 6.9 6 4.1 9.3 4.1c1.1 0 2 .3 2.7.8.7-.5 1.6-.8 2.7-.8 3.3 0 5.7 2.8 5.7 6.4 0 6.5-8.4 11.3-8.4 11.3Z",
  ],
  ini: ["m13.5 1.8-8 11.1h5l-1.1 9.3 8.9-12.8h-5.4l.6-7.6Z"],
  int: [
    "m12 1.9 2.1 5.5 5.6 2.1-5.6 2.2-2.1 5.5-2.1-5.5-5.6-2.2 5.6-2.1L12 1.9Zm6.8 12.6 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z",
  ],
  arc: [
    "M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm0 3.2a6.6 6.6 0 1 1 0 13.2 6.6 6.6 0 0 1 0-13.2Zm0 2.1 1.4 2.8 3.1.5-2.2 2.2.5 3.1-2.8-1.5-2.8 1.5.5-3.1-2.2-2.2 3.1-.5L12 7.5Z",
  ],
  bleed: [
    "M12 1.8c3 4.8 6.2 8.3 6.2 12.1A6.2 6.2 0 1 1 5.8 14C5.8 10.1 9 6.6 12 1.8Zm-2.8 13c0 1.9 1.2 3.2 3.1 3.6-3.4 1-5.2-3.2-3.1-5.7v2.1Z",
  ],
  poison: [
    "M12 2.2a7 7 0 0 0-7 7c0 2.5 1.3 4.8 3.4 6v2H6.9v2.6h2.2v2h2.3v-2h1.2v2h2.3v-2h2.2v-2.6h-1.5v-2A7 7 0 0 0 12 2.2ZM9.3 11.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Zm5.4 0a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Zm-4.5 1.8h3.6L12 15.5l-1.8-2.2Z",
  ],
  burn: [
    "M13.4 1.5c.8 3.6-.5 5.1-1.9 6.6-1.1 1.2-2.1 2.4-1.4 4.5.9-1.7 2.2-2.5 3.5-3.5.3 2.3.4 3.9 2 5.3.8-1.5 1-2.9.7-4.4 2.5 2.2 3.8 4.6 3.1 7.4-.8 3.5-3.8 5.8-7.5 5.8-4.2 0-7.6-3-7.6-7.1 0-5.6 4.8-7.5 9.1-14.6Z",
  ],
  silence: [
    "M3.2 8.4h4l5-4v15.2l-5-4h-4V8.4Zm13.4.4 1.8 1.8 1.8-1.8 1.6 1.6-1.8 1.8 1.8 1.8-1.6 1.6-1.8-1.8-1.8 1.8L15 14l1.8-1.8-1.8-1.8 1.6-1.6Z",
  ],
  stun: [
    "m12 1.5 1.8 5.2 5.4-1.3-3.1 4.6 4.8 2.8-5.5.3.7 5.5-4-3.8-4 3.8.7-5.5-5.5-.3 4.8-2.8-3.1-4.6 5.4 1.3L12 1.5Z",
  ],
  regen: ["M9.8 2.5h4.4v7.3h7.3v4.4h-7.3v7.3H9.8v-7.3H2.5V9.8h7.3V2.5Z"],
  shield: [
    "M12 1.7 20.4 5v6.2c0 5.5-3.4 9.4-8.4 11.7-5-2.3-8.4-6.2-8.4-11.7V5L12 1.7Zm0 4.1L7.4 7.6v3.5c0 3.1 1.5 5.5 4.6 7.3 3.1-1.8 4.6-4.2 4.6-7.3V7.6L12 5.8Z",
  ],
  root: [
    "M10.3 2h3.4v8l4.9-2.4 1.5 3.1-5.4 2.6 5.1 5.7-2.6 2.3-5.2-5.8-5.2 5.8L4.2 19l5.1-5.7-5.4-2.6 1.5-3.1 4.9 2.4V2Z",
  ],
  fear: [
    "M12 2.2c5.2 0 9.2 3.7 9.2 8.6 0 3.2-1.7 5.8-4.2 7.4v3.1h-3v-2h-4v2H7v-3.1c-2.5-1.6-4.2-4.2-4.2-7.4 0-4.9 4-8.6 9.2-8.6Zm-3.2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6.4 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9.6 15l2.4 2.1 2.4-2.1H9.6Z",
  ],
  blind: [
    "M2 12s3.7-6.3 10-6.3c2 0 3.8.6 5.3 1.5l-2.1 2.1A5.8 5.8 0 0 0 12 8.4c-2.8 0-5 1.8-6.4 3.6.7.9 1.6 1.8 2.7 2.4l-2 2C3.6 14.7 2 12 2 12Zm19.1-8.5 1.4 1.4L4.9 22.5l-1.4-1.4 3-3C3.6 16.3 1.6 13.1.9 12 2.5 9.2 6.2 4.7 12 4.7c2.5 0 4.5.8 6.2 1.9l2.9-3.1Zm-5.4 9.7-2.5 2.5A4 4 0 0 1 8.3 11l2.5-2.5a4 4 0 0 1 4.9 4.7Z",
  ],
  curse: [
    "m12 1.8 2.3 5.5 5.9.5-4.5 3.8 1.4 5.8-5.1-3.1-5.1 3.1 1.4-5.8-4.5-3.8 5.9-.5L12 1.8Zm-1.2 7.1v4.8h2.4V8.9h-2.4Zm0 6.3v2.4h2.4v-2.4h-2.4Z",
  ],
  taunt: [
    "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 3.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6Zm0 3.1a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Z",
  ],
  immune: [
    "M12 2 20 5v6c0 5.2-3.1 9-8 11.2C7.1 20 4 16.2 4 11V5l8-3Zm-1.3 13.8 5.7-5.7-1.9-1.9-3.8 3.8-1.9-1.9L7 12l3.7 3.8Z",
  ],
  stealth: [
    "M4.5 20.5c.5-4.3 2.2-7.2 5.1-8.8L8.2 8.2 12 2l3.8 6.2-1.4 3.5c2.9 1.6 4.6 4.5 5.1 8.8h-15Zm4.1-2.8h6.8c-.7-1.9-1.8-3.1-3.4-3.1s-2.7 1.2-3.4 3.1Z",
  ],
  haste: ["M3 13.2 11.2 3v6h9.8l-8.2 12v-7H3v-.8Z"],
  slow: ["M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1.4 4v5.2l4 2.3-1.4 2.4-5.4-3.2V6h2.8Z"],
  vulnerable: [
    "M12 2.2 20 5.4v5.8c0 5.2-3.2 9-8 11.2-4.8-2.2-8-6-8-11.2V5.4L12 2.2Zm-1 4.1-2.4 5 2.4 1.4-1.4 4.9 5.8-7.2-2.7-1.2 1-2.9H11Z",
  ],
  summon: [
    "M12 2.2 14.1 8l5.9.2-4.6 3.7 1.8 5.7-5.2-3.3-5.2 3.3 1.8-5.7L4 8.2 9.9 8 12 2.2Zm-8.5 17h5v2.5h-5v-2.5Zm12 0h5v2.5h-5v-2.5Z",
  ],
  form: ["M12 2.2 14.5 8 21 9l-4.8 4.3 1.3 6.5-5.5-3.3-5.5 3.3 1.3-6.5L3 9l6.5-1L12 2.2Z"],
  buff: ["m12 1.8 7 8.2h-4.5v11.8h-5V10H5l7-8.2Z"],
  debuff: ["m12 22.2-7-8.2h4.5V2.2h5V14H19l-7 8.2Z"],
};

export type CombatStatusLike = {
  name: string;
  duration: number;
  beneficial?: boolean;
  modifiers?: Partial<Record<"FOR" | "DEF" | "RES" | "INI" | "INT" | "ARC", number>>;
  periodicDamage?: number;
};

const STAT_VISUALS = {
  FOR: { iconKey: "for" as const, label: "Força" },
  DEF: { iconKey: "def" as const, label: "Defesa" },
  RES: { iconKey: "res" as const, label: "Resistência" },
  INI: { iconKey: "ini" as const, label: "Iniciativa" },
  INT: { iconKey: "int" as const, label: "Inteligência" },
  ARC: { iconKey: "arc" as const, label: "Arcano" },
} as const;

const negativeKeywords = [
  "debuff",
  "reduz",
  "redução",
  "reducao",
  "enfraquec",
  "vulner",
  "sangr",
  "veneno",
  "silên",
  "silen",
  "atordo",
  "paralis",
  "imobil",
  "lent",
  "medo",
  "maldi",
  "queim",
  "congel",
  "cegue",
];

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function statusModifiers(status: CombatStatusLike) {
  return Object.entries(status.modifiers ?? {}).filter(([, value]) => Number(value) !== 0) as Array<
    [keyof typeof STAT_VISUALS, number]
  >;
}

function firstModifier(status: CombatStatusLike) {
  return statusModifiers(status)[0];
}

export function getCombatStatusVisual(status: CombatStatusLike) {
  const modifier = firstModifier(status);
  const modifiers = statusModifiers(status);
  const text = normalized(status.name);
  const hasNegativeModifier = modifiers.some(([, value]) => value < 0);
  const hasPositiveModifier = modifiers.some(([, value]) => value > 0);
  const hasNegativeKeyword = negativeKeywords.some((keyword) => text.includes(normalized(keyword)));
  const beneficial =
    status.periodicDamage && status.periodicDamage > 0
      ? false
      : hasNegativeModifier || hasNegativeKeyword
        ? false
        : hasPositiveModifier
          ? true
          : (status.beneficial ?? true);
  const kind: CombatStatusVisualKind = beneficial ? "buff" : "debuff";

  if (status.periodicDamage && status.periodicDamage > 0) {
    if (text.includes("sangr"))
      return { kind: "debuff" as const, iconKey: "bleed" as const, label: "Sangramento" };
    if (text.includes("queim"))
      return { kind: "debuff" as const, iconKey: "burn" as const, label: "Queimadura" };
    if (text.includes("veneno"))
      return { kind: "debuff" as const, iconKey: "poison" as const, label: "Veneno" };
    return { kind: "debuff" as const, iconKey: "debuff" as const, label: "Dano contínuo" };
  }

  const reducedDefenses = modifiers.filter(
    ([attribute, value]) => value < 0 && (attribute === "DEF" || attribute === "RES"),
  );
  if (reducedDefenses.length) {
    const label =
      reducedDefenses.length > 1
        ? "Defesas reduzidas"
        : reducedDefenses[0][0] === "DEF"
          ? "Defesa reduzida"
          : "Resistência reduzida";
    return { kind: "debuff" as const, iconKey: "vulnerable" as const, label };
  }

  if (modifier) {
    const [attribute] = modifier;
    const visual = STAT_VISUALS[attribute];
    return {
      kind,
      iconKey: visual.iconKey,
      label: `${visual.label} ${kind === "buff" ? "aumentada" : "reduzida"}`,
    };
  }

  if (text.includes("silenc"))
    return { kind: "debuff" as const, iconKey: "silence" as const, label: "Silêncio" };
  if (text.includes("atordo") || text.includes("paralis"))
    return { kind: "debuff" as const, iconKey: "stun" as const, label: "Incapacitado" };
  if (text.includes("enraiz") || text.includes("imobil") || text.includes("preso"))
    return { kind: "debuff" as const, iconKey: "root" as const, label: "Imobilizado" };
  if (text.includes("medo") || text.includes("amedront"))
    return { kind: "debuff" as const, iconKey: "fear" as const, label: "Medo" };
  if (text.includes("cego") || text.includes("cegue"))
    return { kind: "debuff" as const, iconKey: "blind" as const, label: "Cegueira" };
  if (text.includes("maldi") || text.includes("conden") || text.includes("decompos"))
    return { kind: "debuff" as const, iconKey: "curse" as const, label: "Maldição" };
  if (text.includes("provoc"))
    return { kind: "debuff" as const, iconKey: "taunt" as const, label: "Provocado" };
  if (text.includes("vulner") || text.includes("fraqueza") || text.includes("dissolvida"))
    return { kind: "debuff" as const, iconKey: "vulnerable" as const, label: "Vulnerável" };
  if (text.includes("lent"))
    return { kind: "debuff" as const, iconKey: "slow" as const, label: "Lentidão" };
  if (text.includes("cura") || text.includes("regen"))
    return { kind: "buff" as const, iconKey: "regen" as const, label: "Regeneração" };
  if (text.includes("escudo") || text.includes("barreira"))
    return kind === "debuff"
      ? { kind, iconKey: "vulnerable" as const, label: "Defesas reduzidas" }
      : { kind, iconKey: "shield" as const, label: "Proteção" };
  if (text.includes("imortal") || text.includes("imune") || text.includes("bastiao"))
    return { kind: "buff" as const, iconKey: "immune" as const, label: "Imunidade" };
  if (text.includes("sombra") || text.includes("substituicao"))
    return { kind: "buff" as const, iconKey: "stealth" as const, label: "Evasão" };
  if (text.includes("rapidez") || text.includes("veloc") || text.includes("ritmo"))
    return { kind: "buff" as const, iconKey: "haste" as const, label: "Aceleração" };
  if (text.includes("servo") || text.includes("homunculo") || text.includes("procissao"))
    return { kind: "buff" as const, iconKey: "summon" as const, label: "Invocação" };
  if (
    text.includes("forma") ||
    text.includes("avatar") ||
    text.includes("transe") ||
    text.includes("glamour") ||
    text.includes("frenesi")
  )
    return { kind: "buff" as const, iconKey: "form" as const, label: "Transformação" };

  return {
    kind,
    iconKey: (beneficial ? "buff" : "debuff") as CombatStatusIconKey,
    label: status.name,
  };
}

export function describeCombatStatus(status: CombatStatusLike) {
  const modifiers = Object.entries(status.modifiers ?? {})
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => `${key} ${Number(value) > 0 ? "+" : ""}${value}`)
    .join(" · ");
  const duration = status.duration > 0 ? `${status.duration} turno(s)` : "efeito ativo";
  return [status.name, modifiers, duration].filter(Boolean).join(" · ");
}

export function visualFromStatusText(value: string) {
  const lower = normalized(value);
  const words = lower.split(/[^a-z0-9]+/).filter(Boolean);
  const kind: CombatStatusVisualKind = negativeKeywords.some((keyword) =>
    lower.includes(normalized(keyword)),
  )
    ? "debuff"
    : "buff";
  const entries = Object.entries(STAT_VISUALS) as Array<
    [keyof typeof STAT_VISUALS, (typeof STAT_VISUALS)[keyof typeof STAT_VISUALS]]
  >;
  const stat = entries.find(
    ([key, visual]) =>
      words.includes(key.toLowerCase()) || lower.includes(normalized(visual.label)),
  );
  if (stat) return { kind, iconKey: stat[1].iconKey, label: stat[1].label };
  if (lower.includes("sangr"))
    return { kind: "debuff" as const, iconKey: "bleed" as const, label: "Sangramento" };
  if (lower.includes("veneno"))
    return { kind: "debuff" as const, iconKey: "poison" as const, label: "Veneno" };
  if (lower.includes("queim"))
    return { kind: "debuff" as const, iconKey: "burn" as const, label: "Queimadura" };
  if (lower.includes("silenc"))
    return { kind: "debuff" as const, iconKey: "silence" as const, label: "Silêncio" };
  if (lower.includes("atordo") || lower.includes("paralis"))
    return { kind: "debuff" as const, iconKey: "stun" as const, label: "Incapacitado" };
  if (lower.includes("enraiz") || lower.includes("imobil") || lower.includes("preso"))
    return { kind: "debuff" as const, iconKey: "root" as const, label: "Imobilizado" };
  if (lower.includes("medo") || lower.includes("amedront"))
    return { kind: "debuff" as const, iconKey: "fear" as const, label: "Medo" };
  if (lower.includes("cego") || lower.includes("cegue"))
    return { kind: "debuff" as const, iconKey: "blind" as const, label: "Cegueira" };
  if (lower.includes("maldi") || lower.includes("conden") || lower.includes("decompos"))
    return { kind: "debuff" as const, iconKey: "curse" as const, label: "Maldição" };
  if (lower.includes("provoc"))
    return { kind: "debuff" as const, iconKey: "taunt" as const, label: "Provocado" };
  if (lower.includes("vulner") || lower.includes("fraqueza") || lower.includes("dissolvida"))
    return { kind: "debuff" as const, iconKey: "vulnerable" as const, label: "Vulnerável" };
  if (lower.includes("lent"))
    return { kind: "debuff" as const, iconKey: "slow" as const, label: "Lentidão" };
  if (lower.includes("cura") || lower.includes("regen"))
    return { kind: "buff" as const, iconKey: "regen" as const, label: "Regeneração" };
  if (lower.includes("escudo") || lower.includes("barreira"))
    return { kind: "buff" as const, iconKey: "shield" as const, label: "Proteção" };
  if (lower.includes("imortal") || lower.includes("imune") || lower.includes("bastiao"))
    return { kind: "buff" as const, iconKey: "immune" as const, label: "Imunidade" };
  if (lower.includes("sombra") || lower.includes("substituicao"))
    return { kind: "buff" as const, iconKey: "stealth" as const, label: "Evasão" };
  if (lower.includes("rapidez") || lower.includes("veloc") || lower.includes("ritmo"))
    return { kind: "buff" as const, iconKey: "haste" as const, label: "Aceleração" };
  if (lower.includes("servo") || lower.includes("homunculo") || lower.includes("procissao"))
    return { kind: "buff" as const, iconKey: "summon" as const, label: "Invocação" };
  if (
    lower.includes("forma") ||
    lower.includes("avatar") ||
    lower.includes("transe") ||
    lower.includes("glamour") ||
    lower.includes("frenesi")
  )
    return { kind: "buff" as const, iconKey: "form" as const, label: "Transformação" };
  return {
    kind,
    iconKey: (kind === "buff" ? "buff" : "debuff") as CombatStatusIconKey,
    label: kind === "buff" ? "Buff" : "Debuff",
  };
}
