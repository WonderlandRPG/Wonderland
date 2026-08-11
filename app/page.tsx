import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { getCurrentAccount } from "@/lib/auth/account";

export const dynamic = "force-dynamic";

export default async function Home() {
  const account = await getCurrentAccount();
  return (
    <main className="home-shell player-home home-minimal">
      <section className="hero player-hero">
        <div className="hero__art" aria-hidden="true">
          <span className="hero__portal" />
          <span className="hero__castle" />
          <span className="hero__wanderer" />
        </div>
        <PlayerNav />
        <div className="hero__content page-container">
          <div className="hero__chapter">Prólogo <span>MMXXVI</span></div>
          <p className="hero__kicker">Uma crônica moldada pelos jogadores</p>
          <h1>
            Atravesse o véu.<br/><span>Torne-se lenda.</span>
          </h1>
          <p className="hero__lead">
            Forje um herói, atravesse os reinos partidos e escreva seu nome em um mundo que
            muda com as escolhas de seus jogadores.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href={account ? "/personagens" : "/cadastro"}>
              {account ? "Continuar minha jornada" : "Começar minha jornada"} <span>→</span>
            </Link>
          </div>
          <div className="hero__chronicle" aria-label="Destaques de Wonderland">
            <Link href="/racas"><small>I</small><span><strong>Descubra sua origem</strong>Onze povos despertos</span></Link>
            <Link href="/classes"><small>II</small><span><strong>Escolha seu caminho</strong>Combate, magia e destino</span></Link>
            <Link href="/historia"><small>III</small><span><strong>Leia as crônicas</strong>Sete eras de história</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
