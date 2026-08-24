"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  title: z.string().trim().min(2).max(100),
  eventType: z.string().trim().min(2).max(50),
  description: z.string().trim().max(500),
  startsAt: z.string().min(10),
  registrationLabel: z.string().trim().min(2).max(80),
});

const rewardSchema = z
  .object({
    rewardType: z.enum(["gold", "xp", "item", "title"]),
    amount: z.coerce.number().int().min(1).max(999999999),
    itemId: z.union([z.literal(""), z.uuid()]),
  })
  .superRefine((reward, context) => {
    if (["item", "title"].includes(reward.rewardType) && !reward.itemId) {
      context.addIssue({ code: "custom", message: "Selecione o item da recompensa." });
    }
  });

export async function saveEventAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const parsed = schema.safeParse({
    id: formData.get("id") ?? "",
    title: formData.get("title"),
    eventType: formData.get("eventType"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt"),
    registrationLabel: formData.get("registrationLabel"),
  });
  if (!parsed.success) redirect("/admin/eventos?status=erro");
  const rewardTypes = formData.getAll("rewardType");
  const rewardAmounts = formData.getAll("rewardAmount");
  const rewardItemIds = formData.getAll("rewardItemId");
  const parsedRewards = z.array(rewardSchema).safeParse(
    rewardTypes.map((rewardType, index) => ({
      rewardType,
      amount: rewardAmounts[index],
      itemId: rewardItemIds[index] ?? "",
    })),
  );
  if (!parsedRewards.success) redirect("/admin/eventos?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/eventos?status=erro");
  const payload = {
    title: parsed.data.title,
    event_type: parsed.data.eventType,
    description: parsed.data.description,
    starts_at: new Date(parsed.data.startsAt).toISOString(),
    registration_label: parsed.data.registrationLabel,
    active: formData.get("active") === "on",
    updated_at: new Date().toISOString(),
  };
  const result = parsed.data.id
    ? await client.from("v2_events").update(payload).eq("id", parsed.data.id).select("id").single()
    : await client.from("v2_events").insert(payload).select("id").single();
  if (result.error) redirect("/admin/eventos?status=erro");
  const eventId = result.data.id;
  const { error: clearRewardsError } = await client
    .from("v2_event_rewards")
    .delete()
    .eq("event_id", eventId);
  if (clearRewardsError) redirect("/admin/eventos?status=erro");
  if (parsedRewards.data.length) {
    const { error: rewardsError } = await client.from("v2_event_rewards").insert(
      parsedRewards.data.map((reward, index) => ({
        event_id: eventId,
        reward_type: reward.rewardType,
        amount: reward.amount,
        item_id: reward.itemId || null,
        sort_order: index,
      })),
    );
    if (rewardsError) redirect("/admin/eventos?status=erro");
  }
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: parsed.data.id ? "event.updated" : "event.created",
    target_type: "event",
    target_id: eventId,
    details: { title: parsed.data.title, rewards: parsedRewards.data.length },
  });
  revalidatePath("/eventos");
  revalidatePath("/admin/eventos");
  redirect("/admin/eventos?status=salvo");
}

export async function deleteEventAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/eventos?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/eventos?status=erro");
  const { data, error } = await client
    .from("v2_events")
    .delete()
    .eq("id", id.data)
    .select("title")
    .single();
  if (error) redirect("/admin/eventos?status=erro");
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "event.deleted",
    target_type: "event",
    target_id: id.data,
    details: { title: data.title },
  });
  revalidatePath("/eventos");
  revalidatePath("/admin/eventos");
  redirect("/admin/eventos?status=apagado");
}
