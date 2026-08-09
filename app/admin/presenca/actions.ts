"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const schema = z.object({
  base: z.coerce.number().int().min(0).max(100000),
  bonus: z.coerce.number().int().min(0).max(100000),
  cap: z.coerce.number().int().min(1).max(365),
  xp: z.coerce.number().int().min(0).max(100000),
});
export async function savePresenceRewardsAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const parsed = schema.safeParse({
    base: formData.get("base"),
    bonus: formData.get("bonus"),
    cap: formData.get("cap"),
    xp: formData.get("xp"),
  });
  if (!parsed.success) redirect("/admin/presenca?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/presenca?status=erro");
  const values = [
    ["economy.daily_base_reward", parsed.data.base],
    ["economy.daily_streak_bonus", parsed.data.bonus],
    ["economy.daily_streak_cap", parsed.data.cap],
    ["progression.daily_xp_reward", parsed.data.xp],
  ] as const;
  for (const [key, value] of values) {
    const { error } = await client
      .from("v2_game_settings")
      .update({
        value,
        status: "published",
        updated_by: account.id,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);
    if (error) redirect("/admin/presenca?status=erro");
  }
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "presence_rewards.updated",
    target_type: "game_setting",
    target_id: "daily_presence",
    details: parsed.data,
  });
  revalidatePath("/admin/presenca");
  redirect("/admin/presenca?status=salvo");
}
