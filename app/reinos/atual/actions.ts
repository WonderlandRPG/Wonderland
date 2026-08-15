"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export async function buyKingdomStarAction() {
  const { characterId } = await requireActiveCharacter("/reinos/atual");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/reinos/atual?status=erro");
  const { error } = await client.rpc("v2_buy_kingdom_star", { p_character_id: characterId });
  revalidatePath("/reinos/atual");
  revalidatePath("/admin/reinos");
  redirect(
    error
      ? `/reinos/atual?status=erro&mensagem=${encodeURIComponent(error.message)}`
      : "/reinos/atual?status=comprada",
  );
}
