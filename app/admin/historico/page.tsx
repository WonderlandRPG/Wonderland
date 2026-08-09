import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function HistoryPage() {
  await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  const [history, revisions] = client
    ? await Promise.all([
        client
          .from("v2_admin_history")
          .select("id,action,target_type,target_id,created_at")
          .order("created_at", { ascending: false })
          .limit(80),
        client
          .from("v2_content_revisions")
          .select("id,content_id,revision,created_at")
          .order("created_at", { ascending: false })
          .limit(40),
      ])
    : [{ data: [] }, { data: [] }];
  const entries = [
    ...(history.data ?? []).map((x) => ({
      id: `a${x.id}`,
      action: x.action,
      target: x.target_type,
      date: x.created_at,
    })),
    ...(revisions.data ?? []).map((x) => ({
      id: `r${x.id}`,
      action: `Conteúdo salvo · revisão ${x.revision}`,
      target: "conteúdo",
      date: x.created_at,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="admin-content">
      <section className="admin-page-title">
        <span className="eyebrow">Auditoria</span>
        <h2>Histórico administrativo</h2>
        <p>Registro geral das ações importantes realizadas no painel.</p>
      </section>
      <section className="admin-section">
        <div className="history-list">
          {entries.length ? (
            entries.map((e) => (
              <article key={e.id}>
                <span>✓</span>
                <div>
                  <strong>{e.action}</strong>
                  <small>{e.target}</small>
                </div>
                <time>{new Date(e.date).toLocaleString("pt-BR")}</time>
              </article>
            ))
          ) : (
            <p>Nenhuma ação registrada ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
