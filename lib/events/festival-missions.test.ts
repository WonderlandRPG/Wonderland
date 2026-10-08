import { describe, expect, it } from "vitest";
import catalog from "./festival-missions.json";
import { missionKingdoms, parseManagedMissions, parseMissionBoard } from "@/lib/game/missions";

describe("preparativos de Noites Apavorantes", () => {
  it("cobre todos os dias de 8 a 25 com 18 pedidos próprios para cada reino", () => {
    expect(catalog).toHaveLength(108);
    for (const kingdom of missionKingdoms) {
      const missions = catalog.filter((mission) => mission.kingdom === kingdom);
      expect(missions.map((mission) => mission.day)).toEqual(
        Array.from({ length: 18 }, (_, index) => `2026-10-${String(index + 8).padStart(2, "0")}`),
      );
      expect(new Set(missions.map((mission) => mission.name)).size).toBe(18);
      for (const mission of missions) {
        expect(mission.name.length).toBeLessThanOrEqual(100);
        expect(mission.description.length).toBeGreaterThanOrEqual(10);
        expect(mission.description.length).toBeLessThanOrEqual(1200);
        expect(mission.objective.length).toBeLessThanOrEqual(300);
      }
    }
  });

  it("mantém o progresso do festival separado dos contratos de rank", () => {
    const board = parseMissionBoard({
      character: { id: "character", rank: "S", kingdom: "darkya" },
      missions: [],
      completedForRank: 3,
      festival: {
        completedCount: 7,
        totalMissions: 18,
        releasedCount: 8,
        candyBalance: 70,
        isActive: true,
        endsOn: "2026-10-31",
        nextReleaseDate: null,
        mission: {
          id: "festival",
          eventDay: "2026-10-15",
          name: "Passagem sem lama",
          description: "O terreno entre as barracas está dificultando o transporte.",
          objective: "Espalhe 5 cargas de cascalho.",
          rewardXp: 30000,
          rewardCandies: 10,
        },
      },
    });
    expect(board?.completedForRank).toBe(3);
    expect(board?.missions).toEqual([]);
    expect(board?.festival?.mission).toMatchObject({
      eventDay: "2026-10-15",
      rewardXp: 30000,
      rewardCandies: 10,
    });
    expect(board?.festival?.candyBalance).toBe(70);
  });

  it("não inventa um pedido quando o próximo dia ainda está bloqueado", () => {
    const board = parseMissionBoard({
      character: { id: "character" },
      festival: {
        totalMissions: 18,
        completedCount: 1,
        releasedCount: 1,
        nextReleaseDate: "2026-10-09",
        mission: null,
        isActive: true,
      },
    });
    expect(board?.festival?.mission).toBeNull();
    expect(board?.festival?.nextReleaseDate).toBe("2026-10-09");
    expect(parseMissionBoard({ character: { id: "legacy" } })?.festival).toBeNull();
  });

  it("mostra ao responsável os doces e o XP calculado para o jogador", () => {
    const managed = parseManagedMissions([
      {
        assignmentId: "assignment",
        eventDay: "2026-10-08",
        characterRank: "EX",
        missionRank: "EX",
        rewardXp: 60000,
        rewardGold: 0,
        rewardCandies: 10,
      },
    ]);
    expect(managed[0]).toMatchObject({
      eventDay: "2026-10-08",
      rewardXp: 60000,
      rewardGold: 0,
      rewardCandies: 10,
    });
  });
});
