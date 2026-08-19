import { describe, expect, it } from "vitest";
import { balanceUpdateSchema, parseBalanceValue, simpleMissionDefaults, simpleMissionDraftSchema } from "./simple-operations-builder";

describe("admin operations studio", () => {
  it("validates a guided mission and its editable state", () => {
    const mission = simpleMissionDefaults();
    mission.name = "Ecos na Floresta";
    mission.rank = "D";
    mission.active = false;
    expect(simpleMissionDraftSchema.safeParse(mission).success).toBe(true);
  });

  it("requires a valid promoted rank when a rank trial is authored", () => {
    const mission = { ...simpleMissionDefaults(), isRankTrial: true, promotionRank: "A" as const };
    expect(simpleMissionDraftSchema.safeParse(mission).success).toBe(true);
    expect(simpleMissionDraftSchema.safeParse({ ...mission, promotionRank: "EX" }).success).toBe(false);
  });

  it("parses scalar and object game setting values safely", () => {
    expect(parseBalanceValue("100")).toEqual({ success: true, value: 100 });
    expect(parseBalanceValue('{"FOR":20,"DEF":20}')).toEqual({ success: true, value: { FOR: 20, DEF: 20 } });
    expect(parseBalanceValue("not-json").success).toBe(false);
    expect(balanceUpdateSchema.safeParse({ key: "character.maximum_slots", revision: 2, valueText: "3" }).success).toBe(true);
  });
});
