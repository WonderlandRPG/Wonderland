"use server";

import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const idSchema = z.uuid();
type QueueResult = {
  status: "searching" | "matched" | "cancelled" | "expired";
  queueId: string;
  matchId?: string;
  rank: string;
  opponent?: { id: string; name: string; level: number; rank: string; imageUrl?: string | null } | null;
};

function validResult(value: unknown): value is QueueResult {
  return Boolean(value && !Array.isArray(value) && typeof value === "object" && "status" in value && "queueId" in value);
}

export async function joinPvpQueueAction(characterId: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(characterId);
  if (!parsed.success) return { ok: false as const, message: "Personagem inválido." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Arena indisponível." };
  const { data, error } = await client.rpc("v2_join_pvp_queue", { p_character_id: parsed.data });
  if (error || !validResult(data)) return { ok: false as const, message: error?.message ?? "Não foi possível entrar na fila." };
  return { ok: true as const, data };
}

export async function pollPvpQueueAction(queueId: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(queueId);
  if (!parsed.success) return { ok: false as const, message: "Fila inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Arena indisponível." };
  const { data, error } = await client.rpc("v2_poll_pvp_queue", { p_queue_id: parsed.data });
  if (error || !validResult(data)) return { ok: false as const, message: error?.message ?? "Não foi possível consultar a fila." };
  return { ok: true as const, data };
}

export async function cancelPvpQueueAction(queueId: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(queueId);
  if (!parsed.success) return { ok: false as const };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const };
  const { error } = await client.rpc("v2_cancel_pvp_queue", { p_queue_id: parsed.data });
  return { ok: !error } as const;
}
