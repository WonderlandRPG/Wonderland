import { PortalShell } from "@/components/portal-shell";
import { getPortalUpdates } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { UpdateBlocks } from "@/components/updates/update-blocks";

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  await requireActiveCharacter("/atualizacoes");
  const updates = await getPortalUpdates();
  const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
  const latest = updates[0];

  return (
    <PortalShell eyebrow="Imprensa da Coroa" title="Crônicas de Wonderland" description="Relatos oficiais das mudanças que atravessam os reinos.">
      <section className="royal-chronicle">
        {latest ? (
          <article className="royal-chronicle__edition">
            <header className="royal-chronicle__masthead">
              <div className="royal-chronicle__seal">W</div>
              <div><small>GAZETA OFICIAL DOS REINOS</small><h2>Crônicas de Wonderland</h2><p>Folha de registro da Guilda e da Coroa</p></div>
              <time>{date.format(new Date(`${latest.published_on}T00:00:00Z`))}</time>
            </header>
            <div className="royal-chronicle__headline">
              <aside><small>EDIÇÃO</small><strong>v{latest.version}</strong><span>Arquivo oficial</span></aside>
              <div><small>ÚLTIMAS NOTÍCIAS</small><h3>{latest.title}</h3></div>
            </div>
            <div className="royal-chronicle__story"><UpdateBlocks blocks={latest.notes} /></div>
          </article>
        ) : <p className="royal-chronicle__empty">Nenhuma crônica foi publicada ainda.</p>}

        {updates.length > 1 ? (
          <section className="royal-chronicle__archive">
            <header><small>ARQUIVO DA GUILDA</small><h2>Edições anteriores</h2><p>Consulte os volumes preservados no arquivo real.</p></header>
            <div>
              {updates.slice(1).map((update, index) => (
                <details className="royal-chronicle__volume" key={update.version}>
                  <summary><span>{String(index + 1).padStart(2, "0")}</span><div><small>VOLUME v{update.version}</small><strong>{update.title}</strong></div><time>{date.format(new Date(`${update.published_on}T00:00:00Z`))}</time><b>ABRIR</b></summary>
                  <div className="royal-chronicle__volume-copy"><UpdateBlocks blocks={update.notes} /></div>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </PortalShell>
  );
}
