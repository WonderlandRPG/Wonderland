import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { getActiveCharacterId } from "@/lib/content/active-character";

export async function PlayerNav() {
  const account = await getCurrentAccount();
  const activeCharacterId = account ? await getActiveCharacterId(account.id) : null;
  return (
    <header className="player-nav page-container">
      <Link href="/">
        <BrandMark inverse />
      </Link>
      <nav aria-label="Portal dos jogadores">
        {account ? (
          <Link href="/personagens?selecionar=1">
            {activeCharacterId ? "Trocar personagem" : "Escolher personagem"}
          </Link>
        ) : null}
        {activeCharacterId ? (
          <>
            <Link href="/mapas">Mapas</Link>
            <Link href="/ranking">Ranking</Link>
            <Link href="/loja">Loja</Link>
            <Link href="/eventos">Eventos</Link>
            <Link href="/atualizacoes">Atualizações</Link>
          </>
        ) : null}
        {account && isAdministrativeRole(account.role) ? (
          <Link href="/admin">Painel ADM</Link>
        ) : null}
        <Link
          className="button button--small button--glass"
          href={activeCharacterId ? "/perfil" : account ? "/personagens?selecionar=1" : "/entrar"}
        >
          {activeCharacterId ? account?.displayName : account ? "Selecionar" : "Entrar"}
        </Link>
      </nav>
    </header>
  );
}
