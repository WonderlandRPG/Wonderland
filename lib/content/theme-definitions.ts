export const themeDefinitions = [
  { key: "classic", label: "Aurora Real", description: "Azul-neblina, ouro antigo e luz arcana.", icon: "☀" },
  { key: "accessible", label: "Noite Arcana", description: "Azul-noite, ardósia, ouro e turquesa.", icon: "☾" },
  { key: "christmas", label: "Natal em Wonderland", description: "Vinho, pinheiro, ouro, luzes e neve.", icon: "❄" },
] as const;

export type ThemeName = (typeof themeDefinitions)[number]["key"];
export type ThemeAvailability = Record<ThemeName, boolean>;
