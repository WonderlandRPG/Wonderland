import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";

export async function PlayerNav() {
  const account = await getCurrentAccount();
  return (
    <header className="player-nav page-container">
      <Link href="/">
        <BrandMark inverse />
      </Link>
      <nav aria-label="Portal dos jogadores">
        <Link href="/ranking">Ranking</Link>
        <Link href="/loja">Loja</Link>
        <Link href="/conquistas">Conquistas</Link>
        <Link href="/eventos">Eventos</Link>
        <Link href="/atualizacoes">Atualizações</Link>
        {account && isAdministrativeRole(account.role) ? (
          <Link href="/admin">Painel ADM</Link>
        ) : null}
        <Link className="button button--small button--glass" href={account ? "/perfil" : "/entrar"}>
          {account ? account.displayName : "Entrar"}
        </Link>
      </nav>
    </header>
  );
}
