import Link from "next/link";
import styles from "./route-feedback.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
      <span className={styles.symbol} aria-hidden="true">?</span>
      <span className={styles.eyebrow}>Página não encontrada · 404</span>
      <h1>Este caminho não está no mapa.</h1>
      <p>O endereço pode ter mudado ou a página pode não estar mais disponível.</p>
      <div className={styles.actions}><Link data-wl-action="primary" href="/">
        Voltar ao portal
      </Link></div>
      </section>
    </main>
  );
}
