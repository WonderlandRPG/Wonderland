import type { Json } from "@/lib/db/types";

export const kingdomOffices = ["monarch", "realm_councilor", "war_councilor"] as const;
export type KingdomOffice = (typeof kingdomOffices)[number];
export const kingdomOfficeLabels: Record<KingdomOffice, string> = {
  monarch: "Rei / Rainha",
  realm_councilor: "Conselheiro do Reino",
  war_councilor: "Conselheiro de Guerra",
};
export const kingdomStarCosts = [250_000, 1_000_000, 5_000_000, 25_000_000, 100_000_000] as const;
export const kingdomUpgradeAreas = ["requested", "market", "defense", "army"] as const;
export type KingdomUpgradeArea = (typeof kingdomUpgradeAreas)[number];
export const kingdomUpgradeAreaInfo: Record<
  KingdomUpgradeArea,
  { name: string; description: string }
> = {
  requested: { name: "Reino Requisitado", description: "+10% de XP e WG por estrela" },
  market: { name: "Mercado Próspero", description: "-3% no preço total dos itens da Loja por estrela" },
  defense: { name: "Defesas", description: "Fortalece a proteção do reino e soma pontos durante guerras" },
  army: { name: "Exército", description: "Fortalece o poder militar e soma pontos durante guerras" },
};
export type KingdomAreaState = {
  key: KingdomUpgradeArea;
  stars: number;
  bonusPercent: number;
  nextStarCost: number | null;
};
export type KingdomWar = { id: string; attacker: string; defender: string; status: string; declaredAt: string; winner: string | null; loser: string | null };
export type KingdomPenalty = { until: string; rewardPercent: number; shopPercent: number };
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
  wars: KingdomWar[];
  penalty: KingdomPenalty | null;
};
export const kingdomResourceInfo = {
  infrastructure: { name: "Infraestrutura", description: "Estradas, muralhas, oficinas e materiais de construção." },
  provisions: { name: "Provisões", description: "Alimentos e reservas essenciais para os moradores." },
  arsenal: { name: "Arsenal", description: "Minérios, armas e armaduras que sustentam a defesa do reino." },
  livestock: { name: "Criação", description: "Animais de carga, montaria e produção rural." },
} as const;
export type KingdomResourceKey = keyof typeof kingdomResourceInfo;
export type KingdomExpansion = {
  treasury: number; weeklyLimit: number; ownOffice: KingdomOffice | null;
  salaries: Record<KingdomOffice, number>;
  resources: Array<{ key: KingdomResourceKey; value: number; drain: number; cost: number; penalty: string }>;
  peaceProposals: Array<{ id:string; proposer:string; recipient:string; status:string; expiresAt:string }>;
  peaceAgreements: Array<{ id:string; kingdom:string; createdAt:string }>;
  wars: Array<{ id:string; attacker:string; defender:string; expiresAt:string }>;
  votes: Array<{ id:string; office:KingdomOffice; expiresAt:string; yes:number; no:number; residents:number; ownChoice:boolean|null }>;
};
const record = (value: Json | null | undefined): Record<string, Json | undefined> =>
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
  const wars = Array.isArray(root.wars) ? root.wars.map((entry) => { const row = record(entry); return { id: text(row.id), attacker: text(row.attacker), defender: text(row.defender), status: text(row.status), declaredAt: text(row.declaredAt), winner: text(row.winner) || null, loser: text(row.loser) || null }; }).filter((war) => war.id) : [];
  const penaltyRow = record(root.penalty);
  const penalty = text(penaltyRow.until) ? { until: text(penaltyRow.until), rewardPercent: number(penaltyRow.rewardPercent), shopPercent: number(penaltyRow.shopPercent) } : null;
  return {
    kingdom,
    characterId,
    characterGold: number(root.characterGold),
    areas,
    ownOffice: kingdomOffices.includes(office as KingdomOffice) ? (office as KingdomOffice) : null,
    leadership,
    wars,
    penalty,
  };
}
export function parseKingdomExpansion(value: Json | null): KingdomExpansion | null {
  const root=record(value); if(!Array.isArray(root.resources))return null;
  const salariesRow=record(root.salaries);
  return {
    treasury:number(root.treasury),weeklyLimit:number(root.weeklyLimit),ownOffice:(text(root.ownOffice)||null) as KingdomOffice|null,
    salaries:{monarch:number(salariesRow.monarch),realm_councilor:number(salariesRow.realm_councilor),war_councilor:number(salariesRow.war_councilor)},
    resources:root.resources.map(entry=>{const r=record(entry);return{key:text(r.key) as KingdomResourceKey,value:number(r.value),drain:number(r.drain),cost:number(r.cost),penalty:text(r.penalty)}}).filter(r=>r.key in kingdomResourceInfo),
    peaceProposals:Array.isArray(root.peaceProposals)?root.peaceProposals.map(entry=>{const r=record(entry);return{id:text(r.id),proposer:text(r.proposer),recipient:text(r.recipient),status:text(r.status),expiresAt:text(r.expiresAt)}}):[],
    peaceAgreements:Array.isArray(root.peaceAgreements)?root.peaceAgreements.map(entry=>{const r=record(entry);return{id:text(r.id),kingdom:text(r.kingdom),createdAt:text(r.createdAt)}}):[],
    wars:Array.isArray(root.wars)?root.wars.map(entry=>{const r=record(entry);return{id:text(r.id),attacker:text(r.attacker),defender:text(r.defender),expiresAt:text(r.expiresAt)}}):[],
    votes:Array.isArray(root.votes)?root.votes.map(entry=>{const r=record(entry);return{id:text(r.id),office:text(r.office) as KingdomOffice,expiresAt:text(r.expiresAt),yes:number(r.yes),no:number(r.no),residents:number(r.residents),ownChoice:typeof r.ownChoice==='boolean'?r.ownChoice:null}}):[],
  };
}
