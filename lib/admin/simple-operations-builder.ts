import { z } from "zod";
import { missionKingdoms, missionRanks } from "@/lib/game/missions";

export const simpleMissionDraftSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1200),
  objective: z.string().trim().min(3).max(300),
  kingdom: z.enum(missionKingdoms),
  rank: z.enum(missionRanks),
  minLevel: z.number().int().min(1).max(100),
  isRankTrial: z.boolean(),
  promotionRank: z.enum(["D", "C", "B", "A"]).nullable(),
});
export type SimpleMissionDraft = z.infer<typeof simpleMissionDraftSchema>;
export const simpleMissionDefaults = (): SimpleMissionDraft => ({
  name: "Nova missão",
  description: "Descreva a situação, o desafio e o contexto desta missão em Wonderland.",
  objective: "Descreva o objetivo principal.",
  kingdom: "aokigahara",
  rank: "E",
  minLevel: 1,
  isRankTrial: false,
  promotionRank: null,
});

export const balanceUpdateSchema = z.object({
  key: z.string().min(1).max(120),
  revision: z.number().int().min(1),
  valueText: z.string().trim().min(1).max(10000),
});
export type BalanceUpdateDraft = z.infer<typeof balanceUpdateSchema>;

export function parseBalanceValue(valueText: string) {
  try {
    return { success: true as const, value: JSON.parse(valueText) as unknown };
  } catch {
    return { success: false as const, message: "Use um valor JSON válido. Exemplos: 100, true, \"texto\" ou {\"FOR\":20}." };
  }
}
