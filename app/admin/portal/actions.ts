"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import { defaultPortalHeadline } from "@/lib/content/portal-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function savePortalHeadlineAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const seasonLabel = String(formData.get("seasonLabel") ?? "").trim();
  const firstLine = String(formData.get("firstLine") ?? "").trim();
  const secondLine = String(formData.get("secondLine") ?? "").trim();

  if (!seasonLabel || !firstLine || !secondLine || seasonLabel.length > 60 || firstLine.length > 80 || secondLine.length > 80) {
    redirect("/admin/portal?status=invalido");
  }

  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/portal?status=erro");

  const value = { seasonLabel, firstLine, secondLine };
  const now = new Date().toISOString();
  const { error } = await client.from("v2_game_settings").upsert({
    key: "portal.launch_headline",
    category: "appearance",
    label: "Chamada principal do portal",
    description: "Texto de destaque exibido na tela principal de Wonderland, incluindo o rótulo da temporada.",
    value,
    status: "published",
    updated_by: account.id,
    published_at: now,
    updated_at: now,
  });

  if (error) redirect("/admin/portal?status=erro");

  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "portal.headline.updated",
    target_type: "game_setting",
    target_id: "portal.launch_headline",
    details: value,
  });

  revalidatePath("/");
  revalidatePath("/admin/portal");
  redirect("/admin/portal?status=salvo");
}

export async function restorePortalHeadlineAction(formData: FormData) {
  void formData;
  const resetData = new FormData();
  resetData.set("seasonLabel", defaultPortalHeadline.seasonLabel);
  resetData.set("firstLine", defaultPortalHeadline.firstLine);
  resetData.set("secondLine", defaultPortalHeadline.secondLine);
  await savePortalHeadlineAction(resetData);
}
