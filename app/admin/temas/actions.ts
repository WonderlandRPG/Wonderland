"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveThemesAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/temas?status=erro");
  const value = {
    classic: true,
    accessible: formData.get("accessible") === "on",
    christmas: formData.get("christmas") === "on",
  };
  const { error } = await client.from("v2_game_settings").upsert({
    key: "appearance.available_themes",
    category: "appearance",
    label: "Temas disponíveis",
    description: "Define quais temas podem ser escolhidos pelos jogadores.",
    value,
    status: "published",
    updated_by: account.id,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) redirect("/admin/temas?status=erro");
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "themes.availability.updated",
    target_type: "game_setting",
    target_id: "appearance.available_themes",
    details: value,
  });
  revalidatePath("/", "layout");
  redirect("/admin/temas?status=salvo");
}
