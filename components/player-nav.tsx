import Link from "next/link";

import { PlayerWorldMenu } from "@/components/player-world-menu";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getActiveCharacterNavigation } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UpdateNotification } from "@/components/updates/update-notification";
import styles from "./player-nav.module.css";

export async function PlayerNav() {
  const account = await getCurrentAccount();
  const activeCharacter = account ? await getActiveCharacterNavigation(account.id) : null;
  const activeCharacterId = activeCharacter?.id ?? null;
  const client = account ? await createServerSupabaseClient() : null;
  const { data: latestUpdate } = client
    ? await client
        .from("v2_updates")
        .select("id, version, title")
        .eq("active", true)
        .order("published_on", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const { data: updateReceipt } =
    client && latestUpdate
      ? await client
          .from("v2_update_reads")
          .select("update_id, seen_at, read_at")
          .eq("user_id", account!.id)
          .eq("update_id", latestUpdate.id)
          .maybeSingle()
      : { data: null };
  const hasUnreadUpdate = Boolean(latestUpdate && !updateReceipt?.read_at);
  const hasUnseenUpdate = Boolean(latestUpdate && !updateReceipt?.seen_at);
  const { count: unreadNotifications } = client
    ? await client.from("v2_notifications").select("id", { count: "exact", head: true }).is("read_at", null)
    : { count: 0 };

  return (
    <header
      className={`player-nav ${styles.header}`}
      data-active-character-rank={activeCharacter?.adventure_rank ?? undefined}
    >
      <BrandMark compact />
      <nav className={styles.links} aria-label="Portal dos jogadores">
        <Link href="/racas">Raças</Link>
        <Link href="/classes">Classes</Link>
        <Link href="/historia">História</Link>
        <Link href="/reinos">Reinos</Link>
        {activeCharacterId ? <Link href="/personagens">Jogar</Link> : null}
        {activeCharacterId ? (
          <PlayerWorldMenu
            activeCharacterId={activeCharacterId}
            isAdmin={Boolean(account && isAdministrativeRole(account.role))}
            hasUnreadUpdate={hasUnreadUpdate}
            unreadNotifications={unreadNotifications ?? 0}
          />
        ) : null}
        {!activeCharacterId && account && isAdministrativeRole(account.role) ? (
          <Link href="/admin">Painel ADM</Link>
        ) : null}
      </nav>
      <div className={styles.character}>
        {activeCharacter ? (
          <Link href="/personagens">
            <span>{activeCharacter.name}</span>
            <small>
              Nível {activeCharacter.level} · Rank {activeCharacter.adventure_rank}
            </small>
          </Link>
        ) : (
          <Link href={account ? "/personagens?selecionar=1" : "/entrar"}>
            {account ? "Escolher personagem" : "Entrar"}
          </Link>
        )}
      </div>
      {hasUnseenUpdate && latestUpdate ? <UpdateNotification update={latestUpdate} /> : null}
    </header>
  );
}
