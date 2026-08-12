import { PortalShell } from "@/components/portal-shell";
import { getPortalUpdates } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { UpdateBlocks } from "@/components/updates/update-blocks";
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
        {updates.slice(0, 1).map((update) => (
          <article className="update-featured" key={update.version}>
            <header>
              <span>Mais recente · v{update.version}</span>
              <time>{date.format(new Date(`${update.published_on}T00:00:00Z`))}</time>
            </header>
            <h2>{update.title}</h2>
            <UpdateBlocks blocks={update.notes} />
          </article>
        ))}
        {updates.length > 1 ? (
          <section className="update-archive">
            <header>
              <span className="eyebrow">Versões anteriores</span>
              <h2>Arquivo de atualizações</h2>
              <p>Clique em uma versão para abrir todas as notas.</p>
            </header>
            {updates.slice(1).map((update) => (
              <details className="update-archive__entry" key={update.version}>
                <summary>
                  <span>v{update.version}</span>
                  <strong>{update.title}</strong>
                  <time>{date.format(new Date(`${update.published_on}T00:00:00Z`))}</time>
                  <i aria-hidden="true">＋</i>
                </summary>
                <div>
                  <UpdateBlocks blocks={update.notes} />
                </div>
              </details>
            ))}
          </section>
        ) : null}
      </div>
    </PortalShell>
  );
}
