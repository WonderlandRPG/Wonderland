"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function acceptMissionAction(formData:FormData){
  const {characterId}=await requireActiveCharacter("/missoes");
  const parsed=z.uuid().safeParse(formData.get("missionId"));
  if(!parsed.success) redirect("/missoes?status=invalida");
  const client=await createServerSupabaseClient();
  if(!client) redirect("/missoes?status=banco");
  const {error}=await client.rpc("v2_accept_mission",{p_mission_id:parsed.data,p_character_id:characterId});
  revalidatePath("/missoes");revalidatePath("/arena");
  redirect(error?`/missoes?status=erro&mensagem=${encodeURIComponent(error.message)}`:"/missoes?status=aceita");
}

export async function updateMissionSceneAction(formData: FormData) {
  await requireActiveCharacter("/missoes");
  const parsed = z.object({
    assignmentId: z.uuid(),
    stage: z.enum(["in_scene", "awaiting_evaluation"]),
    summary: z.string().trim().max(4000).optional(),
  }).safeParse({ assignmentId: formData.get("assignmentId"), stage: formData.get("stage"), summary: formData.get("summary") });
  if (!parsed.success) redirect("/missoes?status=erro&mensagem=Dados+da+cena+inválidos");
  const client = await createServerSupabaseClient();
  const { error } = client ? await client.rpc("v2_update_mission_scene", {
    p_assignment_id: parsed.data.assignmentId, p_stage: parsed.data.stage, p_summary: parsed.data.summary,
  }) : { error: new Error("Banco indisponível") };
  revalidatePath("/missoes"); revalidatePath("/personagens");
  redirect(error ? `/missoes?status=erro&mensagem=${encodeURIComponent(error.message)}` : "/missoes?status=cena");
}
