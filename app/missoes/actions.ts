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
