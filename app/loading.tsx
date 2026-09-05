import styles from "./route-feedback.module.css";

export default function Loading() {
  return (
    <main className={styles.page} role="status" aria-live="polite" aria-label="Carregando página">
      <section className={styles.card}>
        <div className={styles.symbol} aria-hidden="true">W</div>
        <small className={styles.eyebrow}>ATRAVESSANDO O PORTAL</small>
        <h2>Carregando Wonderland</h2>
        <p>Preparando pergaminhos, personagens e caminhos da sua jornada.</p>
        <div className={styles.progress} aria-hidden="true" />
      </section>
    </main>
  );
}
