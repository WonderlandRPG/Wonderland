"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { missionKingdoms,missionRanks,officialMissionRewards } from "@/lib/game/missions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const missionInput=z.object({name:z.string().trim().min(3).max(100),slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().trim().min(10).max(1200),objective:z.string().trim().min(3).max(300),kingdom:z.enum(missionKingdoms),rank:z.enum(missionRanks),minLevel:z.coerce.number().int().min(1).max(100),isRankTrial:z.boolean(),promotionRank:z.enum(["D","C","B","A"]).nullable()});

export async function createMissionAction(formData:FormData){
  const account=await requireAdministrativeAccount();const trial=formData.get("isRankTrial")==="on";
  const parsed=missionInput.safeParse({name:formData.get("name"),slug:formData.get("slug"),description:formData.get("description"),objective:formData.get("objective"),kingdom:formData.get("kingdom"),rank:formData.get("rank"),minLevel:formData.get("minLevel"),isRankTrial:trial,promotionRank:trial?formData.get("promotionRank"):null});
  if(!parsed.success)redirect("/admin/missoes?status=invalida");const client=await createServerSupabaseClient();if(!client)redirect("/admin/missoes?status=banco");
  const reward=officialMissionRewards[parsed.data.rank];
  const {error}=await client.from("v2_missions").insert({slug:parsed.data.slug,name:parsed.data.name,description:parsed.data.description,objective:parsed.data.objective,kingdom:parsed.data.kingdom,rank:parsed.data.rank,min_level:parsed.data.minLevel,reward_xp:reward.xp,reward_gold:reward.wg,is_rank_trial:parsed.data.isRankTrial,promotion_rank:parsed.data.promotionRank,created_by:account.id});
  revalidatePath("/admin/missoes");revalidatePath("/missoes");redirect(error?`/admin/missoes?status=erro&mensagem=${encodeURIComponent(error.message)}`:"/admin/missoes?status=criada");
}

export async function toggleMissionAction(formData:FormData){
  await requireAdministrativeAccount();const parsed=z.object({id:z.uuid(),active:z.enum(["true","false"])}).safeParse({id:formData.get("id"),active:formData.get("active")});if(!parsed.success)redirect("/admin/missoes?status=invalida");const client=await createServerSupabaseClient();if(!client)redirect("/admin/missoes?status=banco");
  const {error}=await client.from("v2_missions").update({active:parsed.data.active!=="true"}).eq("id",parsed.data.id);revalidatePath("/admin/missoes");revalidatePath("/missoes");redirect(error?`/admin/missoes?status=erro&mensagem=${encodeURIComponent(error.message)}`:"/admin/missoes?status=atualizada");
}
