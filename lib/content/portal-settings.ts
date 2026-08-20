import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const defaultPortalHeadline = {
  seasonLabel: "Temporada inaugural",
  firstLine: "O novo Wonderland está chegando.",
  secondLine: "Prepare-se para o lançamento.",
};

export async function getPortalHeadline() {
  const client = await createServerSupabaseClient();
  if (!client) return defaultPortalHeadline;

  const { data } = await client
    .from("v2_game_settings")
    .select("value")
    .eq("key", "portal.launch_headline")
    .eq("status", "published")
    .maybeSingle();

  const value = data?.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultPortalHeadline;

  const seasonLabel = typeof value.seasonLabel === "string" ? value.seasonLabel.trim() : "";
  const firstLine = typeof value.firstLine === "string" ? value.firstLine.trim() : "";
  const secondLine = typeof value.secondLine === "string" ? value.secondLine.trim() : "";

  return {
    seasonLabel: seasonLabel || defaultPortalHeadline.seasonLabel,
    firstLine: firstLine || defaultPortalHeadline.firstLine,
    secondLine: secondLine || defaultPortalHeadline.secondLine,
  };
}
