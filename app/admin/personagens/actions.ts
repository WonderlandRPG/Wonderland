"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { kingdoms } from "@/lib/game/kingdoms";
import { adventureRanks } from "@/lib/game/ranks";

const postgresBigintMax = BigInt("9223372036854775807");
const nonNegativeBigintSchema = z.string().trim().regex(/^\d+$/).refine((value) => BigInt(value) <= postgresBigintMax);

const schema = z.object({
  characterId: z.uuid(),
  name: z.string().trim().min(2).max(32),
  xp: nonNegativeBigintSchema,
  gold: nonNegativeBigintSchema,
  imageUrl: z.union([z.literal(""), z.url().refine((value) => /^https?:\/\//.test(value))]),
  kingdom: z.enum(kingdoms.map((entry) => entry.key) as [string, ...string[]]),
  adventureRank: z.enum(adventureRanks.map((entry) => entry.key) as [string, ...string[]]),
  classPathKey: z.string().trim(),
});

const deleteSchema = z.object({ characterId: z.uuid() });

export async function updateCharacterAdminAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = schema.safeParse({
    characterId: formData.get("characterId"),
    name: formData.get("name"),
    xp: formData.get("xp"),
    gold: formData.get("gold"),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    kingdom: formData.get("kingdom"),
    adventureRank: formData.get("adventureRank"),
    classPathKey: formData.get("classPathKey"),
  });
  if (!parsed.success)
    redirect(`/admin/personagens?status=erro&mensagem=${encodeURIComponent("XP e WG devem ser números inteiros entre 0 e 9.223.372.036.854.775.807.")}`);
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/personagens?status=erro");
  const { error } = await client.rpc("v2_admin_update_character", {
    p_character_id: parsed.data.characterId,
    p_name: parsed.data.name,
    p_xp: parsed.data.xp,
    p_gold: parsed.data.gold,
    p_image_url: parsed.data.imageUrl,
    p_kingdom: parsed.data.kingdom,
    p_adventure_rank: parsed.data.adventureRank,
    p_class_path_key: parsed.data.classPathKey || null,
  });
  if (error)
    redirect(`/admin/personagens?status=erro&mensagem=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/personagens");
  revalidatePath("/personagens");
  revalidatePath(`/personagens/${parsed.data.characterId}`);
  revalidatePath("/ranking");
  redirect("/admin/personagens?status=salvo");
}

export async function deleteCharacterAdminAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = deleteSchema.safeParse({ characterId: formData.get("characterId") });
  if (!parsed.success) {
    redirect(`/admin/personagens?status=erro&mensagem=${encodeURIComponent("Personagem inválido para exclusão.")}`);
  }

  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/personagens?status=erro");

  // O RPC já está versionado em migration e aplicado no Supabase; este cast local
  // mantém o build compatível até a próxima regeneração completa de lib/db/types.ts.
  const deleteRpc = client.rpc as unknown as (
    fn: "v2_admin_delete_character",
    args: { p_character_id: string },
  ) => Promise<{ error: { message: string } | null }>;

  const { error } = await deleteRpc("v2_admin_delete_character", {
    p_character_id: parsed.data.characterId,
  });
  if (error) {
    redirect(`/admin/personagens?status=erro&mensagem=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/personagens");
  revalidatePath("/personagens");
  revalidatePath("/ranking");
  revalidatePath("/arena");
  redirect("/admin/personagens?status=excluido");
}
