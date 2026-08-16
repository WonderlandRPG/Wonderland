import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getActiveCharacterNavigation } from "@/lib/content/active-character";
import { PlayerWorldMenu } from "@/components/player-world-menu";

export async function PlayerNav() {
  const account = await getCurrentAccount();
  const activeCharacter = account ? await getActiveCharacterNavigation(account.id) : null;
  const activeCharacterId = activeCharacter?.id ?? null;

  return (
    <header className="player-nav page-container">
      <Link className="player-nav__brand" href={activeCharacter ? "/personagens" : "/"}>
        <BrandMark inverse />
      </Link>
      <nav aria-label="Portal dos jogadores">
        <div className="player-nav__chronicles">
          <Link href="/racas">Raças</Link>
          <Link href="/classes">Classes</Link>
          <Link href="/historia">História</Link>
          <Link href="/reinos">Reinos</Link>
        </div>

        {activeCharacterId ? (
          <div className="player-nav__adventure">
            <Link href="/personagens">Jogar</Link>
            <PlayerWorldMenu
              activeCharacterId={activeCharacterId}
              isAdmin={Boolean(account && isAdministrativeRole(account.role))}
            />
          </div>
        ) : null}

        {!activeCharacterId && account && isAdministrativeRole(account.role) ? (
          <Link href="/admin">Painel ADM</Link>
        ) : null}

        {activeCharacter ? (
          <Link className="player-nav__character" href="/personagens">
            <span
              className={activeCharacter.image_url ? "is-image" : ""}
              style={
                activeCharacter.image_url
                  ? { backgroundImage: `url(${activeCharacter.image_url})` }
                  : undefined
              }
            >
              {activeCharacter.image_url ? "" : activeCharacter.name.slice(0, 2).toUpperCase()}
            </span>
            <b>
              {activeCharacter.name}
              <small>Nível {activeCharacter.level}</small>
            </b>
          </Link>
        ) : (
          <Link
            className="button button--small button--glass"
            href={account ? "/personagens?selecionar=1" : "/entrar"}
          >
            {account ? "Escolher personagem" : "Entrar"}
          </Link>
        )}
      </nav>
    </header>
  );
}
