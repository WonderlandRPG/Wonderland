"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase/server";

export async function equipOwnedCosmeticAction(characterId: string, formData: FormData) {
  const parsed = z.object({ slot: z.enum(["card","aura","border"]), key: z.string().max(120) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/personagens/${characterId}?tab=equipamentos&cosmetico=erro`);
  const client = await createAuthenticatedServerSupabaseClient();
  if (!client) redirect(`/personagens/${characterId}?tab=equipamentos&cosmetico=erro`);
  const { error } = await client.rpc("v2_set_character_cosmetic", { p_character_id: characterId, p_slot: parsed.data.slot, p_key: parsed.data.key });
  if (error) redirect(`/personagens/${characterId}?tab=equipamentos&cosmetico=erro`);
  revalidatePath(`/personagens/${characterId}`); revalidatePath("/ranking");
  redirect(`/personagens/${characterId}?tab=equipamentos&cosmetico=salvo`);
}
