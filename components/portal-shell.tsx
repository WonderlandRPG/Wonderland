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
      <section className={styles.hero}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <section className={styles.content}>{children}</section>
      <footer className={styles.footer}>
        Wonderland RPG <span>© 2026 Wonderland Ltda.</span>
      </footer>
    </main>
  );
}
