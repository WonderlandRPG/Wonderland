import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  themeDefinitions,
  type ThemeAvailability,
  type ThemeName,
} from "@/lib/content/theme-definitions";

export { themeDefinitions } from "@/lib/content/theme-definitions";

const defaults: ThemeAvailability = {
  classic: true,
  accessible: true,
  christmas: false,
  halloween: false,
};

export type ThemeConfiguration = { availability: ThemeAvailability; defaultTheme: ThemeName };

export async function getThemeAvailability(): Promise<ThemeAvailability> {
  return (await getThemeConfiguration()).availability;
}

export async function getThemeConfiguration(): Promise<ThemeConfiguration> {
  const client = await createServerSupabaseClient();
  if (!client) return { availability: defaults, defaultTheme: "classic" };
  const { data: rows } = await client
    .from("v2_game_settings")
    .select("key,value")
    .in("key", ["appearance.available_themes", "appearance.default_theme"])
    .eq("status", "published");
  const data = rows?.find((row) => row.key === "appearance.available_themes");
  const value = data?.value;
  const availability =
    !value || typeof value !== "object" || Array.isArray(value)
      ? defaults
      : {
          classic: value.classic !== false,
          accessible: value.accessible !== false,
          christmas: value.christmas === true,
          halloween: value.halloween === true,
        };
  const defaultRow = rows?.find((row) => row.key === "appearance.default_theme");
  const candidate = typeof defaultRow?.value === "string" ? defaultRow.value : "classic";
  const valid = themeDefinitions.some((theme) => theme.key === candidate);
  const defaultTheme =
    valid && availability[candidate as ThemeName] ? (candidate as ThemeName) : "classic";
  return { availability, defaultTheme };
}
