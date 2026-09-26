import { createRankedSeasonAction, setRankedSeasonStatusAction } from "./actions";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RankedSeasonRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "active" | "finished";
  created_at: string;
};

export default async function RankedSeasonsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mensagem?: string }>;
}) {
  await requireAdministrativeAccount();
  const query = await searchParams;
  const client = await createServerSupabaseClient();
  const { data: rawData } = client
    ? await client
        .from("v2_ranked_seasons")
        .select("id,name,starts_at,ends_at,status,created_at")
        .order("starts_at", { ascending: false })
    : { data: [] };
  const data = (rawData ?? []) as RankedSeasonRow[];
  const start = new Date();
  const end = new Date(start.getTime() + 90 * 86400000);
  return (
    <div className="admin-content">
      <section className="admin-page-title">
        <span className="eyebrow">Competitivo</span>
        <h2>Temporadas ranqueadas</h2>
        <p>Agende, ative e encerre temporadas 2×2 sem alterar partidas históricas.</p>
      </section>
      {query.status ? (
        <p className={query.status === "salvo" ? "admin-success" : "admin-error"}>
          {query.status === "salvo"
            ? "Temporada atualizada."
            : (query.mensagem ?? "Não foi possível salvar.")}
        </p>
      ) : null}
      <section className="admin-section">
        <h3>Nova temporada</h3>
        <form action={createRankedSeasonAction} className="admin-form-grid">
          <label>
            <span>Nome</span>
            <input name="name" required minLength={3} placeholder="Temporada II" />
          </label>
          <label>
            <span>Início</span>
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={start.toISOString().slice(0, 16)}
              required
            />
          </label>
          <label>
            <span>Encerramento</span>
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={end.toISOString().slice(0, 16)}
              required
            />
          </label>
          <label>
            <input name="activate" type="checkbox" /> Ativar ao criar
          </label>
          <button className="button button--primary" type="submit">
            Criar temporada
          </button>
        </form>
      </section>
      <section className="admin-section">
        <div className="history-list">
          {(data ?? []).map((season) => (
            <article key={season.id}>
              <span>{season.status === "active" ? "●" : "○"}</span>
              <div>
                <strong>{season.name}</strong>
                <small>
                  {new Date(season.starts_at).toLocaleDateString("pt-BR")} —{" "}
                  {new Date(season.ends_at).toLocaleDateString("pt-BR")} · {season.status}
                </small>
              </div>
              <form action={setRankedSeasonStatusAction}>
                <input type="hidden" name="id" value={season.id} />
                <select name="status" defaultValue={season.status}>
                  <option value="scheduled">Agendada</option>
                  <option value="active">Ativa</option>
                  <option value="finished">Encerrada</option>
                </select>
                <button type="submit">Aplicar</button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
