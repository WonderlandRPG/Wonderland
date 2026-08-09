export const contentCatalog = [
  {
    key: "race",
    label: "Raças",
    description: "Bônus, mecânicas, passivas e habilidades por nível.",
    glyph: "RA",
  },
  {
    key: "class",
    label: "Classes",
    description: "Especializações, caminhos e identidade de combate.",
    glyph: "CL",
  },
  {
    key: "class_path",
    label: "Caminhos",
    description: "Ramificações e progressão interna das classes.",
    glyph: "CA",
  },
  {
    key: "skill",
    label: "Habilidades",
    description: "Custos, escalas, efeitos e níveis de desbloqueio.",
    glyph: "HB",
  },
  {
    key: "item",
    label: "Itens",
    description: "Equipamentos, consumíveis, raridades e preços.",
    glyph: "IT",
  },
  {
    key: "monster",
    label: "Monstros",
    description: "Atributos, comportamento, recompensas e encontros.",
    glyph: "MN",
  },
  {
    key: "boss",
    label: "Chefes",
    description: "Fases, mecânicas especiais e tabelas de recompensa.",
    glyph: "CH",
  },
  {
    key: "progression",
    label: "Progressão",
    description: "Níveis, experiência, WG e limites globais.",
    glyph: "XP",
  },
  {
    key: "achievement",
    label: "Conquistas",
    description: "Metas individuais, títulos e recompensas.",
    glyph: "CQ",
  },
  {
    key: "event",
    label: "Eventos",
    description: "Calendário, presença e metas da comunidade.",
    glyph: "EV",
  },
  {
    key: "quest",
    label: "Missões",
    description: "Objetivos, decisões, requisitos e recompensas.",
    glyph: "MS",
  },
  {
    key: "dungeon",
    label: "Dungeons",
    description: "Fases, mapas, encontros e regras de conclusão.",
    glyph: "DG",
  },
] as const;

export type ContentType = (typeof contentCatalog)[number]["key"];

export const contentTypeKeys = contentCatalog.map((item) => item.key) as [
  ContentType,
  ...ContentType[],
];

export function getCatalogEntry(type: ContentType) {
  return contentCatalog.find((entry) => entry.key === type);
}
