export const competitiveRanks = [
  {
    key: "iron",
    name: "Ferro do Véu",
    image: "/assets/ranks/individual/rank-0.webp",
    divisions: "IV — I",
  },
  {
    key: "bronze",
    name: "Bronze Rúnico",
    image: "/assets/ranks/individual/rank-1.webp",
    divisions: "IV — I",
  },
  {
    key: "silver",
    name: "Prata Astral",
    image: "/assets/ranks/individual/rank-2.webp",
    divisions: "IV — I",
  },
  {
    key: "gold",
    name: "Ouro Celestial",
    image: "/assets/ranks/individual/rank-3.webp",
    divisions: "IV — I",
  },
  {
    key: "platinum",
    name: "Platina Arcana",
    image: "/assets/ranks/individual/rank-4.webp",
    divisions: "IV — I",
  },
  {
    key: "diamond",
    name: "Diamante da Convergência",
    image: "/assets/ranks/individual/rank-5.webp",
    divisions: "IV — I",
  },
  {
    key: "master",
    name: "Mestre do Véu",
    image: "/assets/ranks/individual/rank-6.webp",
    divisions: "PdL",
  },
  {
    key: "grandmaster",
    name: "Grão-Mestre de Asterion",
    image: "/assets/ranks/individual/rank-7.webp",
    divisions: "PdL",
  },
  {
    key: "legend",
    name: "Lenda de Wonderland",
    image: "/assets/ranks/individual/rank-8.webp",
    divisions: "Temporada",
  },
] as const;

export type CompetitiveRankKey = (typeof competitiveRanks)[number]["key"];
