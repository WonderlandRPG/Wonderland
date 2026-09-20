import type { AdventureRank } from "@/lib/game/ranks";

export const arenaModes = ["pve", "pvp"] as const;
export type ArenaMode = (typeof arenaModes)[number];

export const arenaRewards: Record<AdventureRank, { xp: number; wg: number }> = {
  E: { xp: 500, wg: 100 },
  D: { xp: 1000, wg: 250 },
  C: { xp: 2000, wg: 600 },
  B: { xp: 4000, wg: 1500 },
  A: { xp: 8000, wg: 4000 },
  S: { xp: 15000, wg: 10000 },
  EX: { xp: 30000, wg: 25000 },
};
