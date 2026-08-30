import Link from "next/link";

import { PlayerWorldMenu } from "@/components/player-world-menu";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getActiveCharacterNavigation } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UpdateNotification } from "@/components/updates/update-notification";

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

  return (
    <header
      className="player-nav"
      data-active-character-rank={activeCharacter?.adventure_rank ?? undefined}
    >
      <BrandMark compact />
      <nav className="player-nav__links" aria-label="Portal dos jogadores">
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
          />
        ) : null}
        {!activeCharacterId && account && isAdministrativeRole(account.role) ? (
          <Link href="/admin">Painel ADM</Link>
        ) : null}
      </nav>
      <div className="player-nav__character">
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
      <section className="player-nav__hud" aria-label="Estado da jornada">
        <div
          className={`player-nav__portrait ${activeCharacter?.image_url ? "has-image" : ""}`}
          style={
            activeCharacter?.image_url
              ? {
                  backgroundImage: `url(${JSON.stringify(activeCharacter.image_url).slice(1, -1)})`,
                }
              : undefined
          }
          aria-hidden="true"
        >
          {!activeCharacter?.image_url ? "W" : null}
        </div>
        <div className="player-nav__hud-copy">
          <small>{activeCharacter ? "Personagem ativo" : "Portal de Wonderland"}</small>
          <strong>
            {activeCharacter?.name ?? (account ? "Escolha seu herói" : "A jornada aguarda")}
          </strong>
        </div>
        <div className="player-nav__hud-stat">
          <small>Nível</small>
          <strong>{activeCharacter?.level ?? "—"}</strong>
        </div>
        <div className="player-nav__hud-stat is-rank">
          <small>Rank</small>
          <strong>{activeCharacter?.adventure_rank ?? "—"}</strong>
        </div>
        <div className="player-nav__energy" aria-hidden="true">
          <span />
        </div>
        <Link className="player-nav__hud-action" href={account ? "/personagens" : "/entrar"}>
          {account ? "Trocar personagem" : "Entrar no jogo"}
        </Link>
      </section>
      {hasUnseenUpdate && latestUpdate ? <UpdateNotification update={latestUpdate} /> : null}
    </header>
  );
}
