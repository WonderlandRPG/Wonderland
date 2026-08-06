import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <BrandMark inverse />
      <nav className="site-header__nav" aria-label="Navegação principal">
        <a href="#fundacao">Fundação</a>
        <a href="#sistemas">Sistemas</a>
        <Link className="button button--small button--glass" href="/admin">
          Painel ADM
        </Link>
      </nav>
    </header>
  );
}
