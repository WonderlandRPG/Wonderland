import { PresenceRewardEditor } from "@/components/admin/presence-reward-editor";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Presença | Painel ADM" };
export const dynamic = "force-dynamic";

const defaultRewards = Array.from({ length: 31 }, (_, index) => ({
  day_number: index + 1,
  reward_type: (index % 2 ? "xp" : "wg") as "xp" | "wg" | "item" | "title",
  amount: 100 + index * 50,
  item_id: null,
}));
const defaultStart = new Date();
const defaultEnd = new Date(defaultStart);
defaultEnd.setDate(defaultEnd.getDate() + 14);
const defaultConfig = {
  starts_on: defaultStart.toISOString().slice(0, 10),
  ends_on: defaultEnd.toISOString().slice(0, 10),
  day_count: 15,
};

export default async function PresenceAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [rewardResult, itemResult, configResult, query] = await Promise.all([
    client
      ? client.from("v2_presence_rewards").select("*").order("day_number")
      : Promise.resolve({ data: [] }),
    client
      ? client
          .from("v2_shop_items")
          .select("id,name,rarity,slot")
          .order("rarity")
          .order("name")
      : Promise.resolve({ data: [] }),
    client
      ? client.from("v2_presence_pass_config").select("*").eq("id", true).maybeSingle()
      : Promise.resolve({ data: null }),
    searchParams,
  ]);
  const stored = new Map((rewardResult.data ?? []).map((reward) => [reward.day_number, reward]));
  const rewards = defaultRewards.map((fallback) => stored.get(fallback.day_number) ?? fallback);
  return (
    <div className="admin-content admin-presence-page">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Retenção diária</span>
          <h2>Passe de Presença</h2>
          <p>Defina o período, a duração e cada recompensa entre XP, WG, item ou Título.</p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Passe atualizado." : "! Revise as recompensas."}
        </div>
      ) : null}
      <PresenceRewardEditor
        items={itemResult.data ?? []}
        rewards={rewards}
        config={
          configResult.data ?? defaultConfig
        }
      />
    </div>
  );
}
