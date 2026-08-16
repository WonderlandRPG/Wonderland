import { PlayerNav } from "@/components/player-nav";

import styles from "./portal-shell.module.css";

export function PortalShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className={styles.shell}>
      <PlayerNav />

      <div className={styles.stage}>
        <aside className={styles.rail} aria-hidden="true">
          <span>✦</span>
          <i />
          <b>W</b>
          <i />
          <span>✦</span>
        </aside>

        <section className={styles.chronicle}>
          <header className={styles.banner}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>

          <div className={styles.divider} aria-hidden="true">
            <span />
            <b>◆</b>
            <span />
          </div>

          <section className={styles.content}>{children}</section>
        </section>
      </div>

      <footer className={styles.footer}>
        <span>Crônicas oficiais de Wonderland</span>
        <b>© 2026 Wonderland Ltda.</b>
      </footer>
    </main>
  );
}
