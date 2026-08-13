export const themeDefinitions = [
  {
    key: "classic",
    label: "Crônicas Reais",
    description: "Ouro solar, esmeralda, preto e branco da marca.",
    icon: "✧",
  },
  {
    key: "accessible",
    label: "Éter Noturno",
    description: "Obsidiana azulada, ouro e energia arcana.",
    icon: "◐",
  },
  {
    key: "christmas",
    label: "Solstício de Wonderland",
    description: "Pinheiro, rubi, ouro, luzes e neve.",
    icon: "❄",
  },
  {
    key: "halloween",
    label: "Véu das Bruxas",
    description: "Abóbora, violeta, névoa e luar espectral.",
    icon: "☾",
  },
] as const;

export type ThemeName = (typeof themeDefinitions)[number]["key"];
export type ThemeAvailability = Record<ThemeName, boolean>;
