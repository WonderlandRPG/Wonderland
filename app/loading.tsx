import styles from "./loading.module.css";

export default function Loading() {
  return (
    <>
      <div className={styles.progress} aria-hidden="true" />
      <main className={styles.shell} aria-busy="true" aria-live="polite">
        <div className={styles.title} />
        <div className={styles.line} />
        <div className={styles.cards} aria-hidden="true">
          <div className={styles.card} />
          <div className={styles.card} />
          <div className={styles.card} />
        </div>
        <span className={styles.status}>Preparando sua próxima tela…</span>
      </main>
    </>
  );
}
