"use server";

import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const idSchema = z.uuid();
const formatSchema = z.enum(["solo", "duo"]);

type QueueCharacter = {
  id: string;
  name: string;
  level: number;
  rank: string;
  imageUrl?: string | null;
};

type QueueResult = {
  status: "searching" | "matched" | "cancelled" | "expired";
  queueId: string;
  matchId?: string;
  rank: string;
  format: "solo" | "duo";
  secondaryCharacter?: QueueCharacter | null;
  opponent?: QueueCharacter | null;
  opponentSecondary?: QueueCharacter | null;
};

type RpcReply = { data: unknown; error: { message: string } | null };
type UntypedRpc = (fn: string, args: Record<string, unknown>) => Promise<RpcReply>;

function validResult(value: unknown): value is QueueResult {
  return Boolean(
    value &&
      !Array.isArray(value) &&
      typeof value === "object" &&
      "status" in value &&
      "queueId" in value &&
      "format" in value,
  );
}

export async function joinPvpQueueAction(characterId: string, format: "solo" | "duo" = "solo") {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(characterId);
  const parsedFormat = formatSchema.safeParse(format);
  if (!parsed.success || !parsedFormat.success)
    return { ok: false as const, message: "Fila PvP inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Arena indisponível." };
  const rpc = client.rpc.bind(client) as unknown as UntypedRpc;
  const { data, error } = await rpc("v2_join_pvp_queue_v2", {
    p_character_id: parsed.data,
    p_format: parsedFormat.data,
  });
  if (error || !validResult(data))
    return { ok: false as const, message: error?.message ?? "Não foi possível entrar na fila." };
  return { ok: true as const, data };
}

export async function pollPvpQueueAction(queueId: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(queueId);
  if (!parsed.success) return { ok: false as const, message: "Fila inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Arena indisponível." };
  const rpc = client.rpc.bind(client) as unknown as UntypedRpc;
  const { data, error } = await rpc("v2_poll_pvp_queue_v2", { p_queue_id: parsed.data });
  if (error || !validResult(data))
    return { ok: false as const, message: error?.message ?? "Não foi possível consultar a fila." };
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
