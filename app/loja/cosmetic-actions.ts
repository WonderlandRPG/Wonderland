"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentAccount } from "@/lib/auth/account";
import { isAdministrativeRole } from "@/lib/auth/roles";
import { getActiveCharacterId } from "@/lib/content/active-character";
import {
  characterCosmeticSlots,
  festivalDasAlmas2026,
  isValidCharacterCosmetic,
  parseCharacterCosmetics,
  type CharacterCosmeticSlot,
} from "@/lib/content/character-cosmetics";
import type { Json } from "@/lib/db/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function saveLoadout(next: Record<CharacterCosmeticSlot, string | null>) {
  const account = await requireCurrentAccount("/loja?tab=cosmeticos");
  if (!isAdministrativeRole(account.role)) redirect("/loja");

  const characterId = await getActiveCharacterId(account.id);
  const client = await createServerSupabaseClient();
  if (!characterId || !client) redirect("/loja?tab=cosmeticos&status=sem-personagem");

  const { error } = await client.rpc("v2_set_character_cosmetics", {
    p_character_id: characterId,
    p_cosmetics: next as unknown as Json,
  });

  if (error) {
    console.error("Falha ao salvar cosméticos:", error);
    redirect("/loja?tab=cosmeticos&status=erro");
  }

  revalidatePath("/loja");
  revalidatePath("/personagens");
  revalidatePath(`/personagens/${characterId}`);
  redirect("/loja?tab=cosmeticos&status=salvo");
}

export async function equipCosmeticAction(formData: FormData) {
  const account = await requireCurrentAccount("/loja?tab=cosmeticos");
  if (!isAdministrativeRole(account.role)) redirect("/loja");

  const slot = String(formData.get("slot") ?? "") as CharacterCosmeticSlot;
  const key = String(formData.get("key") ?? "");
  if (!characterCosmeticSlots.includes(slot) || !isValidCharacterCosmetic(slot, key)) {
    redirect("/loja?tab=cosmeticos&status=erro");
  }

  const characterId = await getActiveCharacterId(account.id);
  const client = await createServerSupabaseClient();
  if (!characterId || !client) redirect("/loja?tab=cosmeticos&status=sem-personagem");

  const { data, error } = await client
    .from("v2_characters")
    .select("cosmetics")
    .eq("id", characterId)
    .eq("user_id", account.id)
    .maybeSingle();

  if (error) redirect("/loja?tab=cosmeticos&status=erro");

  const next = parseCharacterCosmetics(data?.cosmetics);
  next[slot] = key;
  await saveLoadout(next);
}

export async function equipFestivalSetAction(_formData: FormData) {
  const next = parseCharacterCosmetics({});
  for (const item of festivalDasAlmas2026) next[item.slot] = item.key;
  await saveLoadout(next);
}

export async function clearCharacterCosmeticsAction(_formData: FormData) {
  await saveLoadout(parseCharacterCosmetics({}));
}
