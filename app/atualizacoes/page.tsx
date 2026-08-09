import { PortalShell } from "@/components/portal-shell";
import { updates } from "@/lib/game/player-portal";
export default function UpdatesPage() {
  return (
    <PortalShell
      eyebrow="Diário de atualizações"
      title="Novidades do mundo"
      description="Todas as mudanças importantes, explicadas para quem vive a aventura."
    >
      <div className="update-list">
        {updates.map((update) => (
          <article key={update.version}>
            <header>
              <span>v{update.version}</span>
              <time>{update.date}</time>
            </header>
            <h2>{update.title}</h2>
            <ul>
              {update.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
