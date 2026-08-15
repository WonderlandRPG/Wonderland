"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { kingdoms } from "@/lib/game/kingdoms";
import { kingdomOffices, kingdomUpgradeAreas } from "@/lib/game/kingdom-governance";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const schema = z.object({
  kingdom: z.enum(kingdoms.map((item) => item.key) as [string, ...string[]]),
  office: z.enum(kingdomOffices),
  characterId: z.union([z.literal(""), z.uuid()]),
});
export async function setKingdomOfficeAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = schema.safeParse({
    kingdom: formData.get("kingdom"),
    office: formData.get("office"),
    characterId: formData.get("characterId") ?? "",
  });
  if (!parsed.success) redirect("/admin/reinos?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/reinos?status=erro");
  const { error } = await client.rpc("v2_admin_set_kingdom_office", {
    p_kingdom: parsed.data.kingdom,
    p_office: parsed.data.office,
    p_character_id: parsed.data.characterId || null,
  });
  revalidatePath("/admin/reinos");
  revalidatePath("/reinos/atual");
  redirect(
    error
      ? `/admin/reinos?status=erro&mensagem=${encodeURIComponent(error.message)}`
      : "/admin/reinos?status=salvo",
  );
}
const starSchema = z.object({
  kingdom: z.enum(kingdoms.map((item) => item.key) as [string, ...string[]]),
  area: z.enum(kingdomUpgradeAreas),
  stars: z.coerce.number().int().min(0).max(5),
});
export async function setKingdomStarsAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = starSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/reinos?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/reinos?status=erro");
  const { error } = await client.rpc("v2_admin_set_kingdom_stars", {
    p_kingdom: parsed.data.kingdom,
    p_area: parsed.data.area,
    p_stars: parsed.data.stars,
  });
  revalidatePath("/admin/reinos");
  revalidatePath("/reinos/atual");
  redirect(
    error
      ? `/admin/reinos?status=erro&mensagem=${encodeURIComponent(error.message)}`
      : "/admin/reinos?status=salvo",
  );
}
