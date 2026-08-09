"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  inventoryId: z.uuid(),
  slot: z.enum(["weapon", "shield", "head", "torso", "hands", "feet"]),
});

export async function equipItemAction(characterId: string, formData: FormData) {
  await requireCurrentAccount(`/personagens/${characterId}`);
  const parsed = schema.safeParse({
    inventoryId: formData.get("inventoryId"),
    slot: formData.get("slot"),
  });
  if (!parsed.success) return;
  const client = await createServerSupabaseClient();
  if (client)
    await client.rpc("v2_equip_inventory_item", {
      p_inventory_id: parsed.data.inventoryId,
      p_slot: parsed.data.slot,
    });
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/arena");
}

export async function unequipItemAction(characterId: string, formData: FormData) {
  await requireCurrentAccount(`/personagens/${characterId}`);
  const inventoryId = z.uuid().safeParse(formData.get("inventoryId"));
  if (!inventoryId.success) return;
  const client = await createServerSupabaseClient();
  if (client) await client.rpc("v2_unequip_inventory_item", { p_inventory_id: inventoryId.data });
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/arena");
}
