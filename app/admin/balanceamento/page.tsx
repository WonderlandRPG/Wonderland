import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateGameSettingAction } from "./actions";
export const dynamic = "force-dynamic";
export default async function BalancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; chave?: string }>;
}) {
  await requireAdministrativeAccount();
  const query = await searchParams;
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
        <p>
          Edite buffs, nerfs e regras globais. Classes, raças e itens continuam com seus editores
          detalhados próprios.
        </p>
      </section>
      {query.status ? (
        <div
          className={`admin-notice ${query.status === "salvo" ? "" : "admin-notice--error"}`}
          role="status"
        >
          {query.status === "salvo"
            ? `✓ ${query.chave ?? "Regra"} atualizada e registrada no histórico.`
            : "Não foi possível salvar. Confira o JSON ou atualize a página para evitar conflito de revisão."}
        </div>
      ) : null}
      <section className="admin-section">
        <div className="balance-grid">
          {data?.map((setting) => (
            <article key={setting.key}>
              <small>
                {setting.category} · revisão {setting.revision}
              </small>
              <h3>{setting.label}</h3>
              <p>{setting.description}</p>
              <form action={updateGameSettingAction} className="race-editor-form">
                <input name="key" type="hidden" value={setting.key} />
                <input name="expectedRevision" type="hidden" value={setting.revision} />
                <label>
                  <span>Valor JSON</span>
                  <textarea
                    name="value"
                    rows={5}
                    defaultValue={JSON.stringify(setting.value, null, 2)}
                  />
                </label>
                <label>
                  <span>Estado</span>
                  <select name="status" defaultValue={setting.status}>
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </label>
                <button className="admin-action-button" type="submit">
                  Salvar regra
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
