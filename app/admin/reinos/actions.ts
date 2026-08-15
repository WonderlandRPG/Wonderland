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
const economySchema=z.object({monarchSalary:z.string().regex(/^\d+$/),realmSalary:z.string().regex(/^\d+$/),warSalary:z.string().regex(/^\d+$/),infrastructureDrain:z.coerce.number().int().min(0).max(100),provisionsDrain:z.coerce.number().int().min(0).max(100),arsenalDrain:z.coerce.number().int().min(0).max(100),livestockDrain:z.coerce.number().int().min(0).max(100),infrastructureCost:z.string().regex(/^\d+$/),provisionsCost:z.string().regex(/^\d+$/),arsenalCost:z.string().regex(/^\d+$/),livestockCost:z.string().regex(/^\d+$/),weeklyLimit:z.coerce.number().int().min(1).max(100)});
export async function setKingdomEconomyAction(formData:FormData){await requireAdministrativeAccount();const parsed=economySchema.safeParse(Object.fromEntries(formData));if(!parsed.success)redirect("/admin/reinos?status=erro&mensagem=Configuração inválida");const client=await createServerSupabaseClient();if(!client)redirect("/admin/reinos?status=erro");const {error}=await (client.rpc as unknown as (name:string,args:Record<string,unknown>)=>Promise<{error:{message:string}|null}>)("v2_admin_set_kingdom_economy",{p_monarch_salary:parsed.data.monarchSalary,p_realm_salary:parsed.data.realmSalary,p_war_salary:parsed.data.warSalary,p_infrastructure_drain:parsed.data.infrastructureDrain,p_provisions_drain:parsed.data.provisionsDrain,p_arsenal_drain:parsed.data.arsenalDrain,p_livestock_drain:parsed.data.livestockDrain,p_infrastructure_cost:parsed.data.infrastructureCost,p_provisions_cost:parsed.data.provisionsCost,p_arsenal_cost:parsed.data.arsenalCost,p_livestock_cost:parsed.data.livestockCost,p_weekly_limit:parsed.data.weeklyLimit});revalidatePath("/admin/reinos");revalidatePath("/reinos/atual");redirect(error?`/admin/reinos?status=erro&mensagem=${encodeURIComponent(error.message)}`:"/admin/reinos?status=salvo");}
