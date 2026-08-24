import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EventRewardFields, type EventRewardDraft } from "@/components/admin/event-reward-fields";
import { deleteEventAction, saveEventAction } from "./actions";

export const metadata = { title: "Eventos | Painel ADM" };
export const dynamic = "force-dynamic";
export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [{ data }, { data: rewards }, { data: rewardItems }, query] = await Promise.all([
    client
      ? client.from("v2_events").select("*").order("starts_at")
      : Promise.resolve({ data: [] }),
    client
      ? client
          .from("v2_event_rewards")
          .select("id,event_id,reward_type,amount,item_id")
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    client
      ? client.from("v2_shop_items").select("id,name,slot").order("name")
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
        <a className="button button--primary" href="#novo-evento">
          ＋ Publicar evento
        </a>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo"
            ? "✓ Evento salvo."
            : query.status === "periodo-invalido"
              ? "! O encerramento precisa acontecer depois do início."
            : query.status === "apagado"
              ? "✓ Evento apagado."
              : "! Revise os dados."}
        </div>
      ) : null}
      <section className="admin-composer" id="novo-evento">
        <header>
          <span>01</span>
          <div>
            <small>NOVA PUBLICAÇÃO</small>
            <h2>Novo evento</h2>
            <p>Preencha os dados abaixo. Você pode publicar agora ou deixar oculto.</p>
          </div>
        </header>
        <EventForm items={rewardItems ?? []} />
      </section>
      <section className="admin-publication-section">
        <header>
          <div>
            <small>CALENDÁRIO</small>
            <h2>Eventos cadastrados</h2>
          </div>
          <span>{data?.length ?? 0} publicações</span>
        </header>
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
              <EventForm
                event={event}
                items={rewardItems ?? []}
                rewards={
                  (rewards ?? []).filter(
                    (reward) => reward.event_id === event.id,
                  ) as EventRewardDraft[]
                }
              />
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
  rewards = [],
  items,
}: {
  event?: {
    id: string;
    title: string;
    event_type: string;
    description: string;
    starts_at: string;
    ends_at: string;
    registration_label: string;
    active: boolean;
  };
  rewards?: EventRewardDraft[];
  items: Array<{ id: string; name: string; slot: string }>;
}) {
  const localInput = (value?: string) =>
    value
      ? new Intl.DateTimeFormat("sv-SE", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
          .format(new Date(value))
          .replace(" ", "T")
      : "";
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
        <span>Início das inscrições</span>
        <input name="startsAt" type="datetime-local" defaultValue={localInput(event?.starts_at)} required />
      </label>
      <label>
        <span>Encerramento das inscrições</span>
        <input name="endsAt" type="datetime-local" defaultValue={localInput(event?.ends_at)} required />
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
      <EventRewardFields initialRewards={rewards} items={items} />
      <button className="button button--primary">
        {event ? "Salvar alterações" : "Adicionar evento"}
      </button>
    </form>
  );
}
