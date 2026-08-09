import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";

export async function SiteHeader() {
  const account = await getCurrentAccount();

  return (
    <header className="site-header">
      <BrandMark inverse />
      <nav className="site-header__nav" aria-label="Navegação principal">
        <a href="#fundacao">Fundação</a>
        <a href="#sistemas">Sistemas</a>
        {account ? <Link href="/personagens">Personagens</Link> : null}
        {account ? <Link href="/arena">Arena</Link> : null}
        {account && isAdministrativeRole(account.role) ? (
          <Link href="/admin">Painel ADM</Link>
        ) : null}
        <Link className="button button--small button--glass" href={account ? "/perfil" : "/entrar"}>
          {account ? "Minha conta" : "Entrar"}
        </Link>
      </nav>
    </header>
  );
}
