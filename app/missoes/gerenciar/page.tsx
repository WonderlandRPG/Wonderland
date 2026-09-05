import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { requireMissionManager } from "@/lib/auth/account";
import { kingdomMissionNames, parseManagedMissions } from "@/lib/game/missions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cancelMissionAction, resolveMissionAction } from "./actions";

export const metadata = { title: "Gerenciar missões" };
export const dynamic = "force-dynamic";
export default async function MissionManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mensagem?: string }>;
}) {
  await requireMissionManager();
  const query = await searchParams;
  const client = await createServerSupabaseClient();
  const result = client ? await client.rpc("v2_get_managed_missions") : { data: null, error: null };
  const assignments = parseManagedMissions(result.data);
  const assignmentIds = assignments.map((item) => item.assignmentId);
  const { data: sceneRows } = client && assignmentIds.length
    ? await client.from("v2_mission_assignments").select("id,scene_stage,scene_summary,scene_submitted_at").in("id", assignmentIds)
    : { data: [] };
  const scenes = new Map((sceneRows ?? []).map((row) => [row.id, row]));
  return (
    <main className="mission-page">
      <PlayerNav />
      <div className="page-container mission-management">
        <header>
          <div>
            <span className="eyebrow">Livro de controle da Guilda</span>
            <h1>Contratos em campo</h1>
            <p>
              Avalie o retorno dos aventureiros. Missões não concluídas ou canceladas liberam o
              personagem imediatamente.
            </p>
          </div>
          <Link className="button button--glass" href="/missoes">
            ← Voltar ao mural
          </Link>
        </header>
        {query.status ? (
          <div
            className={`mission-notice ${query.status === "completed" || query.status === "cancelled" ? "is-success" : "is-warning"}`}
          >
            {query.status === "completed"
              ? "Missão concluída e recompensas entregues."
              : query.status === "failed"
                ? "Missão marcada como não concluída. O personagem já pode escolher outro contrato."
                : query.status === "cancelled"
                  ? "Missão cancelada. O personagem foi liberado sem penalidade."
                  : (query.mensagem ?? "Ação não concluída.")}
          </div>
        ) : null}
        <section className="mission-ledger">
          <header>
            <span>Personagem</span>
            <span>Rank / Nível</span>
            <span>Missão</span>
            <span>Recompensa</span>
            <span>Decisão</span>
          </header>
          {assignments.map((item) => {
            const scene = scenes.get(item.assignmentId);
            const ready = scene?.scene_stage === "awaiting_evaluation";
            return <article key={item.assignmentId}>
              <div>
                <strong>{item.characterName}</strong>
                <small>{kingdomMissionNames[item.kingdom] ?? item.kingdom}</small>
              </div>
              <div>
                <b>Rank {item.characterRank}</b>
                <small>Nível {item.characterLevel}</small>
              </div>
              <div>
                <strong>{item.missionName}</strong>
                <small>
                  Missão {item.missionRank}
                  {item.isRankTrial ? " · Prova de ascensão" : ""}
                </small>
                <details className="mission-manager-briefing">
                  <summary>Ler missão escolhida</summary>
                  <div>
                    <b>História</b>
                    <p>{item.missionDescription}</p>
                    <b>Objetivo</b>
                    <p>{item.missionObjective}</p>
                  </div>
                </details>
                <details className="mission-manager-briefing">
                  <summary>{ready ? "Relato enviado pelo jogador" : "Cena ainda não enviada"}</summary>
                  <div><p>{scene?.scene_summary ?? "O jogador ainda precisa iniciar a cena e enviar o resumo para avaliação."}</p></div>
                </details>
              </div>
              <div>
                <b>{item.rewardXp.toLocaleString("pt-BR")} XP</b>
                <small>{item.rewardGold.toLocaleString("pt-BR")} WG</small>
              </div>
              <div className="mission-manager-actions">
                <form action={resolveMissionAction}>
                  <input name="assignmentId" type="hidden" value={item.assignmentId} />
                  <button className="is-complete" name="result" value="completed" disabled={!ready} title={!ready ? "Aguarde o envio da cena" : undefined}>
                    Concluída
                  </button>
                  <button className="is-failed" name="result" value="failed">
                    Não concluída
                  </button>
                </form>
                <form action={cancelMissionAction}>
                  <input name="assignmentId" type="hidden" value={item.assignmentId} />
                  <button className="is-cancelled">Cancelar missão</button>
                </form>
              </div>
            </article>;
          })}
          {!assignments.length ? (
            <div className="mission-ledger__empty">
              <span>✓</span>
              <h2>Nenhum contrato aguarda avaliação</h2>
              <p>Quando um jogador aceitar uma missão, ela aparecerá neste livro.</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
