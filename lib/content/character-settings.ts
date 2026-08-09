import "server-only";

import { attributesSchema } from "@/lib/game/schemas";
import { defaultCharacterRules, type CharacterRules } from "@/lib/game/characters";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCharacterRules(): Promise<CharacterRules> {
  const client = await createServerSupabaseClient();
  if (!client) return defaultCharacterRules;
  const keys = [
    "character.base_attributes",
    "character.distributable_points",
    "character.maximum_slots",
    "progression.maximum_level",
  ];
  const { data } = await client
    .from("v2_game_settings")
    .select("key, value")
    .in("key", keys)
    .eq("status", "published");
  const values = new Map(data?.map((entry) => [entry.key, entry.value]) ?? []);
  const base = attributesSchema.safeParse(values.get("character.base_attributes"));
  const numberValue = (key: string, fallback: number) => {
    const value = values.get(key);
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
  };
  return {
    baseAttributes: base.success ? base.data : defaultCharacterRules.baseAttributes,
    distributablePoints: numberValue("character.distributable_points", 100),
    maximumSlots: numberValue("character.maximum_slots", 3),
    maximumLevel: numberValue("progression.maximum_level", 100),
  };
}
