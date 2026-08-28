import { describe,expect,it } from "vitest";
import { canManageGuildMissions,isAdministrativeRole } from "@/lib/auth/roles";
import { officialMissionRewards,parseMissionBoard,promotionTrialCatalogSize,regularMissionCatalogSize,regularMissionsPerRankPerKingdom } from "./missions";

describe("mural de missões",()=>{
  it("mantém 100 missões de cada Rank para cada reino",()=>{
    expect(regularMissionsPerRankPerKingdom).toBe(100);
    expect(regularMissionCatalogSize).toBe(4200);
    expect(promotionTrialCatalogSize).toBe(24);
  });

  it("respeita a tabela oficial de recompensas por Rank",()=>{
    expect(officialMissionRewards).toEqual({
      E:{xp:500,wg:100},D:{xp:1000,wg:250},C:{xp:2000,wg:600},B:{xp:4000,wg:1500},
      A:{xp:8000,wg:4000},S:{xp:15000,wg:10000},EX:{xp:30000,wg:25000},
    });
  });

  it("permite liderança gerenciar o mural sem liberar o painel administrativo",()=>{
    expect(canManageGuildMissions("guild_leader")).toBe(true);
    expect(isAdministrativeRole("guild_leader")).toBe(false);
    expect(canManageGuildMissions("admin")).toBe(true);
    expect(canManageGuildMissions("player")).toBe(false);
  });

  it("interpreta contratos e progresso retornados pelo banco",()=>{
    const board=parseMissionBoard({character:{id:"c1",name:"Colten",rank:"E",level:20,kingdom:"aokigahara",imageUrl:null},missions:[{id:"m1",slug:"teste",name:"Patrulha",description:"Uma missão válida",objective:"Patrulhar",rank:"E",kingdom:"aokigahara",minLevel:1,rewardXp:500,rewardGold:100,isRankTrial:false,promotionRank:null}],activeAssignment:null,completedForRank:19,requiredForTrial:20,lockedUntil:null,canManage:false});
    expect(board?.missions).toHaveLength(1);
    expect(board?.completedForRank).toBe(19);
    expect(board?.character.kingdom).toBe("aokigahara");
  });
});
