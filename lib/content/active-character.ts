import "server-only";

import { redirect } from "next/navigation";

import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getActiveCharacterId(userId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const { data } = await client
    .from("v2_active_characters")
    .select("character_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.character_id ?? null;
}

export async function getActiveCharacterNavigation(userId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const { data: active } = await client
    .from("v2_active_characters")
    .select("character_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!active?.character_id) return null;
  const { data } = await client
    .from("v2_characters")
    .select("id,name,level,image_url,adventure_rank")
    .eq("id", active.character_id)
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function getActiveCharacterRank(userId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const { data: active } = await client
    .from("v2_active_characters")
    .select("character_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!active?.character_id) return null;

  const { data: character } = await client
    .from("v2_characters")
    .select("adventure_rank")
    .eq("id", active.character_id)
    .eq("user_id", userId)
    .maybeSingle();

  return character?.adventure_rank ?? null;
}

export async function requireActiveCharacter(returnTo = "/perfil") {
  const account = await requireCurrentAccount(returnTo);
  const characterId = await getActiveCharacterId(account.id);
  if (!characterId) {
    redirect(`/personagens?selecionar=1&next=${encodeURIComponent(returnTo)}`);
  }
  return { account, characterId };
}