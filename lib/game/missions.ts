import type { Json } from "@/lib/db/types";

export const missionRanks = ["E", "D", "C", "B"] as const;
export const missionKingdoms = ["aokigahara", "darkya", "oymyakon", "lesedi", "namida", "skypiece"] as const;
export const officialMissionRewards = {
  E:{xp:500,wg:100},D:{xp:1000,wg:250},C:{xp:2000,wg:600},B:{xp:4000,wg:1500},
  A:{xp:8000,wg:4000},S:{xp:15000,wg:10000},EX:{xp:30000,wg:25000},
} as const;
export const regularMissionsPerRankPerKingdom = 100;
export const regularMissionCatalogSize = missionRanks.length * missionKingdoms.length * regularMissionsPerRankPerKingdom;
export const promotionTrialCatalogSize = missionRanks.length * missionKingdoms.length;

export const kingdomMissionNames: Record<string,string> = {
  aokigahara:"Aokigahara",darkya:"Darkya",oymyakon:"Oymyakon",lesedi:"Lesedi",namida:"Namida",skypiece:"Skypiece",
};

export type MissionCard = { id:string; slug:string; name:string; description:string; objective:string; rank:string; kingdom:string; minLevel:number; rewardXp:number; rewardGold:number; isRankTrial:boolean; promotionRank:string|null };
export type MissionAssignment = { id:string; missionId:string; name:string; rank:string; kingdom:string; objective:string; acceptedAt:string; isRankTrial:boolean };
export type MissionBoard = { character:{id:string;name:string;rank:string;level:number;kingdom:string;imageUrl:string|null}; missions:MissionCard[]; activeAssignment:MissionAssignment|null; completedForRank:number; requiredForTrial:number|null; lockedUntil:string|null; canManage:boolean };

const record=(value:unknown):Record<string,unknown>=>value && typeof value==="object" && !Array.isArray(value)?value as Record<string,unknown>:{};
const text=(value:unknown)=>typeof value==="string"?value:"";
const number=(value:unknown)=>Number.isFinite(Number(value))?Number(value):0;

export function parseMissionBoard(value: Json | null): MissionBoard | null {
  const root=record(value),character=record(root.character);
  if(!text(character.id)) return null;
  const missions=Array.isArray(root.missions)?root.missions.map((entry)=>{const row=record(entry);return {id:text(row.id),slug:text(row.slug),name:text(row.name),description:text(row.description),objective:text(row.objective),rank:text(row.rank),kingdom:text(row.kingdom),minLevel:number(row.minLevel),rewardXp:number(row.rewardXp),rewardGold:number(row.rewardGold),isRankTrial:Boolean(row.isRankTrial),promotionRank:text(row.promotionRank)||null};}).filter(mission=>mission.id):[];
  const rawAssignment=record(root.activeAssignment);
  return { character:{id:text(character.id),name:text(character.name),rank:text(character.rank),level:number(character.level),kingdom:text(character.kingdom),imageUrl:text(character.imageUrl)||null},missions,activeAssignment:text(rawAssignment.id)?{id:text(rawAssignment.id),missionId:text(rawAssignment.missionId),name:text(rawAssignment.name),rank:text(rawAssignment.rank),kingdom:text(rawAssignment.kingdom),objective:text(rawAssignment.objective),acceptedAt:text(rawAssignment.acceptedAt),isRankTrial:Boolean(rawAssignment.isRankTrial)}:null,completedForRank:number(root.completedForRank),requiredForTrial:root.requiredForTrial===null?null:number(root.requiredForTrial),lockedUntil:text(root.lockedUntil)||null,canManage:Boolean(root.canManage) };
}

export type ManagedMission={assignmentId:string;characterName:string;characterRank:string;characterLevel:number;missionName:string;missionRank:string;kingdom:string;acceptedAt:string;rewardXp:number;rewardGold:number;isRankTrial:boolean};
export function parseManagedMissions(value:Json|null):ManagedMission[]{return Array.isArray(value)?value.map(entry=>{const row=record(entry);return {assignmentId:text(row.assignmentId),characterName:text(row.characterName),characterRank:text(row.characterRank),characterLevel:number(row.characterLevel),missionName:text(row.missionName),missionRank:text(row.missionRank),kingdom:text(row.kingdom),acceptedAt:text(row.acceptedAt),rewardXp:number(row.rewardXp),rewardGold:number(row.rewardGold),isRankTrial:Boolean(row.isRankTrial)};}).filter(row=>row.assignmentId):[];}
