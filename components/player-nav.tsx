import Link from "next/link";

import { PlayerWorldMenu } from "@/components/player-world-menu";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getActiveCharacterNavigation } from "@/lib/content/active-character";

export async function PlayerNav() {
  const account = await getCurrentAccount();
  const activeCharacter = account ? await getActiveCharacterNavigation(account.id) : null;
  const activeCharacterId = activeCharacter?.id ?? null;

  return (
    <header>
      <Link href="/">Wonderland</Link>
      <nav aria-label="Portal dos jogadores">
        <Link href="/racas">Raças</Link>
        <Link href="/classes">Classes</Link>
        <Link href="/historia">História</Link>
        <Link href="/reinos">Reinos</Link>
        {activeCharacterId ? <Link href="/personagens">Jogar</Link> : null}
        {activeCharacterId ? (
          <PlayerWorldMenu
            activeCharacterId={activeCharacterId}
            isAdmin={Boolean(account && isAdministrativeRole(account.role))}
          />
        ) : null}
        {!activeCharacterId && account && isAdministrativeRole(account.role) ? (
          <Link href="/admin">Painel ADM</Link>
        ) : null}
        {activeCharacter ? (
          <Link href="/personagens">
            {activeCharacter.name} — Nível {activeCharacter.level}
          </Link>
        ) : (
          <Link href={account ? "/personagens?selecionar=1" : "/entrar"}>
            {account ? "Escolher personagem" : "Entrar"}
          </Link>
        )}
      </nav>
    </header>
  );
}
