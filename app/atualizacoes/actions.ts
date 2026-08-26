"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function markUpdateReadAction(updateId: string) {
  const parsed = z.uuid().safeParse(updateId);
  const account = await getCurrentAccount();
  const client = await createServerSupabaseClient();
  if (!parsed.success || !account || !client) return { success: false };
  const { error } = await client.from("v2_update_reads").upsert({
    user_id: account.id,
    update_id: parsed.data,
    read_at: new Date().toISOString(),
  });
  if (!error) revalidatePath("/", "layout");
  return { success: !error };
}
