import type { Json } from "@/lib/db/types";

export const kingdomOffices = ["monarch", "realm_councilor", "war_councilor"] as const;
export type KingdomOffice = (typeof kingdomOffices)[number];
export const kingdomOfficeLabels: Record<KingdomOffice, string> = {
  monarch: "Rei / Rainha",
  realm_councilor: "Conselheiro do Reino",
  war_councilor: "Conselheiro de Guerra",
};
export const kingdomStarCosts = [250_000, 1_000_000, 5_000_000, 25_000_000, 100_000_000] as const;
export const kingdomUpgradeAreas = ["requested", "academy", "market"] as const;
export type KingdomUpgradeArea = (typeof kingdomUpgradeAreas)[number];
export const kingdomUpgradeAreaInfo: Record<
  KingdomUpgradeArea,
  { name: string; description: string }
> = {
  requested: { name: "Reino Requisitado", description: "+10% de XP e WG por estrela" },
  academy: { name: "Academia Real", description: "+5% de XP por estrela" },
  market: { name: "Mercado Próspero", description: "+5% de WG por estrela" },
};
export type KingdomAreaState = {
  key: KingdomUpgradeArea;
  stars: number;
  bonusPercent: number;
  nextStarCost: number | null;
};
export type KingdomLeader = {
  office: KingdomOffice;
  characterId: string;
  userId: string;
  name: string;
  level: number;
  rank: string;
  imageUrl: string | null;
};
export type CurrentKingdom = {
  kingdom: string;
  characterId: string;
  characterGold: number;
  areas: KingdomAreaState[];
  ownOffice: KingdomOffice | null;
  leadership: KingdomLeader[];
};
const record = (value: Json | null): Record<string, Json | undefined> =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const text = (value: Json | undefined) => (typeof value === "string" ? value : "");
const number = (value: Json | undefined) =>
  typeof value === "number" ? value : Number(value) || 0;
export function parseCurrentKingdom(value: Json | null): CurrentKingdom | null {
  const root = record(value);
  const kingdom = text(root.kingdom);
  const characterId = text(root.characterId);
  if (!kingdom || !characterId) return null;
  const leadership = Array.isArray(root.leadership)
    ? root.leadership
        .map((entry) => {
          const row = record(entry);
          return {
            office: text(row.office) as KingdomOffice,
            characterId: text(row.characterId),
            userId: text(row.userId),
            name: text(row.name),
            level: number(row.level),
            rank: text(row.rank),
            imageUrl: text(row.imageUrl) || null,
          };
        })
        .filter((entry) => kingdomOffices.includes(entry.office) && entry.characterId)
    : [];
  const office = text(root.ownOffice);
  const areas = Array.isArray(root.areas)
    ? root.areas
        .map((entry) => {
          const row = record(entry);
          return {
            key: text(row.key) as KingdomUpgradeArea,
            stars: number(row.stars),
            bonusPercent: number(row.bonusPercent),
            nextStarCost: row.nextStarCost === null ? null : number(row.nextStarCost),
          };
        })
        .filter((area) => kingdomUpgradeAreas.includes(area.key))
    : [];
  return {
    kingdom,
    characterId,
    characterGold: number(root.characterGold),
    areas,
    ownOffice: kingdomOffices.includes(office as KingdomOffice) ? (office as KingdomOffice) : null,
    leadership,
  };
}
