import { RewardConsole } from "@/components/admin/reward-console";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Console de recompensas | Painel ADM" };
export const dynamic = "force-dynamic";

export default async function AdminConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; afetados?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [{ data: characters }, { data: items }, query] = await Promise.all([
    client
      ? client.from("v2_characters").select("name").order("name")
      : Promise.resolve({ data: [] }),
    client
      ? client.from("v2_shop_items").select("name,slot").order("name")
      : Promise.resolve({ data: [] }),
    searchParams,
  ]);
  return (
    <div className="admin-content">
      {query.status ? (
        <div className={`account-notice ${query.status !== "sucesso" ? "is-warning" : ""}`}>
          {query.status === "sucesso"
            ? `✓ Recompensa confirmada no inventário de ${Math.max(0, Number(query.afetados ?? 0))} personagem(ns).`
            : query.status === "formato"
              ? "Use um dos formatos mostrados na cola."
              : `Não foi possível executar: ${query.status}`}
        </div>
      ) : null}
      <RewardConsole
        characters={(characters ?? []).map((x) => x.name)}
        rewards={(items ?? []).map(
          (x) => `${x.slot === "title" ? "titulo" : "item"}:${x.name} quantidade: 1`,
        )}
      />
    </div>
  );
}
