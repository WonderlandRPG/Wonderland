import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const serverStatusKey = "system.server_online";

function parseServerStatus(value: unknown) {
  return value !== false;
}

export async function getServerOnline(client?: SupabaseClient<Database> | null) {
  const supabase = client ?? (await createServerSupabaseClient());
  if (!supabase) return true;

  const { data, error } = await supabase
    .from("v2_game_settings")
    .select("value")
    .eq("key", serverStatusKey)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return true;
  return parseServerStatus(data.value);
}
