import { attributeKeys } from "@/lib/game/schemas";
import type { CombatAttributes } from "@/lib/game/combat";
import type { AdventureRank } from "@/lib/game/ranks";

export type ArenaMode = "training" | "pve" | "pvp";

export const tacticalGrid = { width: 20, height: 14 } as const;

export function getMovementRange(initiative: number) {
  return Math.max(1, Math.min(8, Math.floor(Math.max(0, initiative) / 25)));
}

export const arenaRewards: Record<AdventureRank, { xp: number; wg: number }> = {
  E: { xp: 500, wg: 100 },
  D: { xp: 1000, wg: 250 },
  C: { xp: 2000, wg: 600 },
  B: { xp: 4000, wg: 1500 },
  A: { xp: 8000, wg: 4000 },
  S: { xp: 15000, wg: 10000 },
  EX: { xp: 30000, wg: 25000 },
};

export const arenaMonsters = [
  {
    key: "lobo-cinzento",
    name: "Lobo Cinzento",
    title: "Predador da Mata",
    sigil: "狼",
    imageUrl: "/images/monsters/pve/lobo-cinzento.webp",
    weights: [5, 2, 3, 5, 1, 2],
  },
  {
    key: "golem-runa",
    name: "Golem Rúnico",
    title: "Guardião de Pedra",
    sigil: "岩",
    imageUrl: "/images/monsters/pve/golem-runa.webp",
    weights: [3, 6, 6, 1, 2, 2],
  },
  {
    key: "espectro-gelo",
    name: "Espectro de Gelo",
    title: "Assombração de Oymyakon",
    sigil: "霜",
    imageUrl: "/images/monsters/pve/espectro-gelo.webp",
    weights: [1, 2, 5, 3, 6, 3],
  },
  {
    key: "escorpiao-dourado",
    name: "Escorpião Dourado",
    title: "Caçador de Lesedi",
    sigil: "蠍",
    imageUrl: "/images/monsters/pve/escorpiao-dourado.webp",
    weights: [5, 4, 3, 4, 1, 3],
  },
  {
    key: "sirena-abissal",
    name: "Sirena Abissal",
    title: "Voz Perdida de Namida",
    sigil: "海",
    imageUrl: "/images/monsters/pve/sirena-abissal.webp",
    weights: [1, 2, 4, 4, 5, 5],
  },
  {
    key: "harpia-tempestade",
    name: "Harpia da Tempestade",
    title: "Fera dos Céus",
    sigil: "嵐",
    imageUrl: "/images/monsters/pve/harpia-tempestade.webp",
    weights: [3, 2, 2, 6, 5, 2],
  },
  {
    key: "orc-corrompido",
    name: "Orc Corrompido",
    title: "Saqueador de Guerra",
    sigil: "戦",
    imageUrl: "/images/monsters/pve/orc-corrompido.webp",
    weights: [7, 3, 4, 3, 1, 2],
  },
  {
    key: "aranha-cristal",
    name: "Aranha de Cristal",
    title: "Tecelã Arcana",
    sigil: "晶",
    imageUrl: "/images/monsters/pve/aranha-cristal.webp",
    weights: [2, 3, 4, 5, 4, 4],
  },
  {
    key: "cavaleiro-vazio",
    name: "Cavaleiro do Vazio",
    title: "Sentinela Sem Reino",
    sigil: "虚",
    imageUrl: "/images/monsters/pve/cavaleiro-vazio.webp",
    weights: [4, 5, 5, 2, 3, 2],
  },
  {
    key: "quimera-primordial",
    name: "Quimera Primordial",
    title: "Ameaça Instável",
    sigil: "獣",
    imageUrl: "/images/monsters/pve/quimera-primordial.webp",
    weights: [5, 3, 3, 4, 3, 4],
  },
] as const;

export function buildAdaptiveMonsterAttributes(
  player: CombatAttributes,
  weights: readonly number[],
) {
  const total = attributeKeys.reduce((sum, key) => sum + player[key], 0);
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  const exact = weights.map((weight) => (weight / weightTotal) * total);
  const values = exact.map(Math.floor);
  let remaining = total - values.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; remaining > 0; index += 1, remaining -= 1)
    values[order[index % order.length].index] += 1;
  return Object.fromEntries(
    attributeKeys.map((key, index) => [key, values[index]]),
  ) as CombatAttributes;
}
