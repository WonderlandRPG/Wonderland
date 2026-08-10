"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireCurrentAccount } from "@/lib/auth/account";

export async function claimArenaVictoryAction(sessionId: string) {
  await requireCurrentAccount("/arena");
  const parsed = z.uuid().safeParse(sessionId);
  if (!parsed.success) return { ok: false as const, message: "Sessão de combate inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data, error } = await client.rpc("v2_claim_arena_victory", { p_session_id: parsed.data });
  if (error || !data || Array.isArray(data) || typeof data !== "object") return { ok: false as const, message: error?.message ?? "Não foi possível entregar a recompensa." };
  revalidatePath("/arena");
  revalidatePath("/personagens");
  if (typeof data.character_id === "string") revalidatePath(`/personagens/${data.character_id}`);
  revalidatePath("/ranking");
  return { ok: true as const, xp: Number(data.xp ?? 0), wg: Number(data.wg ?? 0) };
}
