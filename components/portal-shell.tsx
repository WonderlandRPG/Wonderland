import { PlayerNav } from "@/components/player-nav";

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
    <main className="portal-shell">
      <PlayerNav />
      <section className="portal-hero page-container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <section className="portal-content page-container">{children}</section>
      <footer className="portal-footer page-container">
        Wonderland RPG <span>© 2026 Wonderland Ltda.</span>
      </footer>
    </main>
  );
}
