export const firstDungeon = {
  key: "ruinas-de-verdantia",
  name: "Ruínas de Verdantia",
  rank: "E",
  minimumPlayers: 4,
  recommendedLevel: "1–10",
  description:
    "Uma patrulha desapareceu sob as antigas muralhas cobertas de musgo. Reúna quatro aventureiros e interrompa a infestação antes que alcance as trilhas de Aokigahara.",
  encounters: [
    { key: "batedor-musgoso", name: "Batedor Musgoso", role: "Atacante", position: "0% 0%" },
    { key: "limo-runico", name: "Limo Rúnico", role: "Controle", position: "100% 0%" },
    { key: "kobold-tunel", name: "Kobold do Túnel", role: "Defensor", position: "0% 100%" },
    { key: "rei-rato", name: "Rei Rato Coroado", role: "Chefe", position: "100% 100%" },
  ],
} as const;
