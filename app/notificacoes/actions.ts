"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export async function markNotificationReadAction(formData: FormData) {
  await requireCurrentAccount("/notificacoes");
  const raw=formData.get("notificationId");
  const parsed=raw ? z.uuid().safeParse(raw) : null;
  if(parsed && !parsed.success) redirect("/notificacoes?status=erro");
  const client=await createServerSupabaseClient();
  if(client) await client.rpc("v2_mark_notification_read",{p_notification_id:parsed?.data});
  revalidatePath("/notificacoes"); revalidatePath("/personagens");
}
