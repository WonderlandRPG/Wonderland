"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function refresh(characterId: string) {
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath(`/personagens/${characterId}/inventario`);
  revalidatePath("/personagens");
  revalidatePath("/perfil");
}

export async function equipItemAction(characterId: string, inventoryId: string, slot: string) {
  const parsed = z
    .object({
      characterId: z.uuid(),
      inventoryId: z.uuid(),
      slot: z.enum(["weapon", "head", "torso", "hands", "feet", "accessory"]),
    })
    .safeParse({ characterId, inventoryId, slot });
  if (!parsed.success) redirect(`/personagens/${characterId}/inventario?notice=erro`);
  await requireCurrentAccount(`/personagens/${parsed.data.characterId}/inventario`);
  const client = await createServerSupabaseClient();
  if (!client) redirect(`/personagens/${parsed.data.characterId}/inventario?notice=erro`);
  const { error } = await client.rpc("v2_equip_inventory_item", {
    p_inventory_id: parsed.data.inventoryId,
    p_slot: parsed.data.slot,
  });
  if (error) redirect(`/personagens/${parsed.data.characterId}/inventario?notice=erro`);
  refresh(parsed.data.characterId);
  redirect(`/personagens/${parsed.data.characterId}/inventario?notice=equipado`);
}

export async function unequipItemAction(characterId: string, inventoryId: string) {
  const parsed = z
    .object({ characterId: z.uuid(), inventoryId: z.uuid() })
    .safeParse({ characterId, inventoryId });
  if (!parsed.success) redirect(`/personagens/${characterId}/inventario?notice=erro`);
  await requireCurrentAccount(`/personagens/${parsed.data.characterId}/inventario`);
  const client = await createServerSupabaseClient();
  if (!client) redirect(`/personagens/${parsed.data.characterId}/inventario?notice=erro`);
  const { error } = await client.rpc("v2_unequip_inventory_item", {
    p_inventory_id: parsed.data.inventoryId,
  });
  if (error) redirect(`/personagens/${parsed.data.characterId}/inventario?notice=erro`);
  refresh(parsed.data.characterId);
  redirect(`/personagens/${parsed.data.characterId}/inventario?notice=desequipado`);
}
