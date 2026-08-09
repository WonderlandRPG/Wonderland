"use server";
import { revalidatePath } from "next/cache";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export async function claimDailyReward() {
  await requireActiveCharacter("/perfil");
  const client = await createServerSupabaseClient();
  if (client) await client.rpc("v2_claim_daily_reward", {});
  revalidatePath("/perfil");
}
