"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const rewardSchema = z.object({
  day: z.coerce.number().int().min(1).max(31),
  type: z.enum(["xp", "wg", "item"]),
  amount: z.coerce.number().int().min(1).max(1_000_000),
  itemId: z.union([z.literal(""), z.uuid()]),
});

export async function savePresencePassAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const days = formData.getAll("days");
  const parsed = days.map((day) =>
    rewardSchema.safeParse({
      day,
      type: formData.get(`type_${day}`),
      amount: formData.get(`amount_${day}`),
      itemId: formData.get(`item_${day}`) ?? "",
    }),
  );
  if (
    !parsed.length ||
    parsed.some((entry) => !entry.success || (entry.data.type === "item" && !entry.data.itemId))
  ) {
    redirect("/admin/presenca?status=erro");
  }
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/presenca?status=erro");
  const rows = parsed.flatMap((entry) =>
    entry.success
      ? [
          {
            day_number: entry.data.day,
            reward_type: entry.data.type,
            amount: entry.data.amount,
            item_id: entry.data.type === "item" ? entry.data.itemId : null,
            active: true,
            updated_by: account.id,
            updated_at: new Date().toISOString(),
          },
        ]
      : [],
  );
  const { error } = await client.from("v2_presence_rewards").upsert(rows);
  if (error) redirect("/admin/presenca?status=erro");
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "presence_pass.updated",
    target_type: "presence_pass",
    target_id: "daily_cycle",
    details: { days: rows.length },
  });
  revalidatePath("/admin/presenca");
  revalidatePath("/presenca");
  redirect("/admin/presenca?status=salvo");
}
