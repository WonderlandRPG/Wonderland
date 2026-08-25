import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

/**
 * Cliente para mutações sensíveis executadas por Server Actions.
 *
 * O cliente SSR continua sendo a fonte da sessão em cookie. Depois de validar
 * o JWT, o token é anexado explicitamente ao cliente da mutação para impedir
 * que a chamada RPC chegue ao PostgREST com o papel `anon` em alguns celulares.
 */
export async function createAuthenticatedServerSupabaseClient() {
  const cookieClient = await createServerSupabaseClient();
  if (!cookieClient) return null;

  const [{ data: claimsData, error: claimsError }, { data: sessionData, error: sessionError }] =
    await Promise.all([cookieClient.auth.getClaims(), cookieClient.auth.getSession()]);
  const subject = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : "";
  const session = sessionData.session;

  if (
    claimsError ||
    sessionError ||
    !subject ||
    !session?.access_token ||
    session.user.id !== subject
  ) {
    return null;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  });
}
