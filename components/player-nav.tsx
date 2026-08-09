import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getActiveCharacterId } from "@/lib/content/active-character";
import { getCharacterSheet } from "@/lib/content/characters";

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
        {activeCharacterId ? (
          <>
            <Link href="/arena">Arena</Link>
            <Link href="/mapas">Mapas</Link>
            <Link href="/loja">Loja</Link>
            <Link href="/ranking">Ranking</Link>
            <Link href="/eventos">Eventos</Link>
            <Link href="/atualizacoes">Atualizações</Link>
          </>
        ) : null}
        {account && isAdministrativeRole(account.role) ? (
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
