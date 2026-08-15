"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { kingdomUpgradeAreas } from "@/lib/game/kingdom-governance";
import { kingdomOffices, kingdomResourceInfo } from "@/lib/game/kingdom-governance";
import { kingdoms } from "@/lib/game/kingdoms";
import { z } from "zod";
export async function buyKingdomStarAction(formData: FormData) {
  const area = String(formData.get("area"));
  if (!kingdomUpgradeAreas.includes(area as (typeof kingdomUpgradeAreas)[number]))
    redirect("/reinos/atual?status=erro");
  const { characterId } = await requireActiveCharacter("/reinos/atual");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/reinos/atual?status=erro");
  const { error } = await client.rpc("v2_buy_kingdom_star", {
    p_character_id: characterId,
    p_area: area,
  });
  revalidatePath("/reinos/atual");
  revalidatePath("/admin/reinos");
  redirect(
    error
      ? `/reinos/atual?status=erro&mensagem=${encodeURIComponent(error.message)}`
      : "/reinos/atual?status=comprada",
  );
}

export async function declareKingdomWarAction(formData: FormData) {
  const { characterId } = await requireActiveCharacter("/reinos/atual");
  const defender = String(formData.get("defender"));
  const client = await createServerSupabaseClient();
  if (!client) redirect("/reinos/atual?status=erro");
  const { error } = await client.rpc("v2_declare_kingdom_war", { p_character_id: characterId, p_defender: defender });
  revalidatePath("/reinos/atual");
  redirect(error ? `/reinos/atual?status=erro&mensagem=${encodeURIComponent(error.message)}` : "/reinos/atual?status=guerra-declarada");
}
export async function respondKingdomWarAction(formData: FormData) {
  const { characterId } = await requireActiveCharacter("/reinos/atual");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/reinos/atual?status=erro");
  const { error } = await client.rpc("v2_respond_kingdom_war", { p_character_id: characterId, p_war_id: String(formData.get("warId")), p_response: String(formData.get("response")) });
  revalidatePath("/reinos/atual"); revalidatePath("/loja");
  redirect(error ? `/reinos/atual?status=erro&mensagem=${encodeURIComponent(error.message)}` : "/reinos/atual?status=guerra-resolvida");
}

async function kingdomRpc(name:string,args:Record<string,unknown>,success:string){
 const client=await createServerSupabaseClient();if(!client)redirect("/reinos/atual?status=erro");
 const {error}=await (client.rpc as unknown as (name:string,args:Record<string,unknown>)=>Promise<{error:{message:string}|null}>)(name,args);
 revalidatePath("/reinos/atual");revalidatePath("/admin/reinos");
 redirect(error?`/reinos/atual?status=erro&mensagem=${encodeURIComponent(error.message)}`:`/reinos/atual?status=${success}`);
}
export async function donateToKingdomAction(formData:FormData){const {characterId}=await requireActiveCharacter("/reinos/atual");const amount=z.coerce.number().int().positive().safeParse(formData.get("amount"));if(!amount.success)redirect("/reinos/atual?status=erro");await kingdomRpc("v2_donate_to_kingdom",{p_character_id:characterId,p_amount:String(amount.data)},"doado");}
export async function buyKingdomResourceAction(formData:FormData){const {characterId}=await requireActiveCharacter("/reinos/atual");const parsed=z.object({resource:z.enum(Object.keys(kingdomResourceInfo) as [keyof typeof kingdomResourceInfo,...Array<keyof typeof kingdomResourceInfo>]),percent:z.coerce.number().int().min(1).max(25),beneficiary:z.string()}).safeParse(Object.fromEntries(formData));if(!parsed.success)redirect("/reinos/atual?status=erro");await kingdomRpc("v2_buy_kingdom_resource",{p_character_id:characterId,p_resource:parsed.data.resource,p_percent:parsed.data.percent,p_beneficiary:parsed.data.beneficiary||null},"recurso-comprado");}
export async function proposePeaceAction(formData:FormData){const {characterId}=await requireActiveCharacter("/reinos/atual");const target=z.enum(kingdoms.map(k=>k.key) as [string,...string[]]).safeParse(formData.get("kingdom"));if(!target.success)redirect("/reinos/atual?status=erro");await kingdomRpc("v2_propose_peace",{p_character_id:characterId,p_recipient:target.data},"paz-proposta");}
export async function respondPeaceAction(formData:FormData){const {characterId}=await requireActiveCharacter("/reinos/atual");const parsed=z.object({proposalId:z.uuid(),accept:z.enum(["true","false"])}).safeParse(Object.fromEntries(formData));if(!parsed.success)redirect("/reinos/atual?status=erro");await kingdomRpc("v2_respond_peace",{p_character_id:characterId,p_proposal:parsed.data.proposalId,p_accept:parsed.data.accept==="true"},"paz-respondida");}
export async function startCrownVoteAction(formData:FormData){const {characterId}=await requireActiveCharacter("/reinos/atual");const office=z.enum(kingdomOffices).safeParse(formData.get("office"));if(!office.success)redirect("/reinos/atual?status=erro");await kingdomRpc("v2_start_crown_vote",{p_character_id:characterId,p_office:office.data},"votacao-iniciada");}
export async function castCrownVoteAction(formData:FormData){const {characterId}=await requireActiveCharacter("/reinos/atual");const parsed=z.object({voteId:z.uuid(),choice:z.enum(["true","false"])}).safeParse(Object.fromEntries(formData));if(!parsed.success)redirect("/reinos/atual?status=erro");await kingdomRpc("v2_cast_crown_vote",{p_character_id:characterId,p_vote:parsed.data.voteId,p_choice:parsed.data.choice==="true"},"voto-registrado");}
