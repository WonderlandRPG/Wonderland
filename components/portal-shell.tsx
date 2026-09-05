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
    <main className={styles.page}>
      <PlayerNav />
      <header className={styles.intro}>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <section className={styles.content}>{children}</section>
      <footer className={styles.footer}>Wonderland · crônicas de um mundo vivo</footer>
    </main>
  );
}
