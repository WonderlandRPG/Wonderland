import "server-only";

import type { Database } from "@/lib/db/types";
import { parseItemPayload, type EquipmentSlot, type ItemPayload } from "@/lib/game/items";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type InventoryRow = Database["public"]["Tables"]["v2_character_inventory"]["Row"];

export interface InventoryEntry extends InventoryRow {
  item: { id: string; name: string; payload: ItemPayload };
  equippedSlot: EquipmentSlot | null;
}

export async function getCharacterInventory(characterId: string): Promise<InventoryEntry[]> {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("v2_character_inventory")
    .select("*")
    .eq("character_id", characterId)
    .order("created_at");
  if (error) {
    if (error.code === "42P01") return [];
    throw new Error("Não foi possível carregar o inventário.");
  }
  const ids = [...new Set((data ?? []).map((entry) => entry.item_id))];
  if (ids.length === 0) return [];
  const { data: items } = await client
    .from("v2_content")
    .select("id, name, payload")
    .in("id", ids)
    .eq("content_type", "item");
  const itemMap = new Map((items ?? []).map((entry) => [entry.id, entry]));
  return (data ?? []).flatMap((entry) => {
    const itemRow = itemMap.get(entry.item_id);
    if (!itemRow) return [];
    const payload = parseItemPayload(itemRow.payload);
    if (!payload.success) return [];
    return [
      {
        ...entry,
        equippedSlot: entry.equipped_slot as EquipmentSlot | null,
        item: { id: itemRow.id, name: itemRow.name, payload: payload.data },
      },
    ];
  });
}
