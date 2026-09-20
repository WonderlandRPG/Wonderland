import { z } from "zod";
import {
  reworkAttributeKeys,
  type ReworkAttributeKey,
} from "@/lib/game/rework-attributes";

const rawAttributesSchema = z.record(z.string(), z.coerce.number().finite());

export type ItemAttributes = Partial<Record<ReworkAttributeKey, number>>;

export function normalizeItemAttributes(value: unknown): ItemAttributes {
  const parsed = rawAttributesSchema.safeParse(value);
  if (!parsed.success) return {};

  const normalized: ItemAttributes = {};
  for (const key of reworkAttributeKeys) {
    const amount = parsed.data[key];
    if (amount) normalized[key] = amount;
  }

  const legacyArc = parsed.data.ARC ?? 0;
  if (legacyArc) normalized.HP = (normalized.HP ?? 0) + legacyArc;
  return normalized;
}

export function itemPower(attributes: ItemAttributes) {
  return reworkAttributeKeys.reduce((total, key) => total + (attributes[key] ?? 0), 0);
}

export function itemPowerDelta(candidate: ItemAttributes, equipped: ItemAttributes[]) {
  return itemPower(candidate) - equipped.reduce((total, item) => total + itemPower(item), 0);
}

