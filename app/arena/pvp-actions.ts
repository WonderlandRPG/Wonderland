"use server";

import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const idSchema = z.uuid();
const formatSchema = z.enum(["solo", "duo"]);
const searchSchema = z.string().trim().min(2).max(60);

export type QueueCharacter = {
  id: string;
  name: string;
  level: number;
  rank: string;
  imageUrl?: string | null;
};

export type QueueState = {
  status: "searching" | "matched" | "cancelled" | "expired";
  queueId: string;
  matchId?: string | null;
  rank: string;
  format: "solo" | "duo";
  secondaryCharacter?: QueueCharacter | null;
  opponent?: QueueCharacter | null;
  opponentSecondary?: QueueCharacter | null;
};

export type PvpPartyInvite = {
  id: string;
  createdAt: string;
  expiresAt: string;
  character: QueueCharacter;
};

export type PvpParty = {
  id: string;
  rank: string;
  createdAt: string;
  ownCharacter: QueueCharacter;
  partner: QueueCharacter;
};

export type PvpPartyState = {
  party: PvpParty | null;
  incoming: PvpPartyInvite[];
  outgoing: PvpPartyInvite[];
  queue: QueueState | null;
};

type RpcReply = { data: unknown; error: { message: string } | null };
type UntypedRpc = (fn: string, args: Record<string, unknown>) => Promise<RpcReply>;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && !Array.isArray(value) && typeof value === "object");
}

function validResult(value: unknown): value is QueueState {
  return Boolean(
    isObject(value) &&
      typeof value.status === "string" &&
      typeof value.queueId === "string" &&
      typeof value.format === "string",
  );
}

function validPartyState(value: unknown): value is PvpPartyState {
  return Boolean(
    isObject(value) &&
      Array.isArray(value.incoming) &&
      Array.isArray(value.outgoing) &&
      "party" in value &&
      "queue" in value,
  );
}

function validCharacters(value: unknown): value is QueueCharacter[] {
  return Array.isArray(value) && value.every((entry) => isObject(entry) && typeof entry.id === "string" && typeof entry.name === "string");
}

async function rpcClient() {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  return { client, rpc: client.rpc.bind(client) as unknown as UntypedRpc };
}

export async function joinPvpQueueAction(characterId: string, format: "solo" | "duo" = "solo") {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(characterId);
  const parsedFormat = formatSchema.safeParse(format);
  if (!parsed.success || !parsedFormat.success)
    return { ok: false as const, message: "Fila PvP inválida." };
  const context = await rpcClient();
  if (!context) return { ok: false as const, message: "Arena indisponível." };
  const { data, error } = await context.rpc("v2_join_pvp_queue_v2", {
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
  const context = await rpcClient();
  if (!context) return { ok: false as const, message: "Arena indisponível." };
  const { data, error } = await context.rpc("v2_poll_pvp_queue_v2", { p_queue_id: parsed.data });
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

export async function getPvpPartyStateAction(characterId: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(characterId);
  if (!parsed.success) return { ok: false as const, message: "Personagem inválido." };
  const context = await rpcClient();
  if (!context) return { ok: false as const, message: "Arena indisponível." };
  const { data, error } = await context.rpc("v2_get_pvp_party_state", { p_character_id: parsed.data });
  if (error || !validPartyState(data))
    return { ok: false as const, message: error?.message ?? "Não foi possível consultar sua dupla." };
  return { ok: true as const, data };
}

export async function searchPvpPartnerAction(characterId: string, query: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsedId = idSchema.safeParse(characterId);
  const parsedQuery = searchSchema.safeParse(query);
  if (!parsedId.success || !parsedQuery.success)
    return { ok: false as const, message: "Digite pelo menos 2 letras do nome do personagem." };
  const context = await rpcClient();
  if (!context) return { ok: false as const, message: "Arena indisponível." };
  const { data, error } = await context.rpc("v2_search_pvp_partner", {
    p_character_id: parsedId.data,
    p_query: parsedQuery.data,
  });
  if (error || !validCharacters(data))
    return { ok: false as const, message: error?.message ?? "Não foi possível procurar jogadores." };
  return { ok: true as const, data };
}

export async function invitePvpPartnerAction(characterId: string, targetCharacterId: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsedOwn = idSchema.safeParse(characterId);
  const parsedTarget = idSchema.safeParse(targetCharacterId);
  if (!parsedOwn.success || !parsedTarget.success)
    return { ok: false as const, message: "Convite inválido." };
  const context = await rpcClient();
  if (!context) return { ok: false as const, message: "Arena indisponível." };
  const { error } = await context.rpc("v2_invite_pvp_partner", {
    p_character_id: parsedOwn.data,
    p_target_character_id: parsedTarget.data,
  });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}

export async function respondPvpPartyInviteAction(inviteId: string, accept: boolean) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(inviteId);
  if (!parsed.success) return { ok: false as const, message: "Convite inválido." };
  const context = await rpcClient();
  if (!context) return { ok: false as const, message: "Arena indisponível." };
  const { error } = await context.rpc("v2_respond_pvp_party_invite", {
    p_invite_id: parsed.data,
    p_accept: accept,
  });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}

export async function cancelPvpPartyInviteAction(inviteId: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(inviteId);
  if (!parsed.success) return { ok: false as const };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const };
  const { error } = await client.rpc("v2_cancel_pvp_party_invite" as never, { p_invite_id: parsed.data } as never);
  return { ok: !error } as const;
}

export async function disbandPvpPartyAction(partyId: string) {
  await requireCurrentAccount("/arena?modo=pvp");
  const parsed = idSchema.safeParse(partyId);
  if (!parsed.success) return { ok: false as const, message: "Dupla inválida." };
  const context = await rpcClient();
  if (!context) return { ok: false as const, message: "Arena indisponível." };
  const { error } = await context.rpc("v2_disband_pvp_party", { p_party_id: parsed.data });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}
