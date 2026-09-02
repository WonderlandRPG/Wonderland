"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase/server";

export async function updateCosmeticAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed=z.object({id:z.uuid(),price:z.coerce.number().min(0).max(100000),active:z.string().optional()}).safeParse(Object.fromEntries(formData));
  if(!parsed.success) redirect("/admin/cosmeticos?status=erro");
  const client=await createAuthenticatedServerSupabaseClient(); if(!client) redirect("/admin/cosmeticos?status=erro");
  const {error}=await client.rpc("v2_admin_update_cosmetic",{p_cosmetic_id:parsed.data.id,p_price_cents:Math.round(parsed.data.price*100),p_active:parsed.data.active==="on"});
  if(error) redirect("/admin/cosmeticos?status=erro");
  revalidatePath("/loja"); revalidatePath("/admin/cosmeticos"); redirect("/admin/cosmeticos?status=salvo");
}

export async function grantCosmeticAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed=z.object({cosmeticId:z.uuid(),characterId:z.union([z.literal("all"),z.uuid()])}).safeParse(Object.fromEntries(formData));
  if(!parsed.success) redirect("/admin/cosmeticos?status=erro");
  const client=await createAuthenticatedServerSupabaseClient(); if(!client) redirect("/admin/cosmeticos?status=erro");
  const all=parsed.data.characterId==="all";
  const {error}=await client.rpc("v2_admin_grant_cosmetic",{p_cosmetic_id:parsed.data.cosmeticId,p_character_id:all?null:parsed.data.characterId,p_all:all});
  if(error) redirect("/admin/cosmeticos?status=erro");
  revalidatePath("/personagens/[id]","page"); redirect("/admin/cosmeticos?status=entregue");
}
