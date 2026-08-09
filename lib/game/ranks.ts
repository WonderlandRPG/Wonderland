export const adventureRanks = [
  {
    key: "E",
    colorName: "Cinza",
    color: "#7D8790",
    description:
      "O primeiro Rank de Wonderland. Representa aventureiros iniciantes que estão começando a enfrentar os perigos do mundo.",
  },
  {
    key: "D",
    colorName: "Verde",
    color: "#4ADE80",
    description:
      "Aventureiros que já adquiriram alguma experiência e estão preparados para desafios além das missões mais básicas.",
  },
  {
    key: "C",
    colorName: "Ciano",
    color: "#22D3EE",
    description:
      "Aventureiros experientes, capazes de enfrentar ameaças consideráveis e assumir missões de maior responsabilidade.",
  },
  {
    key: "B",
    colorName: "Azul Safira",
    color: "#3B82F6",
    description:
      "Aventureiros poderosos que já se destacam entre os demais e são preparados para missões de alto risco.",
  },
  {
    key: "A",
    colorName: "Roxo Ametista",
    color: "#A855F7",
    description:
      "Aventureiros excepcionais, reconhecidos por grandes feitos e capazes de enfrentar ameaças que colocam regiões em perigo.",
  },
  {
    key: "S",
    colorName: "Dourado",
    color: "#FFD84D",
    description:
      "O maior Rank alcançável pela progressão normal, reservado aos aventureiros mais poderosos e lendários de Wonderland.",
  },
  {
    key: "EX",
    colorName: "Cristal Cósmico",
    color: "#5DEBFF",
    description:
      "Um Rank que não pode ser conquistado por missões. É concedido apenas àqueles cujas ações mudaram o curso da história de Wonderland.",
  },
] as const;

export type AdventureRank = (typeof adventureRanks)[number]["key"];

export function getAdventureRank(value: string) {
  return adventureRanks.find((rank) => rank.key === value) ?? adventureRanks[0];
}
