import { PortalShell } from "@/components/portal-shell";
import { getPortalEvents } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  await requireActiveCharacter("/eventos");
  const events = await getPortalEvents();
  const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
  return (
    <PortalShell eyebrow="Mural dos Reinos" title="Chamados e Celebrações" description="Convocações, festivais e acontecimentos fixados pela Guilda para os aventureiros de Wonderland.">
      <section className="realm-notice-board">
        <header><span>✦</span><div><small>QUADRO PÚBLICO DA GUILDA</small><h2>Próximos acontecimentos</h2><p>Os avisos abaixo são renovados conforme os reinos anunciam novas atividades.</p></div></header>
        <div className="realm-notice-board__wood" aria-hidden="true" />
        <div className="realm-notice-board__papers">
          {events.map((event, index) => (
            <article className="realm-notice" key={event.id} style={{ "--notice-tilt": `${[-1.4,.8,-.5,1.1][index % 4]}deg` } as React.CSSProperties}>
              <i className="realm-notice__pin" />
              <time>{date.format(new Date(event.starts_at)).toUpperCase().replace(".", "")}</time>
              <small>{event.event_type}</small>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              <footer><span>{event.registration_label}</span><b>AVISO DA GUILDA</b></footer>
            </article>
          ))}
          {!events.length ? <p className="realm-notice-board__empty">Nenhum aviso foi fixado no mural.</p> : null}
        </div>
      </section>
    </PortalShell>
  );
}
