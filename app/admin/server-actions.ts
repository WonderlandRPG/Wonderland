"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import { serverStatusKey } from "@/lib/content/server-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function setServerOnlineAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const online = formData.get("online") === "true";
  const confirmation = formData.get("confirmation");

  if (!online && confirmation !== "DESLIGAR") {
    redirect("/admin?servidor=confirmacao-invalida");
  }

  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin?servidor=erro");

  const { error } = await client
    .from("v2_game_settings")
    .update({
      value: online,
      status: "published",
      published_at: new Date().toISOString(),
      updated_by: account.id,
    })
    .eq("key", serverStatusKey);

  if (error) redirect("/admin?servidor=erro");

  if (!online) {
    const { data: elevatedRoles } = await client
      .from("v2_user_roles")
      .select("user_id")
      .in("role", ["admin", "founder"]);
    const elevatedIds = elevatedRoles?.map((entry) => entry.user_id) ?? [];
    let activeCharacters = client.from("v2_active_characters").delete().not("user_id", "is", null);
    if (elevatedIds.length > 0)
      activeCharacters = activeCharacters.not("user_id", "in", `(${elevatedIds.join(",")})`);
    await activeCharacters;
  }

  revalidatePath("/", "layout");
  redirect(`/admin?servidor=${online ? "ligado" : "desligado"}`);
}
