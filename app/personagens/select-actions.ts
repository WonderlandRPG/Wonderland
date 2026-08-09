"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCurrentAccount } from "@/lib/auth/account";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function selectCharacterAction(formData: FormData) {
  await requireCurrentAccount("/personagens");
  const characterId = z.uuid().safeParse(formData.get("characterId"));
  if (!characterId.success) redirect("/personagens?notice=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/personagens?notice=erro");
  const { error } = await client.rpc("v2_select_character", { p_character_id: characterId.data });
  if (error) redirect("/personagens?notice=erro");
  revalidatePath("/", "layout");
  const next = getSafeRedirectPath(String(formData.get("next") ?? "/perfil"));
  redirect(next === "/" ? "/perfil" : next);
}
