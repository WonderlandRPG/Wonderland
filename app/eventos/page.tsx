import { PortalShell } from "@/components/portal-shell";
import { portalEvents } from "@/lib/game/player-portal";
export default function EventsPage() {
  return (
    <PortalShell
      eyebrow="Agenda dos reinos"
      title="Calendário de eventos"
      description="Prepare a ficha e encontre seu grupo para as próximas aventuras."
    >
      <div className="event-list">
        {portalEvents.map((event) => (
          <article key={event.title}>
            <time>{event.date}</time>
            <div>
              <small>{event.type}</small>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
            </div>
            <span>Inscrições em breve</span>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
