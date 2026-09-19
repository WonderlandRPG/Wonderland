import { z } from "zod";

export const reworkAttributeKeys = ["FOR", "INT", "DEF", "RES", "HP", "INI"] as const;
export type ReworkAttributeKey = (typeof reworkAttributeKeys)[number];
export type ReworkAttributes = Record<ReworkAttributeKey, number>;
export type GrowthProfile = "aggressive" | "balanced" | "defensive" | "custom";

export const reworkAttributesSchema = z.object({
  FOR: z.number().int().min(0), INT: z.number().int().min(0), DEF: z.number().int().min(0),
  RES: z.number().int().min(0), HP: z.number().int().min(0), INI: z.number().int().min(0),
});
export const growthProfileSchema = z.enum(["aggressive", "balanced", "defensive", "custom"]);
export const reworkDistributableStars = 20;

export const emptyReworkAllocation = (): ReworkAttributes => ({ FOR: 0, INT: 0, DEF: 0, RES: 0, HP: 0, INI: 0 });
export const reworkAttributeTotal = (attributes: ReworkAttributes) => reworkAttributeKeys.reduce((sum, key) => sum + attributes[key], 0);

export function buildReworkPreset(profile: Exclude<GrowthProfile, "custom">, magical = false): ReworkAttributes {
  if (profile === "balanced") return { FOR: 3, INT: 3, DEF: 3, RES: 3, HP: 4, INI: 4 };
  if (profile === "defensive") return { FOR: 1, INT: 1, DEF: 6, RES: 5, HP: 6, INI: 1 };
  return magical
    ? { FOR: 1, INT: 8, DEF: 2, RES: 3, HP: 2, INI: 4 }
    : { FOR: 8, INT: 1, DEF: 3, RES: 2, HP: 2, INI: 4 };
}

export function migrateLegacyAllocation(value: unknown): ReworkAttributes {
  const legacy = z.object({ FOR:z.number().min(0), INT:z.number().min(0), DEF:z.number().min(0), RES:z.number().min(0), INI:z.number().min(0), ARC:z.number().min(0) }).safeParse(value);
  if (!legacy.success) return emptyReworkAllocation();
  const weights = { FOR:legacy.data.FOR, INT:legacy.data.INT, DEF:legacy.data.DEF, RES:legacy.data.RES, HP:legacy.data.ARC, INI:legacy.data.INI };
  const total = Object.values(weights).reduce((sum, item) => sum + item, 0);
  if (!total) return buildReworkPreset("balanced");
  const exact = Object.fromEntries(reworkAttributeKeys.map((key) => [key, weights[key] / total * reworkDistributableStars])) as ReworkAttributes;
  const result = Object.fromEntries(reworkAttributeKeys.map((key) => [key, Math.floor(exact[key])])) as ReworkAttributes;
  let remaining = reworkDistributableStars - reworkAttributeTotal(result);
  const order = [...reworkAttributeKeys].sort((a,b) => exact[b] % 1 - exact[a] % 1);
  for (let index=0; remaining>0; index+=1, remaining-=1) result[order[index % order.length]] += 1;
  return result;
}

export function toLegacyAllocation(value: ReworkAttributes) {
  return { FOR:value.FOR*5, INT:value.INT*5, DEF:value.DEF*5, RES:value.RES*5, ARC:value.HP*5, INI:value.INI*5 };
}

export function calculateReworkSheet(base: ReworkAttributes, allocation: ReworkAttributes, equipment: Partial<ReworkAttributes> = {}) {
  const attributes = Object.fromEntries(reworkAttributeKeys.map((key) => [key, base[key] + allocation[key] + (equipment[key] ?? 0)])) as ReworkAttributes;
  return { attributes, powerTotal: reworkAttributeTotal(attributes) };
}
