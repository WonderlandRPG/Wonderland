"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function claimPresenceRewardAction() {
  const { characterId } = await requireActiveCharacter("/presenca");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/presenca?status=erro");
  const { error } = await client.rpc("v2_claim_daily_reward", {});
  if (error) redirect("/presenca?status=erro");
  revalidatePath("/presenca");
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/arena");
  redirect("/presenca?status=resgatado");
}
