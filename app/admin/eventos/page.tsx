import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveEventAction } from "./actions";

export const metadata = { title: "Eventos | Painel ADM" };
export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [{ data }, query] = await Promise.all([
    client
      ? client.from("v2_events").select("*").order("starts_at")
      : Promise.resolve({ data: [] }),
    searchParams,
  ]);
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <span className="eyebrow">Conteúdo ao vivo</span>
          <h1>Calendário de eventos</h1>
          <p>Adicione eventos e edite o que os jogadores veem.</p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Evento salvo." : "! Revise os dados."}
        </div>
      ) : null}
      <section className="admin-panel">
        <h2>Novo evento</h2>
        <EventForm />
      </section>
      <section className="admin-card-grid">
        {(data ?? []).map((event) => (
          <article className="admin-panel" key={event.id}>
            <EventForm event={event} />
          </article>
        ))}
      </section>
    </div>
  );
}
function EventForm({
  event,
}: {
  event?: {
    id: string;
    title: string;
    event_type: string;
    description: string;
    starts_at: string;
    registration_label: string;
    active: boolean;
  };
}) {
  const localDate = event ? new Date(event.starts_at).toISOString().slice(0, 16) : "";
  return (
    <form action={saveEventAction} className="admin-form">
      <input name="id" type="hidden" value={event?.id ?? ""} />
      <label>
        <span>Título</span>
        <input name="title" defaultValue={event?.title} required />
      </label>
      <label>
        <span>Tipo</span>
        <input name="eventType" defaultValue={event?.event_type ?? "Comunidade"} required />
      </label>
      <label>
        <span>Data e hora</span>
        <input name="startsAt" type="datetime-local" defaultValue={localDate} required />
      </label>
      <label>
        <span>Texto da inscrição</span>
        <input
          name="registrationLabel"
          defaultValue={event?.registration_label ?? "Inscrições em breve"}
          required
        />
      </label>
      <label>
        <span>Descrição</span>
        <textarea name="description" defaultValue={event?.description} rows={3} />
      </label>
      <label>
        <input name="active" type="checkbox" defaultChecked={event?.active ?? true} /> Visível aos
        jogadores
      </label>
      <button className="button button--primary">
        {event ? "Salvar alterações" : "Adicionar evento"}
      </button>
    </form>
  );
}
