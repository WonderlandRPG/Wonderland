import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { getCurrentAccount } from "@/lib/auth/account";
import { getPortalHeadline } from "@/lib/content/portal-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [account, headline] = await Promise.all([getCurrentAccount(), getPortalHeadline()]);

  return (
    <main className="wonderland-home">
      <PlayerNav />

      <section className="home-hero" aria-labelledby="wonderland-title">
        <div className="home-hero__content">
          <p className="eyebrow"><span aria-hidden="true">✦</span> Temporada inaugural <span aria-hidden="true">✦</span></p>
          <h1 id="wonderland-title">
            <span>{headline.firstLine}</span>
            <em>{headline.secondLine}</em>
          </h1>
          <p className="home-hero__lead">
            Um mundo de reinos, guerras, dungeons e lendas espera pelo próximo nome digno de ser lembrado.
          </p>

          <div className="home-hero__actions">
            <Link className="rpg-button rpg-button--primary" href={account ? "/personagens" : "/cadastro"}>
              <span>{account ? "Entrar em Wonderland" : "Criar meu aventureiro"}</span>
            </Link>
            <Link className="rpg-button rpg-button--secondary" href="/historia">
              <span>Conhecer a história</span>
            </Link>
          </div>
        </div>

        <aside className="home-hero__sigil" aria-hidden="true">
          <div className="home-hero__sigil-ring">
            <span>W</span>
          </div>
          <small>O Reino dos Sonhos</small>
        </aside>
      </section>

      <nav className="home-paths" aria-label="Atalhos de exploração">
        <Link href="/racas">
          <small>I · POVOS</small>
          <strong>Raças</strong>
          <span>Descubra sua origem</span>
        </Link>
        <Link href="/classes">
          <small>II · VOCAÇÕES</small>
          <strong>Classes</strong>
          <span>Escolha seu caminho</span>
        </Link>
        <Link href="/reinos">
          <small>III · TERRAS</small>
          <strong>Reinos</strong>
          <span>Conheça as coroas</span>
        </Link>
      </nav>
    </main>
  );
}
