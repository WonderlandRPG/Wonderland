import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  reworkClassSchema,
  reworkClasses,
  reworkRaceSchema,
  reworkRaces,
  type ReworkClass,
  type ReworkRace,
} from "@/lib/game/rework-catalog";

const category = "rework_classes_races_v2";

async function overrides() {
  const client = await createServerSupabaseClient();
  if (!client) return new Map<string, unknown>();
  const { data, error } = await client
    .from("v2_game_settings")
    .select("key,value")
    .eq("category", category)
    .eq("status", "published");
  if (error) return new Map<string, unknown>();
  return new Map((data ?? []).map((entry) => [entry.key, entry.value]));
}

export async function getReworkClasses(): Promise<ReworkClass[]> {
  const values = await overrides();
  return reworkClasses.map((entry) => {
    const parsed = reworkClassSchema.safeParse(values.get(`rework.class.${entry.id}`));
    return parsed.success ? parsed.data : entry;
  });
}

export async function getReworkRaces(): Promise<ReworkRace[]> {
  const values = await overrides();
  return reworkRaces.map((entry) => {
    const parsed = reworkRaceSchema.safeParse(values.get(`rework.race.${entry.id}`));
    return parsed.success ? parsed.data : entry;
  });
}

export const reworkCatalogCategory = category;
