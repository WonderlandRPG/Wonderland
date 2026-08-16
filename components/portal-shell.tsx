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
    <main className="world-page">
      <PlayerNav />
      <header className="world-page__intro">
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <section className="world-page__content">{children}</section>
      <footer className="world-page__footer">Wonderland · crônicas de um mundo vivo</footer>
    </main>
  );
}
