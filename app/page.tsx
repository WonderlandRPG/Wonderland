import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { getCurrentAccount } from "@/lib/auth/account";
import { getPortalHeadline } from "@/lib/content/portal-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [account, headline] = await Promise.all([getCurrentAccount(), getPortalHeadline()]);

  return (
    <main className="home-landing">
      <PlayerNav />

      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">Temporada inaugural</span>
          <h1>
            {headline.firstLine}
            <em>{headline.secondLine}</em>
          </h1>
          <p className="home-hero__lead">
            Entre por florestas antigas, reinos em guerra, ruínas esquecidas e cidades erguidas sobre lendas. Em Wonderland, seu personagem não observa a história: ele deixa marcas nela.
          </p>
          <div className="home-hero__actions">
            <Link href={account ? "/personagens" : "/cadastro"}>
              {account ? "Continuar minha jornada" : "Criar meu aventureiro"}
            </Link>
            <Link href="/historia">Abrir as crônicas</Link>
          </div>
        </div>

        <aside className="home-hero__aside" aria-label="Boas-vindas a Wonderland">
          <div className="home-hero__tale">
            <b>✦</b>
            <strong>Um mundo vivo</strong>
            <p>Escolha um povo, uma vocação e um reino. Depois, deixe que suas escolhas façam o restante.</p>
          </div>
        </aside>
      </section>

      <nav className="home-paths" aria-label="Comece a explorar Wonderland">
        <Link className="home-path" href="/racas">
          <small>Primeiro passo</small>
          <strong>Escolha seu povo</strong>
          <span>Conheça as raças, seus traços e suas heranças.</span>
        </Link>
        <Link className="home-path" href="/classes">
          <small>Seu estilo de jogo</small>
          <strong>Escolha sua vocação</strong>
          <span>Descubra classes, caminhos, recursos e habilidades.</span>
        </Link>
        <Link className="home-path" href="/reinos">
          <small>Onde tudo acontece</small>
          <strong>Explore os reinos</strong>
          <span>Viaje por territórios, culturas e disputas de Wonderland.</span>
        </Link>
      </nav>
    </main>
  );
}
