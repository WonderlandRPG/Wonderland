import "server-only";

import { combatRulesSchema, defaultCombatRules, type CombatRules } from "@/lib/game/combat";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCombatRules(): Promise<CombatRules> {
  const client = await createServerSupabaseClient();
  if (!client) return defaultCombatRules;
  const { data } = await client
    .from("v2_game_settings")
    .select("value")
    .eq("key", "combat.rules")
    .eq("status", "published")
    .maybeSingle();
  const parsed = combatRulesSchema.safeParse(data?.value);
  return parsed.success ? parsed.data : defaultCombatRules;
}
