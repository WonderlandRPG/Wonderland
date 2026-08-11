import { PresenceRewardEditor } from "@/components/admin/presence-reward-editor";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Presença | Painel ADM" };
export const dynamic = "force-dynamic";

const defaultRewards = Array.from({ length: 15 }, (_, index) => ({
  day_number: index + 1,
  reward_type: (index % 2 ? "xp" : "wg") as "xp" | "wg" | "item",
  amount: 100 + index * 50,
  item_id: null,
}));

export default async function PresenceAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [rewardResult, itemResult, query] = await Promise.all([
    client
      ? client.from("v2_presence_rewards").select("*").order("day_number")
      : Promise.resolve({ data: [] }),
    client
      ? client
          .from("v2_shop_items")
          .select("id,name,rarity")
          .eq("active", true)
          .order("rarity")
          .order("name")
      : Promise.resolve({ data: [] }),
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
          <p>Escolha a recompensa de cada dia entre XP, WG ou qualquer item ativo da loja.</p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Passe atualizado." : "! Revise as recompensas."}
        </div>
      ) : null}
      <PresenceRewardEditor items={itemResult.data ?? []} rewards={rewards} />
    </div>
  );
}
