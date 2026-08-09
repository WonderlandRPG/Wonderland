import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deleteEventAction, saveEventAction } from "./actions";

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
    <div className="admin-content admin-editor-page">
      <header className="admin-page-title admin-publisher-hero">
        <div>
          <span className="eyebrow">Conteúdo ao vivo</span>
          <h2>Calendário de eventos</h2>
          <p>Adicione eventos e edite o que os jogadores veem.</p>
        </div>
        <a className="button button--primary" href="#novo-evento">＋ Publicar evento</a>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo"
            ? "✓ Evento salvo."
            : query.status === "apagado"
              ? "✓ Evento apagado."
              : "! Revise os dados."}
        </div>
      ) : null}
      <section className="admin-composer" id="novo-evento">
        <header><span>01</span><div><small>NOVA PUBLICAÇÃO</small><h2>Novo evento</h2><p>Preencha os dados abaixo. Você pode publicar agora ou deixar oculto.</p></div></header>
        <EventForm />
      </section>
      <section className="admin-publication-section">
        <header><div><small>CALENDÁRIO</small><h2>Eventos cadastrados</h2></div><span>{data?.length ?? 0} publicações</span></header>
        <div className="admin-editor-list">
        {(data ?? []).map((event) => (
          <details className="admin-editor-card" key={event.id}>
            <summary>
              <span>
                <small>
                  {event.event_type} · {new Date(event.starts_at).toLocaleDateString("pt-BR")}
                </small>
                <strong>{event.title}</strong>
              </span>
              <b>{event.active ? "Publicado" : "Oculto"}</b>
            </summary>
            <EventForm event={event} />
            <form action={deleteEventAction} className="admin-delete-form">
              <input name="id" type="hidden" value={event.id} />
              <button className="button button--danger">Apagar evento</button>
            </form>
          </details>
        ))}
        </div>
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
