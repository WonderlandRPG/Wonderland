import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv } from "@/lib/config/env";
import type { Database } from "@/lib/db/types";

const maintenancePath = "/manutencao";

export async function refreshSupabaseSession(request: NextRequest) {
  const { url, anonKey } = getSupabasePublicEnv();

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const { data: status } = await supabase
    .from("v2_game_settings")
    .select("value")
    .eq("key", "system.server_online")
    .eq("status", "published")
    .maybeSingle();

  if (status?.value === false) {
    const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : "";
    const { data: roleRecord } = userId
      ? await supabase.from("v2_user_roles").select("role").eq("user_id", userId).maybeSingle()
      : { data: null };
    const administrative = roleRecord?.role === "admin" || roleRecord?.role === "founder";
    const publicDuringMaintenance =
      request.nextUrl.pathname === maintenancePath ||
      request.nextUrl.pathname.startsWith("/entrar") ||
      request.nextUrl.pathname.startsWith("/auth/");

    if (userId && !administrative) await supabase.auth.signOut({ scope: "global" });

    if (!administrative && !publicDuringMaintenance) {
      const destination = request.nextUrl.clone();
      destination.pathname = maintenancePath;
      destination.search = "";
      const redirectResponse = NextResponse.redirect(destination);
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  return response;
}
