import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveUpdateAction } from "./actions";
export const metadata = { title: "Atualizações | Painel ADM" };
export default async function AdminUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [{ data }, query] = await Promise.all([
    client
      ? client.from("v2_updates").select("*").order("published_on", { ascending: false })
      : Promise.resolve({ data: [] }),
    searchParams,
  ]);
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <span className="eyebrow">Diário público</span>
          <h1>Atualizações</h1>
          <p>Publique versões e altere as notas exibidas aos jogadores.</p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Atualização salva." : "! Revise os dados."}
        </div>
      ) : null}
      <section className="admin-panel">
        <h2>Nova atualização</h2>
        <UpdateForm />
      </section>
      <section className="admin-card-grid">
        {(data ?? []).map((update) => (
          <article className="admin-panel" key={update.id}>
            <UpdateForm
              update={{
                ...update,
                notes: Array.isArray(update.notes)
                  ? update.notes.filter((note): note is string => typeof note === "string")
                  : [],
              }}
            />
          </article>
        ))}
      </section>
    </div>
  );
}
function UpdateForm({
  update,
}: {
  update?: {
    id: string;
    version: string;
    title: string;
    notes: string[];
    published_on: string;
    active: boolean;
  };
}) {
  return (
    <form action={saveUpdateAction} className="admin-form">
      <input name="id" type="hidden" value={update?.id ?? ""} />
      <label>
        <span>Versão</span>
        <input name="version" placeholder="2.3.0" defaultValue={update?.version} required />
      </label>
      <label>
        <span>Título</span>
        <input name="title" defaultValue={update?.title} required />
      </label>
      <label>
        <span>Data</span>
        <input
          name="publishedOn"
          type="date"
          defaultValue={update?.published_on ?? new Date().toISOString().slice(0, 10)}
          required
        />
      </label>
      <label>
        <span>Notas (uma por linha)</span>
        <textarea name="notes" defaultValue={update?.notes.join("\n")} rows={5} required />
      </label>
      <label>
        <input name="active" type="checkbox" defaultChecked={update?.active ?? true} /> Visível aos
        jogadores
      </label>
      <button className="button button--primary">
        {update ? "Salvar alterações" : "Publicar atualização"}
      </button>
    </form>
  );
}
