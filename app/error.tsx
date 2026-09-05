"use client";

import Link from "next/link";
import styles from "./route-feedback.module.css";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert">
        <span className={styles.symbol} aria-hidden="true">!</span>
        <span className={styles.eyebrow}>Um desvio na jornada</span>
        <h1>Não foi possível abrir esta página.</h1>
        <p>Tente carregar novamente. Se o problema continuar, volte ao portal para acessar outro destino.</p>
        <div className={styles.actions}>
          <button data-wl-action="primary" type="button" onClick={retry}>Tentar novamente</button>
          <Link data-wl-action="accent" href="/">Voltar ao portal</Link>
        </div>
      </section>
    </main>
  );
}
