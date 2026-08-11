import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { getCurrentAccount } from "@/lib/auth/account";

export const dynamic = "force-dynamic";

export default async function Home() {
  const account = await getCurrentAccount();
  return (
    <main className="home-shell player-home home-minimal">
      <section className="hero player-hero">
        <div className="hero__backdrop" />
        <div className="hero__grid" />
        <PlayerNav />
        <div className="hero__content page-container">
          <div className="hero__status"><span className="signal-dot" /> O mundo voltou a sonhar</div>
          <p className="hero__kicker">Wonderland RPG · Uma crônica viva</p>
          <h1>
            Todo sonho deixa <span>uma cicatriz.</span>
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
            <Link href="/racas"><small>01 · ORIGENS</small><strong>Escolha sua raça</strong><span>Onze povos despertos →</span></Link>
            <Link href="/classes"><small>02 · CAMINHOS</small><strong>Defina sua classe</strong><span>Domine seu estilo de batalha →</span></Link>
            <Link href="/historia"><small>03 · CRÔNICAS</small><strong>Conheça o mundo</strong><span>Descubra as eras de Wonderland →</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
