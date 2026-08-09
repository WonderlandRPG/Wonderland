import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getRanking() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client.rpc("v2_character_ranking", {});
  return (data ?? []).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export async function getShopItems() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from("v2_shop_items")
    .select(
      "id, slug, name, description, category, price, image_url, slot, rarity, attributes, special_effects, two_handed, sort_order",
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
    notes: Array.isArray(entry.notes)
      ? entry.notes.filter((note): note is string => typeof note === "string")
      : [],
  }));
}
