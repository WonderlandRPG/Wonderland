export const themeDefinitions = [
  {
    key: "classic",
    label: "Sonho Estilhaçado",
    description: "Obsidiana, luar violeta e ouro espectral.",
    icon: "✦",
  },
  {
    key: "accessible",
    label: "Aurora dos Reinos",
    description: "Marfim lunar, ametista e metal antigo.",
    icon: "☼",
  },
  {
    key: "christmas",
    label: "Solstício Encantado",
    description: "Noite de pinheiro, rubi, neve e estrelas.",
    icon: "❄",
  },
] as const;

export type ThemeName = (typeof themeDefinitions)[number]["key"];
export type ThemeAvailability = Record<ThemeName, boolean>;
