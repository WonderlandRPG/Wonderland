"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  version: z.string().trim().min(1).max(20),
  title: z.string().trim().min(2).max(120),
  notes: z.string().trim().min(2),
  publishedOn: z.iso.date(),
});
export async function saveUpdateAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const parsed = schema.safeParse({
    id: formData.get("id") ?? "",
    version: formData.get("version"),
    title: formData.get("title"),
    notes: formData.get("notes"),
    publishedOn: formData.get("publishedOn"),
  });
  if (!parsed.success) redirect("/admin/atualizacoes?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/atualizacoes?status=erro");
  const payload = {
    version: parsed.data.version,
    title: parsed.data.title,
    notes: parsed.data.notes
      .split("\n")
      .map((note) => note.trim())
      .filter(Boolean),
    published_on: parsed.data.publishedOn,
    active: formData.get("active") === "on",
    updated_at: new Date().toISOString(),
  };
  const result = parsed.data.id
    ? await client.from("v2_updates").update(payload).eq("id", parsed.data.id)
    : await client.from("v2_updates").insert(payload);
  if (result.error) redirect("/admin/atualizacoes?status=erro");
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: parsed.data.id ? "update.updated" : "update.created",
    target_type: "update",
    target_id: parsed.data.id || null,
    details: { version: parsed.data.version },
  });
  revalidatePath("/atualizacoes");
  revalidatePath("/admin/atualizacoes");
  redirect("/admin/atualizacoes?status=salvo");
}
