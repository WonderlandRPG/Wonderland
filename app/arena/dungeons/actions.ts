"use server";

import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const dungeonKey = z.literal("ruinas-de-verdantia");
const characterId = z.uuid();

export type DungeonQueueEntry = {
  id: string;
  userId: string;
  characterId: string;
  joinedAt: string;
  name: string;
  level: number;
  rank: string;
  imageUrl: string | null;
};

function queueEntries(value: unknown): DungeonQueueEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is DungeonQueueEntry => {
    if (!entry || typeof entry !== "object") return false;
    const row = entry as Record<string, unknown>;
    return (
      typeof row.id === "string" &&
      typeof row.characterId === "string" &&
      typeof row.name === "string"
    );
  });
}

export async function getDungeonQueueAction(key: string) {
  await requireAdministrativeAccount();
  const parsed = dungeonKey.safeParse(key);
  if (!parsed.success) return { ok: false as const, message: "Dungeon inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data, error } = await client.rpc("v2_get_dungeon_queue", { p_dungeon_key: parsed.data });
  return error
    ? { ok: false as const, message: error.message }
    : { ok: true as const, data: queueEntries(data) };
}

export async function joinDungeonQueueAction(key: string, selectedCharacterId: string) {
  await requireAdministrativeAccount();
  const parsedKey = dungeonKey.safeParse(key),
    parsedCharacter = characterId.safeParse(selectedCharacterId);
  if (!parsedKey.success || !parsedCharacter.success)
    return { ok: false as const, message: "Personagem ou Dungeon inválidos." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data, error } = await client.rpc("v2_join_dungeon_queue", {
    p_dungeon_key: parsedKey.data,
    p_character_id: parsedCharacter.data,
  });
  if (error) return { ok: false as const, message: error.message };
  if (data && typeof data === "object" && !Array.isArray(data) && "runId" in data)
    return { ok: true as const, data: queueEntries([]), runId: String(data.runId) };
  return getDungeonQueueAction(parsedKey.data);
}

export async function leaveDungeonQueueAction(key: string) {
  await requireAdministrativeAccount();
  const parsed = dungeonKey.safeParse(key);
  if (!parsed.success) return { ok: false as const, message: "Dungeon inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { error } = await client.rpc("v2_leave_dungeon_queue", { p_dungeon_key: parsed.data });
  if (error) return { ok: false as const, message: error.message };
  return getDungeonQueueAction(parsed.data);
}

export async function getOwnActiveDungeonRunAction(key: string) {
  await requireAdministrativeAccount();
  const parsed = dungeonKey.safeParse(key);
  if (!parsed.success) return { ok: false as const, message: "Dungeon inválida." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data, error } = await client.rpc("v2_get_own_active_dungeon_run", {
    p_dungeon_key: parsed.data,
  });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, runId: typeof data === "string" ? data : null };
}
