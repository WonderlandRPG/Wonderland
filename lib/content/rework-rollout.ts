import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  defaultReworkRolloutState,
  parseReworkRolloutState,
  reworkRolloutModules,
} from "@/lib/game/rework-rollout";

export async function getReworkRolloutState() {
  const client = await createServerSupabaseClient();
  if (!client) return defaultReworkRolloutState;

  const { data, error } = await client
    .from("v2_game_settings")
    .select("key,value")
    .in(
      "key",
      reworkRolloutModules.map((module) => module.settingKey),
    )
    .eq("status", "published");

  if (error) return defaultReworkRolloutState;
  return parseReworkRolloutState(data);
}
