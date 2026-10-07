import Link from "next/link";
import styles from "./home.module.css";

import { PlayerNav } from "@/components/player-nav";
import { getCurrentAccount } from "@/lib/auth/account";
import { getPortalHeadline } from "@/lib/content/portal-settings";
import { isHalloweenSeasonActive } from "@/lib/events/halloween-season";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [account, headline] = await Promise.all([getCurrentAccount(), getPortalHeadline()]);
  const halloweenActive = isHalloweenSeasonActive();
  const portal = halloweenActive
    ? {
        seasonLabel: "Noites Apavorantes — Halloween 2026 · 7 a 31 de outubro",
        firstLine: "A noite caiu sobre",
        secondLine: "Wonderland.",
        lead: "Lanternas se apagam, a névoa avança e antigas criaturas despertam entre os reinos. Prepare seu aventureiro: Noites Apavorantes começou.",
        asideTitle: "Noites Apavorantes — Halloween 2026",
        asideText:
          "Durante outubro, presságios sombrios tomarão o mundo. Explore, fortaleça sua build e aguarde os próximos capítulos do evento.",
      }
    : {
        seasonLabel: headline.seasonLabel,
        firstLine: headline.firstLine,
        secondLine: headline.secondLine,
        lead: "Entre por florestas antigas, reinos em guerra, ruínas esquecidas e cidades erguidas sobre lendas. Em Wonderland, seu personagem não observa a história: ele deixa marcas nela.",
        asideTitle: "Um mundo vivo",
        asideText:
          "Escolha um povo, uma vocação e um reino. Depois, deixe que suas escolhas façam o restante.",
      };

  return (
    <main className={styles.page}>
      <PlayerNav />

      <section className={styles.hero} data-seasonal={halloweenActive ? "halloween" : undefined}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{portal.seasonLabel}</span>
          <h1>
            {portal.firstLine}
            <em>{portal.secondLine}</em>
          </h1>
          <p className={styles.lead}>{portal.lead}</p>
          <div className={styles.actions}>
            <Link href={account ? "/personagens" : "/cadastro"}>
              {account ? "Continuar minha jornada" : "Criar meu aventureiro"}
            </Link>
            <Link href="/historia">Abrir as crônicas</Link>
          </div>
        </div>

        <aside className={styles.aside} aria-label={portal.asideTitle}>
          <div className={styles.tale}>
            <b>{halloweenActive ? "☾" : "✦"}</b>
            <strong>{portal.asideTitle}</strong>
            <p>{portal.asideText}</p>
          </div>
        </aside>
      </section>

      <nav className={styles.paths} aria-label="Comece a explorar Wonderland">
        <Link className={styles.path} href="/racas">
          <small>Primeiro passo</small>
          <strong>Escolha seu povo</strong>
          <span>Conheça as raças, seus traços e suas heranças.</span>
        </Link>
        <Link className={styles.path} href="/classes">
          <small>Seu estilo de jogo</small>
          <strong>Escolha sua vocação</strong>
          <span>Descubra classes, caminhos, recursos e habilidades.</span>
        </Link>
        <Link className={styles.path} href="/reinos">
          <small>Onde tudo acontece</small>
          <strong>Explore os reinos</strong>
          <span>Viaje por territórios, culturas e disputas de Wonderland.</span>
        </Link>
      </nav>
    </main>
  );
}
