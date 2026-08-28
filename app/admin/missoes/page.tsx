import { requireAdministrativeAccount } from "@/lib/auth/account";
import { kingdomMissionNames, missionKingdoms, missionRanks } from "@/lib/game/missions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMissionAction, toggleMissionAction } from "./actions";
export const metadata = { title: "Missões | Painel ADM" };
export const dynamic = "force-dynamic";
export default async function AdminMissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mensagem?: string }>;
}) {
  await requireAdministrativeAccount();
  const query = await searchParams;
  const client = await createServerSupabaseClient();
  const { data: missions } = client
    ? await client.from("v2_missions").select("*").order("rank").order("kingdom").order("name")
    : { data: [] };
  return (
    <div className="admin-content admin-missions">
      <section className="admin-page-title">
        <span className="eyebrow">Conteúdo da Guilda</span>
        <h2>Missões e provas</h2>
        <p>
          Crie contratos por reino. XP e WG seguem automaticamente a tabela oficial de cada Rank.
        </p>
      </section>
      {query.status ? (
        <div
          className={`admin-notice ${query.status === "criada" || query.status === "atualizada" ? "" : "admin-notice--error"}`}
        >
          {query.status === "criada"
            ? "Missão criada e publicada no mural."
            : query.status === "atualizada"
              ? "Disponibilidade atualizada."
              : (query.mensagem ?? "Revise os campos da missão.")}
        </div>
      ) : null}
      <section className="admin-mission-grid">
        <form action={createMissionAction} className="admin-editor-card admin-form">
          <header>
            <small>NOVO CONTRATO</small>
            <h3>Fixar missão no mural</h3>
          </header>
          <label className="form-field">
            Nome
            <input name="name" required maxLength={100} />
          </label>
          <label className="form-field">
            Slug
            <input
              name="slug"
              placeholder="patrulha-das-raizes"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
          </label>
          <label className="form-field">
            Descrição
            <textarea name="description" required rows={5} />
          </label>
          <label className="form-field">
            Objetivo
            <textarea name="objective" required rows={3} />
          </label>
          <div className="admin-form-grid">
            <label className="form-field">
              Reino
              <select name="kingdom">
                {missionKingdoms.map((key) => (
                  <option key={key} value={key}>
                    {kingdomMissionNames[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Rank
              <select name="rank">
                {missionRanks.map((rank) => (
                  <option key={rank}>{rank} · recompensa oficial</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Nível mínimo
              <input name="minLevel" type="number" min={1} max={100} defaultValue={1} />
            </label>
            <label className="form-field">
              Rank da promoção
              <select name="promotionRank">
                {["D", "C", "B", "A"].map((rank) => (
                  <option key={rank}>{rank}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="admin-form-note">
            A recompensa é aplicada automaticamente: E 500 XP/100 WG · D 1.000/250 · C 2.000/600 · B
            4.000/1.500 · A 8.000/4.000 · S 15.000/10.000 · EX 30.000/25.000.
          </p>
          <label className="admin-check">
            <input name="isRankTrial" type="checkbox" /> Esta é uma prova de ascensão
          </label>
          <button className="button button--primary" type="submit">
            Criar missão →
          </button>
        </form>
        <aside className="admin-mission-summary">
          <span>CATÁLOGO ATUAL</span>
          <strong>{missions?.length ?? 0}</strong>
          <p>contratos e provas cadastrados</p>
          {missionRanks.map((rank) => (
            <div key={rank}>
              <b>Rank {rank}</b>
              <span>{missions?.filter((m) => m.rank === rank).length ?? 0}</span>
            </div>
          ))}
        </aside>
      </section>
      <section className="admin-section admin-mission-catalog">
        <header>
          <div>
            <small>ARQUIVO DE CONTRATOS</small>
            <h3>Missões cadastradas</h3>
          </div>
          <span>{missions?.filter((m) => m.active).length ?? 0} ativas</span>
        </header>
        <div>
          {missions?.map((mission) => (
            <article key={mission.id} className={mission.active ? "" : "is-inactive"}>
              <span className="mission-rank-seal">{mission.rank}</span>
              <div>
                <small>
                  {kingdomMissionNames[mission.kingdom]}
                  {mission.is_rank_trial ? " · PROVA" : ""}
                </small>
                <strong>{mission.name}</strong>
                <p>{mission.objective}</p>
              </div>
              <dl>
                <div>
                  <dt>XP</dt>
                  <dd>{mission.reward_xp.toLocaleString("pt-BR")}</dd>
                </div>
                <div>
                  <dt>WG</dt>
                  <dd>{mission.reward_gold.toLocaleString("pt-BR")}</dd>
                </div>
                <div>
                  <dt>Nível</dt>
                  <dd>{mission.min_level}+</dd>
                </div>
              </dl>
              <form action={toggleMissionAction}>
                <input name="id" type="hidden" value={mission.id} />
                <input name="active" type="hidden" value={String(mission.active)} />
                <button
                  className={`button button--small ${mission.active ? "button--danger" : "button--primary"}`}
                >
                  {mission.active ? "Arquivar" : "Reativar"}
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
