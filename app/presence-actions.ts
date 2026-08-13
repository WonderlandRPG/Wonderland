"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function touchPlayerPresenceAction() {
  const client = await createServerSupabaseClient();
  if (!client) return;
  await client.rpc("v2_touch_player_presence");
}
