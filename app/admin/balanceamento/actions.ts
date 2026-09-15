"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const settingSchema = z.object({
  key: z.string().trim().min(1).max(120),
  expectedRevision: z.coerce.number().int().min(0),
  value: z.string().trim().min(1),
  status: z.enum(["draft", "published", "archived"]),
});

export async function updateGameSettingAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const parsed = settingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/balanceamento?status=erro-validacao");

  let value: Json;
  try {
    value = JSON.parse(parsed.data.value) as Json;
  } catch {
    redirect("/admin/balanceamento?status=json-invalido");
  }

  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/balanceamento?status=banco-indisponivel");

  const { data, error } = await client
    .from("v2_game_settings")
    .update({
      value,
      status: parsed.data.status,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      updated_by: account.id,
    })
    .eq("key", parsed.data.key)
    .eq("revision", parsed.data.expectedRevision)
    .select("key")
    .maybeSingle();

  if (error || !data) redirect("/admin/balanceamento?status=conflito");

  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "game_setting.updated",
    target_type: "game_setting",
    target_id: parsed.data.key,
    details: { value, status: parsed.data.status },
  });

  revalidatePath("/admin/balanceamento");
  revalidatePath("/combate");
  redirect(`/admin/balanceamento?status=salvo&chave=${encodeURIComponent(parsed.data.key)}`);
}
