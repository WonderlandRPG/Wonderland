"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { themeDefinitions, type ThemeName } from "@/lib/content/theme-definitions";

export async function saveThemesAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/temas?status=erro");
  const requestedDefault = String(formData.get("defaultTheme") ?? "classic") as ThemeName;
  const value = Object.fromEntries(
    themeDefinitions.map((theme) => [theme.key, formData.get(`available_${theme.key}`) === "on"]),
  ) as Record<ThemeName, boolean>;
  value[requestedDefault] = true;
  const now = new Date().toISOString();
  const { error } = await client.from("v2_game_settings").upsert([
    {
      key: "appearance.available_themes",
      category: "appearance",
      label: "Temas disponíveis",
      description: "Define quais temas podem ser escolhidos pelos jogadores.",
      value,
      status: "published",
      updated_by: account.id,
      published_at: now,
      updated_at: now,
    },
    {
      key: "appearance.default_theme",
      category: "appearance",
      label: "Tema padrão",
      description: "Define o tema usado no primeiro acesso ao site.",
      value: requestedDefault,
      status: "published",
      updated_by: account.id,
      published_at: now,
      updated_at: now,
    },
  ]);
  if (error) redirect("/admin/temas?status=erro");
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "themes.availability.updated",
    target_type: "game_setting",
    target_id: "appearance.available_themes",
    details: { availability: value, defaultTheme: requestedDefault },
  });
  revalidatePath("/", "layout");
  redirect("/admin/temas?status=salvo");
}
