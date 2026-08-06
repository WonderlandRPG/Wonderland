import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { UserRole } from "@/lib/db/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CurrentAccount {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

export const roleLabels: Record<UserRole, string> = {
  player: "Jogador",
  moderator: "Moderador",
  admin: "Administrador",
  founder: "Fundador",
};

export function isAdministrativeRole(role: UserRole) {
  return role === "admin" || role === "founder";
}

export const getCurrentAccount = cache(async (): Promise<CurrentAccount | null> => {
  const supabase = await createServerSupabaseClient();

  if (!supabase) return null;

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : "";

  if (claimsError || !claims || !userId) return null;

  const [{ data: profile }, { data: roleRecord }] = await Promise.all([
    supabase
      .from("v2_profiles")
      .select("display_name, avatar_url, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("v2_user_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);

  const email = typeof claims.email === "string" ? claims.email : "";
  const fallbackName = email.split("@")[0] || "Jogador";

  return {
    id: userId,
    email,
    displayName: profile?.display_name?.trim() || fallbackName,
    avatarUrl: profile?.avatar_url ?? null,
    role: roleRecord?.role ?? "player",
    createdAt:
      profile?.created_at ??
      (typeof claims.iat === "number"
        ? new Date(claims.iat * 1000).toISOString()
        : new Date().toISOString()),
  };
});

export async function requireCurrentAccount(nextPath = "/perfil") {
  const account = await getCurrentAccount();

  if (!account) {
    redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
  }

  return account;
}

export async function requireAdministrativeAccount() {
  const account = await requireCurrentAccount("/admin");

  if (!isAdministrativeRole(account.role)) {
    redirect("/perfil?status=acesso-negado");
  }

  return account;
}
