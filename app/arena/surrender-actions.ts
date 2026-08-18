"use server";

import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const kindSchema = z.enum(["arena", "pvp", "dungeon"]);
const idSchema = z.uuid();

type SurrenderStatus = {
  completed: boolean;
  votes: number;
  required: number;
  voted: boolean;
};

type RpcReply = { data: unknown; error: { message: string } | null };
type UntypedRpc = (fn: string, args: Record<string, unknown>) => Promise<RpcReply>;

function parseStatus(value: unknown): SurrenderStatus | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.completed !== "boolean" ||
    typeof row.votes !== "number" ||
    typeof row.required !== "number" ||
    typeof row.voted !== "boolean"
  ) return null;
  return row as unknown as SurrenderStatus;
}

async function callSurrenderRpc(fn: string, kind: string, combatId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const rpc = client.rpc.bind(client) as unknown as UntypedRpc;
  const { data, error } = await rpc(fn, { p_kind: kind, p_combat_id: combatId });
  const status = parseStatus(data);
  if (error || !status)
    return { ok: false as const, message: error?.message ?? "Não foi possível registrar a desistência." };
  return { ok: true as const, data: status };
}

export async function getCombatSurrenderStatusAction(kind: string, combatId: string) {
  await requireCurrentAccount("/arena");
  const parsedKind = kindSchema.safeParse(kind);
  const parsedId = idSchema.safeParse(combatId);
  if (!parsedKind.success || !parsedId.success)
    return { ok: false as const, message: "Combate inválido." };
  return callSurrenderRpc("v2_combat_surrender_status", parsedKind.data, parsedId.data);
}

export async function requestCombatSurrenderAction(kind: string, combatId: string) {
  await requireCurrentAccount("/arena");
  const parsedKind = kindSchema.safeParse(kind);
  const parsedId = idSchema.safeParse(combatId);
  if (!parsedKind.success || !parsedId.success)
    return { ok: false as const, message: "Combate inválido." };
  return callSurrenderRpc("v2_request_combat_surrender", parsedKind.data, parsedId.data);
}
