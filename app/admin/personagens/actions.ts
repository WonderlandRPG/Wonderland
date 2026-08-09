"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  characterId: z.uuid(),
  name: z.string().trim().min(2).max(32),
  xp: z.coerce.number().int().min(0).max(999999999),
  gold: z.coerce.number().int().min(0).max(999999999),
  imageUrl: z.union([z.literal(""), z.url().refine((value) => /^https?:\/\//.test(value))]),
});

export async function updateCharacterAdminAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = schema.safeParse({
    characterId: formData.get("characterId"),
    name: formData.get("name"),
    xp: formData.get("xp"),
    gold: formData.get("gold"),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
  });
  if (!parsed.success) redirect("/admin/personagens?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/personagens?status=erro");
  const { error } = await client.rpc("v2_admin_update_character", {
    p_character_id: parsed.data.characterId,
    p_name: parsed.data.name,
    p_xp: parsed.data.xp,
    p_gold: parsed.data.gold,
    p_image_url: parsed.data.imageUrl,
  });
  if (error) redirect("/admin/personagens?status=erro");
  revalidatePath("/admin/personagens");
  revalidatePath("/personagens");
  revalidatePath(`/personagens/${parsed.data.characterId}`);
  revalidatePath("/ranking");
  redirect("/admin/personagens?status=salvo");
}
