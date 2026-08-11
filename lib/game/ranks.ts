import type { CombatAttributes } from "@/lib/game/combat";
import { attributeKeys } from "@/lib/game/schemas";

export const adventureRanks = [
  {
    key: "E",
    colorName: "Cinza",
    color: "#7D8790",
    title: "Iniciante",
    description:
      "O primeiro Rank de Wonderland. Representa aventureiros iniciantes que estão começando a enfrentar os perigos do mundo.",
    access: ["Missões E", "Dungeons E", "Recompensas e XP básicos"],
    effect: {
      name: "Amparo da Guilda",
      summary: "A proteção oferecida aos novos aventureiros concede +6 RES em combate.",
      modifiers: { RES: 6 },
    },
  },
  {
    key: "D",
    colorName: "Verde",
    color: "#4ADE80",
    title: "Explorador",
    description:
      "Aventureiros que já adquiriram alguma experiência e estão preparados para desafios além das missões mais básicas.",
    access: ["Missões D", "Dungeons D", "XP superior ao Rank E"],
    effect: {
      name: "Passos de Fronteira",
      summary: "A experiência em expedições concede +6 INI em combate.",
      modifiers: { INI: 6 },
    },
  },
  {
    key: "C",
    colorName: "Ciano",
    color: "#22D3EE",
    title: "Veterano",
    description:
      "Aventureiros experientes, capazes de enfrentar ameaças consideráveis e assumir missões de maior responsabilidade.",
    access: ["Missões C", "Dungeons C", "Maior variedade de recompensas"],
    effect: {
      name: "Domínio de Combate",
      summary: "A versatilidade veterana concede +4 FOR e +4 INT em combate.",
      modifiers: { FOR: 4, INT: 4 },
    },
  },
  {
    key: "B",
    colorName: "Azul Safira",
    color: "#3B82F6",
    title: "Elite",
    description:
      "Aventureiros poderosos que já se destacam entre os demais e são preparados para missões de alto risco.",
    access: ["Missões B", "Dungeons B", "Chefes de elite"],
    effect: {
      name: "Postura da Elite",
      summary: "O treinamento de elite concede +6 DEF em combate.",
      modifiers: { DEF: 6 },
    },
  },
  {
    key: "A",
    colorName: "Roxo Ametista",
    color: "#A855F7",
    title: "Lenda Viva",
    description:
      "Aventureiros excepcionais, reconhecidos por grandes feitos e capazes de enfrentar ameaças que colocam regiões em perigo.",
    access: ["Missões A", "Dungeons A", "Incursões de alto risco"],
    effect: {
      name: "Presença Lendária",
      summary: "A autoridade de uma lenda concede +6 ARC em combate.",
      modifiers: { ARC: 6 },
    },
  },
  {
    key: "S",
    colorName: "Dourado",
    color: "#FFD84D",
    title: "Herói do Reino",
    description:
      "O maior Rank alcançável pela progressão normal, reservado aos aventureiros mais poderosos e lendários de Wonderland.",
    access: ["Missões S", "Dungeons S", "Eventos mundiais"],
    effect: {
      name: "Bênção dos Cinco Reinos",
      summary: "O reconhecimento dos reinos concede +3 em todos os atributos durante o combate.",
      modifiers: { FOR: 3, DEF: 3, RES: 3, INI: 3, INT: 3, ARC: 3 },
    },
  },
  {
    key: "EX",
    colorName: "Cristal Cósmico",
    color: "#5DEBFF",
    title: "Além da Medição",
    description:
      "Um Rank que não pode ser conquistado por missões. É concedido apenas àqueles cujas ações mudaram o curso da história de Wonderland.",
    access: ["Sem requisitos públicos", "Concedido por feitos únicos", "Reconhecimento narrativo"],
    effect: {
      name: "Ruptura do Destino",
      summary: "Quem ultrapassa a medição recebe +7 em todos os atributos durante o combate.",
      modifiers: { FOR: 7, DEF: 7, RES: 7, INI: 7, INT: 7, ARC: 7 },
    },
  },
] as const;

export const guildTrials = [
  {
    from: "E → D",
    name: "Primeira Expedição",
    description: "Sobreviver a uma missão real, concluir 20 missões Rank E e alcançar o nível 20.",
  },
  {
    from: "D → C",
    name: "Prova dos Quatro Caminhos",
    description:
      "Concluir uma dungeon especial da Guilda, completar 40 missões Rank D e alcançar o nível 35.",
  },
  {
    from: "C → B",
    name: "Caçada ao Chefe",
    description: "Derrotar um chefe Rank B, concluir 70 missões e alcançar o nível 50.",
  },
  {
    from: "B → A",
    name: "Julgamento da Elite",
    description: "Superar uma incursão de elite, concluir 120 missões e alcançar o nível 70.",
  },
  {
    from: "A → S",
    name: "Prova do Reino",
    description: "Derrotar um Chefe Mundial, alcançar o nível 90 e receber aprovação da Guilda.",
  },
  {
    from: "S → EX",
    name: "O Feito Impossível",
    description:
      "Não existe prova pública. O Rank EX é reconhecido apenas quando a própria história muda por causa do personagem.",
  },
] as const;

export type AdventureRank = (typeof adventureRanks)[number]["key"];

export function getAdventureRank(value: string) {
  return adventureRanks.find((rank) => rank.key === value) ?? adventureRanks[0];
}

export function applyAdventureRankEffect(
  attributes: CombatAttributes,
  rank: string,
): CombatAttributes {
  const modifiers = getAdventureRank(rank).effect.modifiers as Partial<CombatAttributes>;
  return Object.fromEntries(
    attributeKeys.map((attribute) => [
      attribute,
      attributes[attribute] + (modifiers[attribute] ?? 0),
    ]),
  ) as CombatAttributes;
}
