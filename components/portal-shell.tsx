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
    <main>
      <PlayerNav />
      <header>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <section>{children}</section>
      <footer>© 2026 Wonderland Ltda.</footer>
    </main>
  );
}
