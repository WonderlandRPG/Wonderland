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
    ? await client.from("v2_events").update(payload).eq("id", parsed.data.id)
    : await client.from("v2_events").insert(payload);
  if (result.error) redirect("/admin/eventos?status=erro");
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: parsed.data.id ? "event.updated" : "event.created",
    target_type: "event",
    target_id: parsed.data.id || null,
    details: { title: parsed.data.title },
  });
  revalidatePath("/eventos");
  revalidatePath("/admin/eventos");
  redirect("/admin/eventos?status=salvo");
}
