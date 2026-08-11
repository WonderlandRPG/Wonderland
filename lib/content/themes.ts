import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ThemeAvailability } from "@/lib/content/theme-definitions";

export { themeDefinitions } from "@/lib/content/theme-definitions";

const defaults: ThemeAvailability = { classic: true, accessible: true, christmas: false };

export async function getThemeAvailability(): Promise<ThemeAvailability> {
  const client = await createServerSupabaseClient();
  if (!client) return defaults;
  const { data } = await client
    .from("v2_game_settings")
    .select("value")
    .eq("key", "appearance.available_themes")
    .eq("status", "published")
    .maybeSingle();
  const value = data?.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  return {
    classic: value.classic !== false,
    accessible: value.accessible !== false,
    christmas: value.christmas === true,
  };
}
