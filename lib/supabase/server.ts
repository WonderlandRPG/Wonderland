import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "@/lib/config/env";
import type { Database } from "@/lib/db/types";

export async function createServerSupabaseClient() {
  const { url, anonKey } = getSupabasePublicEnv();

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components não podem gravar cookies. O proxy de autenticação
          // assumirá essa atualização quando for adicionado na etapa de contas.
        }
      },
    },
  });
}
