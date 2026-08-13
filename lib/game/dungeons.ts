export const firstDungeon = {
  key: "ruinas-de-verdantia",
  name: "Ruínas de Verdantia",
  rank: "E",
  minimumPlayers: 4,
  recommendedLevel: "1–10",
  description:
    "Uma patrulha desapareceu sob as antigas muralhas cobertas de musgo. Reúna quatro aventureiros e interrompa a infestação antes que alcance as trilhas de Aokigahara.",
  encounters: [
    { key: "batedor-musgoso", name: "Batedor Musgoso", role: "Atacante", imageUrl: "/images/monsters/dungeon-e/batedor-musgoso.webp" },
    { key: "limo-runico", name: "Limo Rúnico", role: "Controle", imageUrl: "/images/monsters/dungeon-e/limo-runico.webp" },
    { key: "kobold-tunel", name: "Kobold do Túnel", role: "Defensor", imageUrl: "/images/monsters/dungeon-e/kobold-tunel.webp" },
    { key: "rei-rato", name: "Rei Rato Coroado", role: "Chefe", imageUrl: "/images/monsters/dungeon-e/rei-rato-coroado.webp" },
  ],
} as const;
