import { PortalShell } from "@/components/portal-shell";
import { getPortalUpdates } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";
export const dynamic = "force-dynamic";
export default async function UpdatesPage() {
  await requireActiveCharacter("/atualizacoes");
  const updates = await getPortalUpdates();
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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
              <time>{date.format(new Date(`${update.published_on}T00:00:00Z`))}</time>
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
