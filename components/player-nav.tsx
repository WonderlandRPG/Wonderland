import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { PlayerWorldMenu } from "@/components/player-world-menu";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getActiveCharacterNavigation } from "@/lib/content/active-character";

import styles from "./player-nav.module.css";

export async function PlayerNav() {
  const account = await getCurrentAccount();
  const activeCharacter = account ? await getActiveCharacterNavigation(account.id) : null;
  const activeCharacterId = activeCharacter?.id ?? null;

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <BrandMark inverse />
      </div>

      <nav className={styles.nav} aria-label="Portal dos jogadores">
        <div className={styles.chronicles}>
          <Link className={styles.link} href="/racas">Raças</Link>
          <Link className={styles.link} href="/classes">Classes</Link>
          <Link className={styles.link} href="/historia">História</Link>
          <Link className={styles.link} href="/reinos">Reinos</Link>
        </div>

        {activeCharacterId ? (
          <div className={styles.adventure}>
            <Link className={styles.link} href="/personagens">Jogar</Link>
            <PlayerWorldMenu
              activeCharacterId={activeCharacterId}
              isAdmin={Boolean(account && isAdministrativeRole(account.role))}
            />
          </div>
        ) : null}

        {!activeCharacterId && account && isAdministrativeRole(account.role) ? (
          <Link className={styles.link} href="/admin">Painel ADM</Link>
        ) : null}

        {activeCharacter ? (
          <Link className={styles.character} href="/personagens">
            <span
              className={styles.avatar}
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
