import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { kingdomMissionNames, parseMissionBoard } from "@/lib/game/missions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { acceptMissionAction } from "./actions";

export const metadata = { title: "Mural de Missões" };
export const dynamic = "force-dynamic";

export default async function MissionBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mensagem?: string }>;
}) {
  const [{ characterId }, query] = await Promise.all([
    requireActiveCharacter("/missoes"),
    searchParams,
  ]);
  const client = await createServerSupabaseClient();
  const result = client
    ? await client.rpc("v2_get_mission_board", { p_character_id: characterId })
    : { data: null, error: null };
  const board = parseMissionBoard(result.data);
  if (!board)
    return (
      <main className="mission-page">
        <PlayerNav />
        <section className="mission-unavailable">
          <span>!</span>
          <h1>O mural está fechado</h1>
          <p>{result.error?.message ?? "Não foi possível carregar os contratos da Guilda."}</p>
        </section>
      </main>
    );
  const locked = board.lockedUntil ? new Date(board.lockedUntil) : null;
  const trialReady =
    board.requiredForTrial !== null && board.completedForRank >= board.requiredForTrial;
  return (
    <main className="mission-page">
      <PlayerNav />
      <div className="page-container mission-board-shell">
        <header className="mission-board-hero">
          <div>
            <span className="eyebrow">
              Guilda de {kingdomMissionNames[board.character.kingdom] ?? board.character.kingdom}
            </span>
            <h1>
              Mural de
              <br />
              <em>Missões</em>
            </h1>
            <p>
              Contratos reservados aos aventureiros de Rank {board.character.rank}. Aceite com
              cuidado: uma missão ativa fecha os portões da Arena e das Dungeons.
            </p>
          </div>
          <aside>
            <span className="mission-rank-seal">{board.character.rank}</span>
            <div>
              <small>Aventureiro registrado</small>
              <strong>{board.character.name}</strong>
              <b>Nível {board.character.level}</b>
            </div>
          </aside>
        </header>
        {query.status ? (
          <div
            className={`mission-notice ${query.status === "aceita" ? "is-success" : "is-warning"}`}
          >
            {query.status === "aceita"
              ? "Contrato aceito. A Guilda agora aguarda seu retorno."
              : (query.mensagem ?? "Não foi possível realizar esta ação.")}
          </div>
        ) : null}
        <section className="mission-board-progress">
          <div>
            <small>PROGRESSO NO RANK {board.character.rank}</small>
            <strong>
              {board.completedForRank} <i>/ {board.requiredForTrial ?? "—"}</i>
            </strong>
            <span>
              <i
                style={{
                  width: `${Math.min(100, (board.completedForRank / (board.requiredForTrial || 1)) * 100)}%`,
                }}
              />
            </span>
          </div>
          <p>
            {trialReady
              ? "A prova de ascensão foi fixada no mural."
              : "Conclua contratos para conquistar o direito à prova de ascensão."}
          </p>
          {board.canManage ? (
            <Link className="button button--gold" href="/missoes/gerenciar">
              Gerenciar mural
            </Link>
          ) : null}
        </section>
        {board.activeAssignment ? (
          <section
            className={`mission-active-contract ${board.activeAssignment.isRankTrial ? "is-trial" : ""}`}
          >
            <span className="mission-paper-pin" />
            <small>CONTRATO ASSINADO · MISSÃO EM ANDAMENTO</small>
            <h2>{board.activeAssignment.name}</h2>
            <p>{board.activeAssignment.objective}</p>
            <footer>
              <span>
                Aceita em {new Date(board.activeAssignment.acceptedAt).toLocaleString("pt-BR")}
              </span>
              <b>Missão em andamento</b>
            </footer>
          </section>
        ) : locked && locked > new Date() ? (
          <section className="mission-lockout">
            <span>⌛</span>
            <div>
              <small>PENALIDADE POR FALHA</small>
              <h2>Novos contratos bloqueados</h2>
              <p>Você poderá aceitar outra missão em {locked.toLocaleString("pt-BR")}.</p>
            </div>
          </section>
        ) : (
          <section className="guild-board">
            <div className="guild-board__wood" aria-hidden="true" />
            <header>
              <span>Contratos disponíveis</span>
              <small>
                {board.missions.length} papéis fixados · somente Rank {board.character.rank}
              </small>
            </header>
            <div className="guild-board__grid">
              {board.missions.map((mission, index) => (
                <article
                  className={`mission-parchment ${mission.isRankTrial ? "is-rank-trial" : ""}`}
                  key={mission.id}
                  style={
                    {
                      "--paper-tilt": `${[-1.2, 0.7, -0.4, 1][index % 4]}deg`,
                    } as React.CSSProperties
                  }
                >
                  <i className="mission-paper-pin" />
                  <div className="mission-parchment__head">
                    <span>RANK {mission.rank}</span>
                    <small>{kingdomMissionNames[mission.kingdom]}</small>
                  </div>
                  {mission.isRankTrial ? (
                    <div className="mission-trial-ribbon">
                      PROVA DE ASCENSÃO · RANK {mission.promotionRank}
                    </div>
                  ) : null}
                  <h2>{mission.name}</h2>
                  <p>{mission.description}</p>
                  <blockquote>
                    <small>OBJETIVO</small>
                    <span>{mission.objective}</span>
                  </blockquote>
                  <dl>
                    <div>
                      <dt>XP</dt>
                      <dd>{mission.rewardXp.toLocaleString("pt-BR")}</dd>
                    </div>
                    <div>
                      <dt>WG</dt>
                      <dd>{mission.rewardGold.toLocaleString("pt-BR")}</dd>
                    </div>
                    <div>
                      <dt>Nível</dt>
                      <dd>{mission.minLevel}+</dd>
                    </div>
                  </dl>
                  <form action={acceptMissionAction}>
                    <input name="missionId" type="hidden" value={mission.id} />
                    <button type="submit">
                      Aceitar missão <span>→</span>
                    </button>
                  </form>
                </article>
              ))}
            </div>
            {!board.missions.length ? (
              <p className="guild-board__empty">
                Nenhum novo contrato está disponível. Missões concluídas retornam após sete dias.
              </p>
            ) : null}
          </section>
        )}
        <footer className="mission-board-rules">
          <strong>Leis do Mural</strong>
          <span>01 · Apenas um contrato por vez</span>
          <span>02 · Arena e Dungeon bloqueadas durante a missão</span>
          <span>03 · Falha impõe espera de 24 horas</span>
          <span>04 · Contratos retornam após 7 dias</span>
        </footer>
      </div>
    </main>
  );
}
