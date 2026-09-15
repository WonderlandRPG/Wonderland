import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function BalancePage() {
  await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  const { data } = client
    ? await client
        .from("v2_game_settings")
        .select("key,category,label,description,value,status,revision")
        .order("category")
    : { data: [] };
  return (
    <div className="admin-content">
      <section className="admin-page-title">
        <span className="eyebrow">Regras globais</span>
        <h2>Balanceamento</h2>
        <p>Visão central dos valores que controlam progressão, personagens e economia.</p>
      </section>
      <section className="admin-section">
        <div className="balance-grid">
          {data?.map((setting) => (
            <article key={setting.key}>
              <small>
                {setting.category} · revisão {setting.revision}
              </small>
              <h3>{setting.label}</h3>
              <p>{setting.description}</p>
              <strong>{JSON.stringify(setting.value)}</strong>
              <span className={`status-pill status-pill--${setting.status}`}>{setting.status}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
