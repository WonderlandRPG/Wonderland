"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireCurrentAccount } from "@/lib/auth/account";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { redirect } from "next/navigation";
import type { Json } from "@/lib/db/types";

export async function startPveAction() {
  const { characterId } = await requireActiveCharacter("/arena");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/arena?mensagem=Banco%20indisponível");
  const { data: mission, error: missionError } = await client
    .from("v2_mission_assignments")
    .select("id")
    .eq("character_id", characterId)
    .eq("status", "in_progress")
    .limit(1);
  if (missionError) redirect("/arena?mensagem=Não%20foi%20possível%20verificar%20as%20missões");
  if (mission?.length) redirect("/missoes");
  const { data, error } = await client.rpc("v2_start_arena_session", {
    p_character_id: characterId,
    p_mode: "pve",
  });
  if (error || !data)
    redirect(
      `/arena?mensagem=${encodeURIComponent(error?.message ?? "Não foi possível iniciar a luta")}`,
    );
  redirect(`/arena?modo=pve&sessao=${data}`);
}

export async function claimArenaVictoryAction(sessionId: string) {
  await requireCurrentAccount("/arena");
  const parsed = z.uuid().safeParse(sessionId);
  if (!parsed.success) return { ok: false as const, message: "Sessão de combate inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { error: stateError } = await client.rpc("v2_save_pve_battle_state", {
    p_session_id: parsed.data,
    p_state: { version: 1, outcome: "victory" },
  });
  if (stateError) return { ok: false as const, message: stateError.message };
  const { data, error } = await client.rpc("v2_claim_arena_victory", { p_session_id: parsed.data });
  if (error || !data || Array.isArray(data) || typeof data !== "object")
    return {
      ok: false as const,
      message: error?.message ?? "Não foi possível entregar a recompensa.",
    };
  revalidatePath("/personagens");
  if (typeof data.character_id === "string") revalidatePath(`/personagens/${data.character_id}`);
  revalidatePath("/ranking");
  return { ok: true as const, xp: Number(data.xp ?? 0), wg: Number(data.wg ?? 0) };
}

export async function finishArenaDefeatAction(sessionId: string) {
  await requireCurrentAccount("/arena");
  const parsed = z.uuid().safeParse(sessionId);
  if (!parsed.success) return { ok: false as const, message: "Sessão de combate inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { error } = await client.rpc("v2_finish_pve_defeat", { p_session_id: parsed.data });
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/arena/historico");
  return { ok: true as const };
}

export async function savePveBattleStateAction(sessionId: string, state: unknown) {
  await requireCurrentAccount("/arena");
  const parsedId = z.uuid().safeParse(sessionId);
  const parsedState = z
    .object({
      version: z.literal(1),
      mapId: z.string().min(1),
      characterId: z.uuid(),
      creatureId: z.uuid(),
      outcome: z.enum(["ongoing", "victory", "defeat", "draw"]),
    })
    .passthrough()
    .safeParse(state);
  if (
    !parsedId.success ||
    !parsedState.success ||
    JSON.stringify(parsedState.data).length > 120_000
  )
    return;
  const client = await createServerSupabaseClient();
  if (!client) return;
  await client.rpc("v2_save_pve_battle_state", {
    p_session_id: parsedId.data,
    p_state: parsedState.data as Json,
  });
}
