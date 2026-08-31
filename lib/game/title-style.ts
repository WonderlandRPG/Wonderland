export const titleCategories = [
  "commemorative",
  "achievement",
  "competitive",
  "exploration",
  "social",
  "legendary",
  "administrative",
] as const;

export const titleFrames = ["classic", "ornate", "royal", "arcane", "infernal"] as const;
export const titleAvailabilities = ["permanent", "limited", "exclusive"] as const;
export const titleRarities = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "awakened",
] as const;

export type TitleCategory = (typeof titleCategories)[number];
export type TitleFrame = (typeof titleFrames)[number];
export type TitleAvailability = (typeof titleAvailabilities)[number];
export type TitleRarity = (typeof titleRarities)[number];

export type TitleStyle = {
  primary: string;
  secondary: string;
  glow: string;
  accent: string;
  sigil: string;
  frame: TitleFrame;
  category: TitleCategory;
  availability: TitleAvailability;
  acquisition: string;
  animated: boolean;
};

export const defaultTitleStyle: TitleStyle = {
  primary: "#fff1b5",
  secondary: "#1f7a4c",
  glow: "#d7ad45",
  accent: "#f6d765",
  sigil: "✦",
  frame: "ornate",
  category: "commemorative",
  availability: "exclusive",
  acquisition: "Concedido por uma conquista especial em Wonderland.",
  animated: true,
};

function enumValue<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]) {
  return typeof value === "string" && values.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}

export function parseTitleStyle(value: unknown): TitleStyle {
  const style =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    primary: String(style.primary ?? defaultTitleStyle.primary),
    secondary: String(style.secondary ?? defaultTitleStyle.secondary),
    glow: String(style.glow ?? defaultTitleStyle.glow),
    accent: String(style.accent ?? style.primary ?? defaultTitleStyle.accent),
    sigil: String(style.sigil ?? defaultTitleStyle.sigil).slice(0, 4),
    frame: enumValue(style.frame, titleFrames, defaultTitleStyle.frame),
    category: enumValue(style.category, titleCategories, defaultTitleStyle.category),
    availability: enumValue(
      style.availability,
      titleAvailabilities,
      defaultTitleStyle.availability,
    ),
    acquisition: String(style.acquisition ?? defaultTitleStyle.acquisition),
    animated: typeof style.animated === "boolean" ? style.animated : defaultTitleStyle.animated,
  };
}
