"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export async function claimDailyReward() {
  await requireCurrentAccount();
  const client = await createServerSupabaseClient();
  if (client) await client.rpc("v2_claim_daily_reward", {});
  revalidatePath("/perfil");
}
