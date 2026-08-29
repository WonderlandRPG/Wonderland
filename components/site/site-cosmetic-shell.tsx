import type { ReactNode } from "react";

import { getCurrentAccount } from "@/lib/auth/account";
import { getActiveCharacterId } from "@/lib/content/active-character";
import { parseCharacterCosmetics } from "@/lib/content/character-cosmetics";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function SiteCosmeticShell({ children }: { children: ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) return <>{children}</>;

  const characterId = await getActiveCharacterId(account.id);
  if (!characterId) return <>{children}</>;

  const client = await createServerSupabaseClient();
  const { data } = client
    ? await client
        .from("v2_characters")
        .select("cosmetics")
        .eq("id", characterId)
        .eq("user_id", account.id)
        .maybeSingle()
    : { data: null };

  const cosmetics = parseCharacterCosmetics(data?.cosmetics);
  const hasGlobalCosmetic = Boolean(cosmetics.background || cosmetics.theme);

  if (!hasGlobalCosmetic) return <>{children}</>;

  return (
    <div
      className="site-cosmetic-shell"
      data-site-background={cosmetics.background ?? undefined}
      data-site-theme={cosmetics.theme ?? undefined}
    >
      <span aria-hidden="true" className="site-cosmetic-shell__atmosphere" />
      {children}
    </div>
  );
}
