"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase/server";

export async function claimPresenceRewardAction() {
  const { characterId } = await requireActiveCharacter("/presenca");
  const client = await createAuthenticatedServerSupabaseClient();
  if (!client) redirect("/presenca?status=erro");
  const { data, error } = await client.rpc("v2_claim_daily_reward", {});
  if (error) {
    console.error("[presence-claim] rpc failed", {
      code: error.code,
      details: error.details,
      message: error.message,
      characterId,
    });
    const message = error.message.toLocaleLowerCase("pt-BR");
    const status = message.includes("já marcada")
      ? "ja_marcada"
      : message.includes("não está disponível")
        ? "indisponivel"
        : message.includes("já foram resgatadas")
          ? "concluido"
          : "erro";
    redirect(`/presenca?status=${status}`);
  }
  if (data && typeof data === "object" && "already_claimed" in data && data.already_claimed) {
    revalidatePath("/presenca");
    redirect("/presenca?status=ja_marcada");
  }
  revalidatePath("/presenca");
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/arena");
  redirect("/presenca?status=resgatado");
}
