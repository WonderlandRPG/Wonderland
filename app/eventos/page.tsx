import { PortalShell } from "@/components/portal-shell";
import { getPortalEvents } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { registerForEventAction } from "./actions";

export const dynamic = "force-dynamic";

function getServerTimestamp() {
  return Date.now();
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ inscricao?: string }>;
}) {
  const { characterId } = await requireActiveCharacter("/eventos");
  const events = await getPortalEvents();
  const query = await searchParams;
  const client = await createServerSupabaseClient();
  const eventIds = events.map((event) => event.id);
  const [{ data: rewards }, { data: registrations }] =
    client && eventIds.length
      ? await Promise.all([
          client
            .from("v2_event_rewards")
            .select("event_id,reward_type,amount,item_id")
            .in("event_id", eventIds)
            .order("sort_order"),
          client
            .from("v2_event_registrations")
            .select("event_id")
            .eq("character_id", characterId)
            .in("event_id", eventIds),
        ])
      : [{ data: [] }, { data: [] }];
  const registered = new Set((registrations ?? []).map((entry) => entry.event_id));
  const rewardItemIds = [
    ...new Set((rewards ?? []).flatMap((reward) => (reward.item_id ? [reward.item_id] : []))),
  ];
  const { data: rewardItems } =
    client && rewardItemIds.length
      ? await client.from("v2_shop_items").select("id,name").in("id", rewardItemIds)
      : { data: [] };
  const rewardItemNames = new Map((rewardItems ?? []).map((item) => [item.id, item.name]));
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });
  const dateTime = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const now = getServerTimestamp();
  return (
    <PortalShell
      eyebrow="Mural dos Reinos"
      title="Chamados e Celebrações"
      description="Convocações, festivais e acontecimentos fixados pela Guilda para os aventureiros de Wonderland."
    >
      {query.inscricao ? (
        <div
          className={`account-notice ${query.inscricao === "erro" ? "is-warning" : ""}`}
          role="status"
        >
          {query.inscricao === "sucesso"
            ? "✓ Inscrição confirmada e recompensas entregues."
            : query.inscricao === "existente"
              ? "Você já está inscrito neste evento."
              : query.inscricao === "aguarde"
                ? "As inscrições deste evento ainda não começaram."
                : query.inscricao === "encerrada"
                  ? "As inscrições deste evento já foram encerradas."
              : "Não foi possível concluir a inscrição."}
        </div>
      ) : null}
      <section className="realm-notice-board">
        <header>
          <span>✦</span>
          <div>
            <small>QUADRO PÚBLICO DA GUILDA</small>
            <h2>Próximos acontecimentos</h2>
            <p>Os avisos abaixo são renovados conforme os reinos anunciam novas atividades.</p>
          </div>
        </header>
        <div className="realm-notice-board__wood" aria-hidden="true" />
        <div className="realm-notice-board__papers">
          {events.map((event, index) => {
            const startsAt = new Date(event.starts_at).getTime();
            const endsAt = new Date(event.ends_at).getTime();
            const registrationOpen = now >= startsAt && now <= endsAt;
            const registrationEnded = now > endsAt;
            return (
            <article
              className="realm-notice"
              key={event.id}
              style={
                {
                  "--notice-tilt": `${[-1.4, 0.8, -0.5, 1.1][index % 4]}deg`,
                } as React.CSSProperties
              }
            >
              <i className="realm-notice__pin" />
              <time>{date.format(new Date(event.starts_at)).toUpperCase().replace(".", "")}</time>
              <small>{event.event_type}</small>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              <div className="realm-notice__period">
                <span><small>INÍCIO</small><strong>{dateTime.format(new Date(event.starts_at)).replace(".", "")}</strong></span>
                <i aria-hidden="true">→</i>
                <span><small>ENCERRAMENTO</small><strong>{dateTime.format(new Date(event.ends_at)).replace(".", "")}</strong></span>
              </div>
              {(rewards ?? []).some((reward) => reward.event_id === event.id) ? (
                <ul className="realm-notice__rewards">
                  {(rewards ?? [])
                    .filter((reward) => reward.event_id === event.id)
                    .map((reward, rewardIndex) => {
                      const label =
                        reward.reward_type === "gold"
                          ? "WG"
                          : reward.reward_type === "xp"
                            ? "XP"
                            : (rewardItemNames.get(reward.item_id ?? "") ?? "Recompensa");
                      return (
                        <li key={`${event.id}-${rewardIndex}`}>
                          ✦ {reward.amount.toLocaleString("pt-BR")} {label}
                        </li>
                      );
                    })}
                </ul>
              ) : null}
              <footer>
                {registered.has(event.id) ? (
                  <span>✓ Inscrito</span>
                ) : !registrationOpen ? (
                  <span className="realm-notice__closed">
                    {registrationEnded ? "Inscrições encerradas" : "Inscrições ainda não iniciadas"}
                  </span>
                ) : (
                  <form action={registerForEventAction}>
                    <input name="eventId" type="hidden" value={event.id} />
                    <button className="button button--primary">
                      {event.registration_label || "Inscrever-se"}
                    </button>
                  </form>
                )}
                <b>AVISO DA GUILDA</b>
              </footer>
            </article>
            );
          })}
          {!events.length ? (
            <p className="realm-notice-board__empty">Nenhum aviso foi fixado no mural.</p>
          ) : null}
        </div>
      </section>
    </PortalShell>
  );
}
