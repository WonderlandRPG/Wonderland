"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/config/env";
import type { Database } from "@/lib/db/types";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabasePublicEnv();

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient<Database>(url, anonKey);
}
