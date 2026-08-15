import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getActiveCharacterId } from "@/lib/content/active-character";
import { getCharacterSheet } from "@/lib/content/characters";
import { SignOutButton } from "@/components/account/sign-out-button";

export async function PlayerNav() {
  const account = await getCurrentAccount();
  const activeCharacterId = account ? await getActiveCharacterId(account.id) : null;
  const activeCharacter = activeCharacterId ? await getCharacterSheet(activeCharacterId) : null;
  return (
    <header className="player-nav page-container">
      <Link href={activeCharacter ? "/personagens" : "/"}>
        <BrandMark inverse />
      </Link>
      <nav aria-label="Portal dos jogadores">
        <Link href="/racas">Raças</Link>
        <Link href="/classes">Classes</Link>
        <Link href="/historia">História</Link>
        <Link href="/reinos">Reinos</Link>
        {activeCharacterId ? (
          <>
            <Link href="/personagens">Jogar</Link>
            <Link href="/arena">Arena</Link>
            <Link href="/missoes">Missões</Link>
            <Link href={`/personagens/${activeCharacterId}?tab=equipamentos`}>Equipamentos</Link>
            <Link href="/loja">Loja</Link>
            <Link href="/presenca">Presença</Link>
            <details className="player-nav__world-menu">
              <summary>
                Mundo <span aria-hidden="true">⌄</span>
              </summary>
              <div>
                <small>Comunidade</small>
                <Link href="/ranking">Ranking</Link>
                <Link href="/ranks">Ranks</Link>
                <Link href="/eventos">Eventos</Link>
                <small>Informações</small>
                <Link href="/mapas">Mapa</Link>
                <Link href="/atualizacoes">Atualizações</Link>
                <Link href="/perfil">Minha conta</Link>
                {account && isAdministrativeRole(account.role) ? (
                  <Link href="/admin">Painel ADM</Link>
                ) : null}
                <SignOutButton compact />
              </div>
            </details>
          </>
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
