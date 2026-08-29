"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdministrativeAccount } from "@/lib/auth/account";
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

async function saveLoadout(next: Record<CharacterCosmeticSlot, string | null>, action: string) {
  const account = await requireAdministrativeAccount();
  const characterId = await getActiveCharacterId(account.id);
  const client = await createServerSupabaseClient();
  if (!characterId || !client) redirect("/admin/cosmeticos?status=sem-personagem");

  const { error } = await client
    .from("v2_characters")
    .update({ cosmetics: next as unknown as Json, updated_at: new Date().toISOString() })
    .eq("id", characterId)
    .eq("user_id", account.id);

  if (error) redirect("/admin/cosmeticos?status=erro");

  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action,
    target_type: "character_cosmetics",
    target_id: characterId,
    details: next as unknown as Json,
  });

  revalidatePath("/personagens");
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/admin/cosmeticos");
  redirect("/admin/cosmeticos?status=salvo");
}

export async function equipCosmeticAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const slot = String(formData.get("slot") ?? "") as CharacterCosmeticSlot;
  const key = String(formData.get("key") ?? "");
  if (!characterCosmeticSlots.includes(slot) || !isValidCharacterCosmetic(slot, key)) {
    redirect("/admin/cosmeticos?status=erro");
  }

  const characterId = await getActiveCharacterId(account.id);
  const client = await createServerSupabaseClient();
  if (!characterId || !client) redirect("/admin/cosmeticos?status=sem-personagem");

  const { data } = await client
    .from("v2_characters")
    .select("cosmetics")
    .eq("id", characterId)
    .eq("user_id", account.id)
    .maybeSingle();

  const next = parseCharacterCosmetics(data?.cosmetics);
  next[slot] = key;
  await saveLoadout(next, "character.cosmetic.equipped");
}

export async function equipFestivalSetAction(_formData: FormData) {
  const next = parseCharacterCosmetics({});
  for (const item of festivalDasAlmas2026) next[item.slot] = item.key;
  await saveLoadout(next, "character.cosmetic.set_equipped");
}

export async function clearCharacterCosmeticsAction(_formData: FormData) {
  await saveLoadout(parseCharacterCosmetics({}), "character.cosmetic.cleared");
}
