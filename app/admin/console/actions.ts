"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function executeRewardCommandAction(formData: FormData) {
  await requireAdministrativeAccount();
  const command = String(formData.get("command") ?? "").trim();
  const match = command.match(
    /^Dar\s+@(.+?)\s+(item|titulo|xp):(.+?)(?:\s+quantidade:\s*(\d+))?$/i,
  );
  if (!match) redirect("/admin/console?status=formato");
  const [, target, kindRaw, valueRaw, amountRaw] = match;
  const kind = kindRaw.toLocaleLowerCase("pt-BR");
  const amount = Math.max(1, Math.min(999999, Number(amountRaw ?? (kind === "xp" ? valueRaw : 1))));
  const value = kind === "xp" ? "" : valueRaw.trim();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/console?status=erro");
  const { data, error } = await client.rpc("v2_admin_grant_reward_command", {
    p_target_name: target.trim(),
    p_reward_type: kind,
    p_reward_name: value,
    p_amount: amount,
  });
  if (error) redirect(`/admin/console?status=${encodeURIComponent(error.message)}`);
  revalidatePath("/personagens", "layout");
  revalidatePath("/ranking");
  redirect(`/admin/console?status=sucesso&afetados=${Number(data ?? 0)}`);
}
