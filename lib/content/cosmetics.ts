import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CosmeticCatalogItem = {
  id: string; key: string; name: string; description: string; slot: "card" | "aura" | "border";
  rarity: string; collectionName: string; priceCents: number | null; artworkUrl: string | null;
  active: boolean; grantOnly: boolean; owned?: boolean;
};

export async function getVisibleCosmetics(characterId?: string): Promise<CosmeticCatalogItem[]> {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const [{ data }, ownedResult] = await Promise.all([
    client.from("v2_cosmetics").select("*").order("sort_order"),
    characterId ? client.from("v2_character_cosmetics").select("cosmetic_id").eq("character_id", characterId) : Promise.resolve({ data: [] }),
  ]);
  const owned = new Set((ownedResult.data ?? []).map((row) => row.cosmetic_id));
  return (data ?? []).map((row) => ({ id: row.id, key: row.key, name: row.name, description: row.description, slot: row.slot, rarity: row.rarity, collectionName: row.collection_name, priceCents: row.price_cents, artworkUrl: row.artwork_url, active: row.active, grantOnly: row.grant_only, owned: owned.has(row.id) }));
}

export async function getOwnedCosmetics(characterId: string) {
  return (await getVisibleCosmetics(characterId)).filter((item) => item.owned);
}
