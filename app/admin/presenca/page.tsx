import { createServerSupabaseClient } from "@/lib/supabase/server";
import { savePresenceRewardsAction } from "./actions";
export const metadata = { title: "Presença | Painel ADM" };
export default async function PresenceAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [{ data }, query] = await Promise.all([
    client
      ? client
          .from("v2_game_settings")
          .select("key,value")
          .in("key", [
            "economy.daily_base_reward",
            "economy.daily_streak_bonus",
            "economy.daily_streak_cap",
            "progression.daily_xp_reward",
          ])
      : Promise.resolve({ data: [] }),
    searchParams,
  ]);
  const values = new Map((data ?? []).map((x) => [x.key, Number(x.value)]));
  return (
    <div className="admin-content">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Retenção diária</span>
          <h2>Recompensas de presença</h2>
          <p>Defina quanto cada personagem recebe ao marcar presença e manter sua sequência.</p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Recompensas atualizadas." : "! Revise os valores."}
        </div>
      ) : null}
      <section className="admin-editor-card presence-reward-card">
        <form action={savePresenceRewardsAction} className="admin-form">
          <label>
            <span>WG base</span>
            <input
              name="base"
              type="number"
              min="0"
              defaultValue={values.get("economy.daily_base_reward") ?? 50}
            />
          </label>
          <label>
            <span>WG por dia de sequência</span>
            <input
              name="bonus"
              type="number"
              min="0"
              defaultValue={values.get("economy.daily_streak_bonus") ?? 10}
            />
          </label>
          <label>
            <span>Limite de dias do bônus</span>
            <input
              name="cap"
              type="number"
              min="1"
              defaultValue={values.get("economy.daily_streak_cap") ?? 7}
            />
          </label>
          <label>
            <span>XP diário</span>
            <input
              name="xp"
              type="number"
              min="0"
              defaultValue={values.get("progression.daily_xp_reward") ?? 25}
            />
          </label>
          <button className="button button--primary">Salvar recompensas</button>
        </form>
      </section>
    </div>
  );
}
