import { ItemArtwork } from "@/components/items/item-artwork";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { claimPresenceRewardAction } from "./actions";

export const metadata = { title: "Presença" };
export const dynamic = "force-dynamic";

function dateInSaoPaulo(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function PresencePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { characterId } = await requireActiveCharacter("/presenca");
  const client = await createServerSupabaseClient();
  const [character, query, rewardResult, configResult] = await Promise.all([
    requireCharacterSheet(characterId),
    searchParams,
    client
      ? client.from("v2_presence_rewards").select("*").eq("active", true).order("day_number")
      : Promise.resolve({ data: [] }),
    client
      ? client.from("v2_presence_pass_config").select("*").eq("id", true).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const config = configResult.data;
  const rewards = (rewardResult.data ?? []).filter(
    (reward) => !config || reward.day_number <= config.day_count,
  );
  const itemIds = rewards.flatMap((reward) => (reward.item_id ? [reward.item_id] : []));
  const { data: itemRows } =
    client && itemIds.length
      ? await client.from("v2_shop_items").select("id,name,rarity,slot").in("id", itemIds)
      : { data: [] };
  const items = new Map((itemRows ?? []).map((item) => [item.id, item]));
  const today = dateInSaoPaulo();
  const campaignOpen = Boolean(config && today >= config.starts_on && today <= config.ends_on);
  const claimedToday = character.last_daily_claim === today;
  const { count: claimedCount = 0 } =
    client && config
      ? await client
          .from("v2_presence_claims")
          .select("day_number", { count: "exact", head: true })
          .eq("character_id", characterId)
          .eq("campaign_start", config.starts_on)
      : { count: 0 };
  const completedRewards = Math.min(claimedCount ?? 0, rewards.length);
  const cycleDay = completedRewards < rewards.length ? completedRewards + 1 : rewards.length;
  const progress = rewards.length ? Math.round((completedRewards / rewards.length) * 100) : 0;
  const currentReward = rewards[cycleDay - 1];
  const currentItem = currentReward?.item_id ? items.get(currentReward.item_id) : null;
  const currentRewardName = currentReward
    ? currentReward.reward_type === "item" || currentReward.reward_type === "title"
      ? currentItem?.name ?? (currentReward.reward_type === "title" ? "Título exclusivo" : "Item especial")
      : `${currentReward.amount.toLocaleString("pt-BR")} ${currentReward.reward_type.toUpperCase()}`
    : "Ciclo concluído";

  return (
    <main className="presence-page">
      <PlayerNav />
      <div className="page-container presence-shell">
        <header className="presence-hero presence-hero--enhanced">
          <div className="presence-hero__copy">
            <span className="presence-kicker">✦ Recompensas diárias ✦</span>
            <h1>Seu retorno<br /><em>merece uma recompensa</em></h1>
            <p>
              Marque a presença de <strong>{character.name}</strong>, fortaleça sua jornada e avance
              até o tesouro final deste ciclo.
            </p>
            <div className="presence-hero__next">
              <span>Próxima recompensa</span>
              <strong>{currentRewardName}</strong>
              <small>{claimedToday ? "Volte amanhã para continuar a jornada" : campaignOpen ? "Disponível para resgate agora" : "A campanha está fora do período"}</small>
            </div>
          </div>
          <aside className="presence-progress-card">
            <div className="presence-progress-card__seal"><span>{completedRewards}</span><small>DIAS</small></div>
            <small>Progresso da jornada</small>
            <strong>{progress}% concluído</strong>
            <div className="presence-progress-bar" aria-label={`${progress}% do ciclo concluído`}>
              <i style={{ width: `${progress}%` }} />
            </div>
            <span><b>{completedRewards}</b> de {rewards.length} recompensas resgatadas</span>
            <span className="presence-preserved">✓ Seu progresso nunca é reiniciado por faltar um dia.</span>
            {config ? <span>{config.starts_on.split("-").reverse().join("/")} a {config.ends_on.split("-").reverse().join("/")}</span> : null}
          </aside>
        </header>

        {query.status ? (
          <div
            className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}
            role="status"
          >
            {query.status === "resgatado"
              ? "✓ Recompensa enviada para o personagem."
              : query.status === "ja_marcada"
                ? "✓ A presença deste personagem já foi marcada hoje. Volte amanhã para avançar novamente."
              : "! Não foi possível resgatar. Verifique se a presença de hoje já foi marcada."}
          </div>
        ) : null}

        <section className="presence-pass presence-pass--enhanced">
          <header>
            <div>
              <span className="presence-kicker">Ciclo atual</span>
              <h2>Trilha de recompensas</h2>
              <p>Avance um espaço por dia e alcance o prêmio especial no final.</p>
            </div>
            <form action={claimPresenceRewardAction}>
              <button className="button button--primary" disabled={claimedToday || !rewards.length || !campaignOpen || completedRewards >= rewards.length}>
                {!campaignOpen ? "Presença fora do período" : claimedToday ? "Presença marcada hoje" : completedRewards >= rewards.length ? "Passe concluído" : `Resgatar recompensa ${cycleDay}`}
              </button>
            </form>
          </header>
          <div className="presence-reward-grid">
            {rewards.map((reward, index) => {
              const position = index + 1;
              const state =
                position <= completedRewards
                  ? "claimed"
                  : position === cycleDay && !claimedToday
                    ? "available"
                    : "future";
              const item = reward.item_id ? items.get(reward.item_id) : null;
              return (
                <article className={position === rewards.length ? "is-grand-prize" : ""} data-state={state} key={reward.day_number}>
                  <header>
                    <span><i>{reward.day_number}</i> Dia {reward.day_number}</span>
                    <b>{state === "claimed" ? "✓ Resgatado" : state === "available" ? "Disponível" : "Bloqueado"}</b>
                  </header>
                  <div className="presence-reward-icon" data-type={reward.reward_type}>
                    {reward.reward_type === "item" || reward.reward_type === "title" ? (
                      <ItemArtwork name={item?.name ?? "Recompensa"} rarity={item?.rarity ?? "common"} slot={item?.slot ?? "necklace"} />
                    ) : (
                      <span>{reward.reward_type === "xp" ? "XP" : "WG"}</span>
                    )}
                  </div>
                  <strong>
                    {reward.reward_type === "item" || reward.reward_type === "title"
                      ? `${reward.reward_type === "title" ? "✦ " : ""}${item?.name ?? (reward.reward_type === "title" ? "Título" : "Item do arsenal")}`
                      : `${reward.amount.toLocaleString("pt-BR")} ${reward.reward_type.toUpperCase()}`}
                  </strong>
                  <small>
                    {reward.reward_type === "item" || reward.reward_type === "title"
                      ? `${reward.amount}x · ${item?.rarity ?? "equipamento"}`
                      : reward.reward_type === "xp"
                        ? "Experiência do personagem"
                        : "Moeda de Wonderland"}
                  </small>
                  {position === rewards.length ? <em className="presence-grand-label">✦ TESOURO FINAL ✦</em> : null}
                </article>
              );
            })}
          </div>
          {!rewards.length ? (
            <p className="presence-empty">
              O calendário de recompensas ainda está sendo preparado.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
