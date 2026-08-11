import { ItemGlyph } from "@/components/items/item-glyph";
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
  const [character, query, rewardResult] = await Promise.all([
    requireCharacterSheet(characterId),
    searchParams,
    client
      ? client.from("v2_presence_rewards").select("*").eq("active", true).order("day_number")
      : Promise.resolve({ data: [] }),
  ]);
  const rewards = rewardResult.data ?? [];
  const itemIds = rewards.flatMap((reward) => (reward.item_id ? [reward.item_id] : []));
  const { data: itemRows } =
    client && itemIds.length
      ? await client.from("v2_shop_items").select("id,name,rarity,slot").in("id", itemIds)
      : { data: [] };
  const items = new Map((itemRows ?? []).map((item) => [item.id, item]));
  const today = dateInSaoPaulo();
  const yesterday = dateInSaoPaulo(-1);
  const claimedToday = character.last_daily_claim === today;
  const nextStreak =
    claimedToday || character.last_daily_claim === yesterday ? character.daily_streak + 1 : 1;
  const visibleStreak = claimedToday ? character.daily_streak : nextStreak;
  const cycleDay = rewards.length ? ((Math.max(1, visibleStreak) - 1) % rewards.length) + 1 : 0;
  const completedInCycle = claimedToday ? cycleDay : Math.max(0, cycleDay - 1);

  return (
    <main className="presence-page">
      <PlayerNav />
      <div className="page-container presence-shell">
        <header className="presence-hero">
          <div>
            <span className="eyebrow">Jornada diária</span>
            <h1>Passe de Presença</h1>
            <p>
              Entre em Wonderland, marque sua presença e avance pelo ciclo de recompensas de{" "}
              {character.name}.
            </p>
          </div>
          <aside>
            <small>Sequência atual</small>
            <strong>{character.daily_streak} dia(s)</strong>
            <span>O ciclo reinicia após a última recompensa.</span>
          </aside>
        </header>

        {query.status ? (
          <div
            className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}
            role="status"
          >
            {query.status === "resgatado"
              ? "✓ Recompensa enviada para o personagem."
              : "! Não foi possível resgatar. Verifique se a presença de hoje já foi marcada."}
          </div>
        ) : null}

        <section className="presence-pass">
          <header>
            <div>
              <span className="eyebrow">Ciclo atual</span>
              <h2>Recompensas da jornada</h2>
            </div>
            <form action={claimPresenceRewardAction}>
              <button className="button button--primary" disabled={claimedToday || !rewards.length}>
                {claimedToday ? "Presença marcada hoje" : `Resgatar dia ${cycleDay}`}
              </button>
            </form>
          </header>
          <div className="presence-reward-grid">
            {rewards.map((reward, index) => {
              const position = index + 1;
              const state =
                position <= completedInCycle
                  ? "claimed"
                  : position === cycleDay && !claimedToday
                    ? "available"
                    : "future";
              const item = reward.item_id ? items.get(reward.item_id) : null;
              return (
                <article data-state={state} key={reward.day_number}>
                  <header>
                    <span>Dia {reward.day_number}</span>
                    <b>{state === "claimed" ? "✓" : state === "available" ? "Agora" : ""}</b>
                  </header>
                  <div className="presence-reward-icon" data-type={reward.reward_type}>
                    {reward.reward_type === "item" ? (
                      <ItemGlyph slot={item?.slot ?? "necklace"} />
                    ) : (
                      <span>{reward.reward_type === "xp" ? "XP" : "WG"}</span>
                    )}
                  </div>
                  <strong>
                    {reward.reward_type === "item"
                      ? (item?.name ?? "Item do arsenal")
                      : `${reward.amount.toLocaleString("pt-BR")} ${reward.reward_type.toUpperCase()}`}
                  </strong>
                  <small>
                    {reward.reward_type === "item"
                      ? `${reward.amount}x · ${item?.rarity ?? "equipamento"}`
                      : reward.reward_type === "xp"
                        ? "Experiência do personagem"
                        : "Moeda de Wonderland"}
                  </small>
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
