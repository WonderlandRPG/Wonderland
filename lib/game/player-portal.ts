import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseUpdateBlocks } from "@/lib/game/update-content";

export async function getRanking() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client.rpc("v2_character_ranking", {});
  return (data ?? []).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export type RankingEntry = Awaited<ReturnType<typeof getRanking>>[number];

export async function getPvpRanking() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client.rpc("v2_pvp_ranking", {});
  return (data ?? []).map((row, index) => ({ ...row, position: index + 1 }));
}

export type PvpRankingEntry = Awaited<ReturnType<typeof getPvpRanking>>[number];

export async function getPvpHistory(characterId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client.rpc("v2_my_pvp_history", { p_character_id: characterId });
  return data ?? [];
}

export async function getShopItems() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from("v2_shop_items")
    .select(
      "id, slug, name, description, category, price, image_url, slot, rarity, attributes, special_effects, two_handed, sort_order, build_key, build_name, recommended_classes",
    )
    .eq("active", true)
    .order("category")
    .order("sort_order");
  return data ?? [];
}

export async function getPortalEvents() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client.from("v2_events").select("*").eq("active", true).order("starts_at");
  return data ?? [];
}

export async function getPortalUpdates() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from("v2_updates")
    .select("*")
    .eq("active", true)
    .order("published_on", { ascending: false });
  return (data ?? []).map((entry) => ({
    ...entry,
    notes: parseUpdateBlocks(entry.notes),
  }));
}

export async function getRecentPortalUpdates(limit = 3) {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from("v2_updates")
    .select("id, version, title, notes, published_on")
    .eq("active", true)
    .order("published_on", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((entry) => ({
    ...entry,
    notes: parseUpdateBlocks(entry.notes),
  }));
}
