export const themeDefinitions = [
  {
    key: "classic",
    label: "Crônicas Reais",
    description: "Pergaminho mineral, bronze e magia azul.",
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
