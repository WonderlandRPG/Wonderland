export const adventureRanks = [
  {
    key: "E",
    colorName: "Cinza",
    color: "#7D8790",
    title: "Iniciante",
    description:
      "O primeiro Rank de Wonderland. Representa aventureiros iniciantes que estão começando a enfrentar os perigos do mundo.",
    access: ["Missões E", "Dungeons E", "Recompensas e XP básicos"],
    atmosphere: "Poeira de estrada",
    effectDescription: "Uma névoa de poeira e fagulhas cinzentas acompanha o retrato do aventureiro.",
  },
  {
    key: "D",
    colorName: "Verde",
    color: "#4ADE80",
    title: "Explorador",
    description:
      "Aventureiros que já adquiriram alguma experiência e estão preparados para desafios além das missões mais básicas.",
    access: ["Missões D", "Dungeons D", "XP superior ao Rank E"],
    atmosphere: "Folhas da fronteira",
    effectDescription: "Folhas e partículas verdes percorrem a moldura como o vento das fronteiras.",
  },
  {
    key: "C",
    colorName: "Ciano",
    color: "#22D3EE",
    title: "Veterano",
    description:
      "Aventureiros experientes, capazes de enfrentar ameaças consideráveis e assumir missões de maior responsabilidade.",
    access: ["Missões C", "Dungeons C", "Maior variedade de recompensas"],
    atmosphere: "Orbes arcanos",
    effectDescription: "Pequenos orbes cianos orbitam o personagem e pulsam com energia arcana.",
  },
  {
    key: "B",
    colorName: "Azul Safira",
    color: "#3B82F6",
    title: "Elite",
    description:
      "Aventureiros poderosos que já se destacam entre os demais e são preparados para missões de alto risco.",
    access: ["Missões B", "Dungeons B", "Chefes de elite"],
    atmosphere: "Chuva de aço",
    effectDescription: "Reflexos safira atravessam a moldura como lâminas e fragmentos de aço.",
  },
  {
    key: "A",
    colorName: "Roxo Ametista",
    color: "#A855F7",
    title: "Lenda Viva",
    description:
      "Aventureiros excepcionais, reconhecidos por grandes feitos e capazes de enfrentar ameaças que colocam regiões em perigo.",
    access: ["Missões A", "Dungeons A", "Incursões de alto risco"],
    atmosphere: "Runas ametistas",
    effectDescription: "Runas ametistas despertam ao redor do retrato em um círculo mágico vivo.",
  },
  {
    key: "S",
    colorName: "Dourado",
    color: "#FFD84D",
    title: "Herói do Reino",
    description:
      "O maior Rank alcançável pela progressão normal, reservado aos aventureiros mais poderosos e lendários de Wonderland.",
    access: ["Missões S", "Dungeons S", "Eventos mundiais"],
    atmosphere: "Constelação dourada",
    effectDescription: "Estrelas douradas cintilam e formam uma constelação ao redor do herói.",
  },
  {
    key: "EX",
    colorName: "Cristal Cósmico",
    color: "#5DEBFF",
    title: "Além da Medição",
    description:
      "Um Rank que não pode ser conquistado por missões. É concedido apenas àqueles cujas ações mudaram o curso da história de Wonderland.",
    access: ["Sem requisitos públicos", "Concedido por feitos únicos", "Reconhecimento narrativo"],
    atmosphere: "Fendas do destino",
    effectDescription: "Fendas cristalinas rasgam o espaço ao redor do personagem com energia ciano-cósmica.",
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