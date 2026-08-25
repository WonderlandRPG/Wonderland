"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase/server";

export async function claimPresenceRewardAction() {
  const { characterId } = await requireActiveCharacter("/presenca");
  const client = await createAuthenticatedServerSupabaseClient();
  if (!client) redirect("/presenca?status=erro");
  const { data, error } = await client.rpc("v2_claim_daily_reward", {});
  if (error) redirect("/presenca?status=erro");
  if (data && typeof data === "object" && "already_claimed" in data && data.already_claimed) {
    revalidatePath("/presenca");
    redirect("/presenca?status=ja_marcada");
  }
  revalidatePath("/presenca");
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/arena");
  redirect("/presenca?status=resgatado");
}
