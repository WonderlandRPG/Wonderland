import { PortalShell } from "@/components/portal-shell";
import { getPortalEvents } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";
export const dynamic = "force-dynamic";
export default async function EventsPage() {
  await requireActiveCharacter("/eventos");
  const events = await getPortalEvents();
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });
  return (
    <PortalShell
      eyebrow="Agenda dos reinos"
      title="Calendário de eventos"
      description="Prepare a ficha e encontre seu grupo para as próximas aventuras."
    >
      <div className="event-list">
        {events.map((event) => (
          <article key={event.id}>
            <time>{date.format(new Date(event.starts_at)).toUpperCase().replace(".", "")}</time>
            <div>
              <small>{event.event_type}</small>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
            </div>
            <span>{event.registration_label}</span>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
