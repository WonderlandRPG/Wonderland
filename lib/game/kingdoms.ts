export const kingdoms = [
  { key: "aokigahara", name: "Aokigahara", title: "Reino da Floresta" },
  { key: "oymyakon", name: "Oymyakon", title: "Reino do Gelo" },
  { key: "lesedi", name: "Lesedi", title: "Reino de Areia" },
  { key: "namida", name: "Namida", title: "Reino Submerso" },
  { key: "skypiece", name: "Skypiece", title: "Reino Celestial" },
] as const;

export type KingdomKey = (typeof kingdoms)[number]["key"];

export function kingdomName(key: string) {
  return kingdoms.find((kingdom) => kingdom.key === key)?.name ?? key;
}
