export type CombatStatusVisualKind = "buff" | "debuff";

export type CombatStatusLike = {
  name: string;
  duration: number;
  beneficial?: boolean;
  modifiers?: Partial<Record<"FOR" | "DEF" | "RES" | "INI" | "INT" | "ARC", number>>;
  periodicDamage?: number;
};

const STAT_VISUALS = {
  FOR: { icon: "💪", label: "Força" },
  DEF: { icon: "🛡️", label: "Defesa" },
  RES: { icon: "❤️", label: "Resistência" },
  INI: { icon: "⚡", label: "Iniciativa" },
  INT: { icon: "🔮", label: "Inteligência" },
  ARC: { icon: "✨", label: "Arcano" },
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

function firstModifier(status: CombatStatusLike) {
  return Object.entries(status.modifiers ?? {}).find(([, value]) => Number(value) !== 0) as
    | [keyof typeof STAT_VISUALS, number]
    | undefined;
}

export function getCombatStatusVisual(status: CombatStatusLike) {
  const modifier = firstModifier(status);
  const text = normalized(status.name);
  const beneficial =
    typeof status.beneficial === "boolean"
      ? status.beneficial
      : !negativeKeywords.some((keyword) => text.includes(normalized(keyword)));
  const kind: CombatStatusVisualKind = beneficial ? "buff" : "debuff";

  if (status.periodicDamage && status.periodicDamage > 0) {
    if (text.includes("sangr")) return { kind: "debuff" as const, icon: "🩸", label: "Sangramento" };
    if (text.includes("queim")) return { kind: "debuff" as const, icon: "🔥", label: "Queimadura" };
    if (text.includes("veneno")) return { kind: "debuff" as const, icon: "☠️", label: "Veneno" };
    return { kind: "debuff" as const, icon: "💥", label: "Dano contínuo" };
  }

  if (modifier) {
    const [attribute] = modifier;
    const visual = STAT_VISUALS[attribute] ?? { icon: beneficial ? "⬆️" : "⬇️", label: status.name };
    return { kind, icon: visual.icon, label: visual.label };
  }

  if (text.includes("silenc")) return { kind: "debuff" as const, icon: "🤐", label: "Silêncio" };
  if (text.includes("atordo") || text.includes("paralis")) return { kind: "debuff" as const, icon: "💫", label: "Incapacitado" };
  if (text.includes("cura") || text.includes("regen")) return { kind: "buff" as const, icon: "✚", label: "Regeneração" };
  if (text.includes("escudo") || text.includes("barreira")) return { kind: "buff" as const, icon: "🛡️", label: "Proteção" };

  return { kind, icon: beneficial ? "⬆️" : "⬇️", label: status.name };
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
  const kind: CombatStatusVisualKind = negativeKeywords.some((keyword) => lower.includes(normalized(keyword)))
    ? "debuff"
    : "buff";
  const entries = Object.entries(STAT_VISUALS) as Array<[keyof typeof STAT_VISUALS, (typeof STAT_VISUALS)[keyof typeof STAT_VISUALS]]>;
  const stat = entries.find(([key, visual]) => lower.includes(key.toLowerCase()) || lower.includes(normalized(visual.label)));
  if (stat) return { kind, icon: stat[1].icon, label: stat[1].label };
  if (lower.includes("sangr")) return { kind: "debuff" as const, icon: "🩸", label: "Sangramento" };
  if (lower.includes("veneno")) return { kind: "debuff" as const, icon: "☠️", label: "Veneno" };
  if (lower.includes("queim")) return { kind: "debuff" as const, icon: "🔥", label: "Queimadura" };
  if (lower.includes("silenc")) return { kind: "debuff" as const, icon: "🤐", label: "Silêncio" };
  if (lower.includes("atordo") || lower.includes("paralis")) return { kind: "debuff" as const, icon: "💫", label: "Incapacitado" };
  if (lower.includes("escudo") || lower.includes("barreira")) return { kind: "buff" as const, icon: "🛡️", label: "Proteção" };
  return { kind, icon: kind === "buff" ? "⬆️" : "⬇️", label: kind === "buff" ? "Buff" : "Debuff" };
}
