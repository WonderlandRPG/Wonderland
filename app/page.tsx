import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { getCurrentAccount } from "@/lib/auth/account";
import { getPortalHeadline } from "@/lib/content/portal-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [account, headline] = await Promise.all([getCurrentAccount(), getPortalHeadline()]);

  return (
    <main>
      <PlayerNav />
      <section>
        <p>Temporada inaugural</p>
        <h1>{headline.firstLine} {headline.secondLine}</h1>
        <p>Um mundo de reinos, guerras, dungeons e lendas espera pelo próximo nome digno de ser lembrado.</p>
        <p>
          <Link href={account ? "/personagens" : "/cadastro"}>
            {account ? "Entrar em Wonderland" : "Criar meu aventureiro"}
          </Link>
        </p>
        <p><Link href="/historia">Conhecer a história</Link></p>
      </section>
      <nav aria-label="Atalhos de exploração">
        <Link href="/racas">Povos</Link>
        <Link href="/classes">Vocações</Link>
        <Link href="/reinos">Reinos</Link>
      </nav>
    </main>
  );
}
