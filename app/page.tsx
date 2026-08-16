import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { getCurrentAccount } from "@/lib/auth/account";
import { getPortalHeadline } from "@/lib/content/portal-settings";

import styles from "./home.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [account, headline] = await Promise.all([getCurrentAccount(), getPortalHeadline()]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <PlayerNav />
        <div className={styles.scene}>
          <div className={styles.vignette} />
          <div className={styles.banner}>
            <span>Temporada inaugural</span>
            <h1>{headline.firstLine}<em>{headline.secondLine}</em></h1>
            <p>Um mundo de reinos, guerras, dungeons e lendas espera pelo próximo nome digno de ser lembrado.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href={account ? "/personagens" : "/cadastro"}>
                {account ? "Entrar em Wonderland" : "Criar meu aventureiro"}
              </Link>
              <Link className={styles.secondary} href="/historia">Conhecer a história</Link>
            </div>
          </div>
          <div className={styles.chapterRail} aria-label="Atalhos de exploração">
            <Link href="/racas"><small>I</small><strong>Povos</strong><span>Escolha sua origem</span></Link>
            <Link href="/classes"><small>II</small><strong>Vocações</strong><span>Defina seu caminho</span></Link>
            <Link href="/reinos"><small>III</small><strong>Reinos</strong><span>Descubra as coroas</span></Link>
          </div>
          <div className={styles.scrollHint}><span>Desperte</span><i /></div>
        </div>
      </section>
    </main>
  );
}
