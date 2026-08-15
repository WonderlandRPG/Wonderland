"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function leaveAllQueuesAction() {
  const { characterId } = await requireActiveCharacter("/arena");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/arena?filas=erro");

  const { data, error } = await client.rpc("v2_leave_all_queues", {
    p_character_id: characterId,
  });

  revalidatePath("/arena");
  revalidatePath("/arena/dungeons");
  revalidatePath("/missoes");

  if (error) {
    redirect(`/arena?filas=erro&mensagem=${encodeURIComponent(error.message)}`);
  }

  const total =
    data && !Array.isArray(data) && typeof data === "object" && "total" in data
      ? Number(data.total) || 0
      : 0;
  redirect(`/arena?filas=limpas&quantidade=${total}`);
}
