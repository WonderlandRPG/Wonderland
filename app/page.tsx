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
        <div className={styles.content}>
          <div className={styles.copy}>
            <div className={styles.status}>
              <i /> Temporada inaugural aberta
            </div>
            <p className={styles.kicker}>Wonderland RPG · Crie sua lenda</p>
            <h1 className={styles.title}>
              {headline.firstLine} <span>{headline.secondLine}</span>
            </h1>
            <p className={styles.lead}>
              Escolha seu caminho, conheça outros aventureiros e escreva uma história capaz de
              atravessar todos os reinos.
            </p>
            <div className={styles.actions}>
              <Link className={styles.cta} href={account ? "/personagens" : "/cadastro"}>
                {account ? "Continuar minha jornada" : "Começar minha jornada"} <span>→</span>
              </Link>
            </div>
          </div>
          <div className={styles.sigil} aria-hidden="true">
            <strong>W</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
