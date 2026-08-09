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
          <div className="hero__status">
            <span className="signal-dot" /> Temporada inaugural aberta
          </div>
          <p className="hero__kicker">Wonderland RPG // Crie sua lenda</p>
          <h1>
            Os portões <span>estão abertos.</span>
          </h1>
          <p className="hero__lead">
            Escolha seu caminho, conheça outros aventureiros e escreva uma história capaz de
            atravessar todos os reinos.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href={account ? "/personagens" : "/cadastro"}>
              {account ? "Continuar minha jornada" : "Começar minha jornada"} <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
