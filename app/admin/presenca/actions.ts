"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const rewardSchema = z.object({
  day: z.coerce.number().int().min(1).max(31),
  type: z.enum(["xp", "wg", "item", "title"]),
  amount: z.coerce.number().int().min(1).max(1_000_000),
  itemId: z.union([z.literal(""), z.uuid()]),
});

const configSchema = z
  .object({
    startsOn: z.iso.date(),
    endsOn: z.iso.date(),
    dayCount: z.coerce.number().int().min(1).max(31),
  })
  .refine((value) => value.endsOn >= value.startsOn);

export async function savePresencePassAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const config = configSchema.safeParse({
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn"),
    dayCount: formData.get("dayCount"),
  });
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
    !config.success ||
    parsed.length !== config.data.dayCount ||
    parsed.some(
      (entry) =>
        !entry.success ||
        (["item", "title"].includes(entry.data.type) && !entry.data.itemId),
    )
  ) {
    redirect("/admin/presenca?status=erro");
  }
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/presenca?status=erro");
  const selectedIds = parsed.flatMap((entry) =>
    entry.success && entry.data.itemId ? [entry.data.itemId] : [],
  );
  if (selectedIds.length) {
    const { data: selectedItems } = await client
      .from("v2_shop_items")
      .select("id,slot")
      .in("id", selectedIds);
    const byId = new Map((selectedItems ?? []).map((item) => [item.id, item.slot]));
    const invalid = parsed.some(
      (entry) =>
        entry.success &&
        entry.data.itemId &&
        ((entry.data.type === "title" && byId.get(entry.data.itemId) !== "title") ||
          (entry.data.type === "item" && byId.get(entry.data.itemId) === "title")),
    );
    if (invalid) redirect("/admin/presenca?status=erro");
  }
  const rows = parsed.flatMap((entry) =>
    entry.success
      ? [
          {
            day_number: entry.data.day,
            reward_type: entry.data.type,
            amount: entry.data.amount,
            item_id: ["item", "title"].includes(entry.data.type) ? entry.data.itemId : null,
            active: true,
            updated_by: account.id,
            updated_at: new Date().toISOString(),
          },
        ]
      : [],
  );
  const { error } = await client.from("v2_presence_rewards").upsert(rows);
  if (error) redirect("/admin/presenca?status=erro");
  const { error: configError } = await client.from("v2_presence_pass_config").upsert({
    id: true,
    starts_on: config.data.startsOn,
    ends_on: config.data.endsOn,
    day_count: config.data.dayCount,
    updated_by: account.id,
    updated_at: new Date().toISOString(),
  });
  if (configError) redirect("/admin/presenca?status=erro");
  await client
    .from("v2_presence_rewards")
    .update({ active: false, updated_by: account.id, updated_at: new Date().toISOString() })
    .gt("day_number", config.data.dayCount);
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "presence_pass.updated",
    target_type: "presence_pass",
    target_id: "daily_cycle",
    details: { days: rows.length, starts_on: config.data.startsOn, ends_on: config.data.endsOn },
  });
  revalidatePath("/admin/presenca");
  revalidatePath("/presenca");
  redirect("/admin/presenca?status=salvo");
}
