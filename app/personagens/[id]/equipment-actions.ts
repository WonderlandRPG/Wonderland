"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { equipmentSlots, type EquipmentSlot } from "@/lib/game/equipment";
import type { GameActionResult } from "@/lib/game/action-result";

const fail = (message: string): GameActionResult => ({ status: "error", message });
const success = (message: string): GameActionResult => ({ status: "success", message });

const schema = z.object({
  inventoryId: z.uuid(),
  slot: z.custom<EquipmentSlot>((value) => equipmentSlots.some((entry) => entry.key === value)),
});

export async function equipItemAction(
  characterId: string,
  formData: FormData,
): Promise<GameActionResult> {
  await requireCurrentAccount(`/personagens/${characterId}`);
  const parsed = schema.safeParse({
    inventoryId: formData.get("inventoryId"),
    slot: formData.get("slot"),
  });
  if (!parsed.success) return fail("Selecione um item e um espaço de equipamento válidos.");
  const client = await createServerSupabaseClient();
  if (!client) return fail("O inventário está indisponível. Tente novamente mais tarde.");
  const { error } = await client.rpc("v2_equip_inventory_item", {
    p_inventory_id: parsed.data.inventoryId,
    p_slot: parsed.data.slot,
  });
  if (error)
    return fail(
      "Não foi possível equipar. Confira o espaço, as cópias disponíveis e se o item está na mochila.",
    );
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/arena");
  revalidatePath("/personagens");
  revalidatePath("/loja");
  return success("Item equipado. Os atributos foram atualizados.");
}

export async function unequipItemAction(
  characterId: string,
  formData: FormData,
): Promise<GameActionResult> {
  await requireCurrentAccount(`/personagens/${characterId}`);
  const parsed = schema.safeParse({
    inventoryId: formData.get("inventoryId"),
    slot: formData.get("slot"),
  });
  if (!parsed.success) return fail("Selecione um item e um espaço de equipamento válidos.");
  const client = await createServerSupabaseClient();
  if (!client) return fail("O inventário está indisponível. Tente novamente mais tarde.");
  const { error } = await client.rpc("v2_unequip_inventory_slot", {
    p_inventory_id: parsed.data.inventoryId,
    p_slot: parsed.data.slot,
  });
  if (error) return fail("Não foi possível desequipar o item. Atualize a ficha e tente novamente.");
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/arena");
  revalidatePath("/personagens");
  revalidatePath("/loja");
  return success("Item desequipado. Os atributos foram atualizados.");
}

export async function sellInventoryItemAction(
  characterId: string,
  formData: FormData,
): Promise<GameActionResult> {
  await requireCurrentAccount(`/personagens/${characterId}?tab=equipamentos`);
  const inventoryId = z.uuid().safeParse(formData.get("inventoryId"));
  if (!inventoryId.success) return fail("Selecione um item válido para vender.");
  const client = await createServerSupabaseClient();
  if (!client) return fail("O inventário está indisponível. Tente novamente mais tarde.");
  const { error } = await client.rpc("v2_sell_inventory_item", {
    p_inventory_id: inventoryId.data,
  });
  if (error)
    return fail(
      "Não foi possível vender. Desequipe o item e confira se ele ainda está no inventário.",
    );
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/loja");
  revalidatePath("/personagens");
  return success("Uma unidade foi vendida. Seu saldo foi atualizado.");
}

export async function setInventoryLocationAction(
  characterId: string,
  formData: FormData,
): Promise<GameActionResult> {
  await requireCurrentAccount(`/personagens/${characterId}?tab=equipamentos`);
  const parsed = z
    .object({
      inventoryId: z.uuid(),
      location: z.enum(["bag", "storage"]),
    })
    .safeParse({
      inventoryId: formData.get("inventoryId"),
      location: formData.get("location"),
    });
  if (!parsed.success) return fail("Selecione um item e um destino válidos.");
  const client = await createServerSupabaseClient();
  if (!client) return fail("O inventário está indisponível. Tente novamente mais tarde.");
  const { error } = await client.rpc("v2_set_inventory_location", {
    p_inventory_id: parsed.data.inventoryId,
    p_location: parsed.data.location,
  });
  if (error) return fail("Não foi possível mover. Desequipe o item antes de armazená-lo.");
  revalidatePath(`/personagens/${characterId}`);
  return success(
    parsed.data.location === "bag" ? "Item movido para a mochila." : "Item armazenado.",
  );
}

export async function updateCharacterImageAction(characterId: string, formData: FormData) {
  await requireCurrentAccount(`/personagens/${characterId}`);
  const imageUrl = z
    .union([z.literal(""), z.url().refine((value) => /^https?:\/\//.test(value))])
    .safeParse(String(formData.get("imageUrl") ?? "").trim());
  if (!imageUrl.success) return;
  const client = await createServerSupabaseClient();
  if (client)
    await client.rpc("v2_set_character_image", {
      p_character_id: characterId,
      p_image_url: imageUrl.data,
    });
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/personagens");
}
