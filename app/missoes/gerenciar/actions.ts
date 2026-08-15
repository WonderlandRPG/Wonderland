"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMissionManager } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function resolveMissionAction(formData:FormData){
  await requireMissionManager();
  const parsed=z.object({assignmentId:z.uuid(),result:z.enum(["completed","failed"])}).safeParse({assignmentId:formData.get("assignmentId"),result:formData.get("result")});
  if(!parsed.success) redirect("/missoes/gerenciar?status=invalida");
  const client=await createServerSupabaseClient();if(!client) redirect("/missoes/gerenciar?status=banco");
  const {error}=await client.rpc("v2_resolve_mission",{p_assignment_id:parsed.data.assignmentId,p_completed:parsed.data.result==="completed"});
  revalidatePath("/missoes");revalidatePath("/missoes/gerenciar");revalidatePath("/personagens");
  redirect(error?`/missoes/gerenciar?status=erro&mensagem=${encodeURIComponent(error.message)}`:`/missoes/gerenciar?status=${parsed.data.result}`);
}
