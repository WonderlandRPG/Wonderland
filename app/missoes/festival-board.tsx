import type { MissionBoard } from "@/lib/game/missions";
import { acceptMissionAction } from "./actions";

export function FestivalSceneBriefing({ description }: { description: string }) {
  return (
    <div>
      {description.split("\n\n").map((section) => {
        const separator = section.indexOf(": ");
        return separator > 0 ? (
          <p key={section}>
            <strong>{section.slice(0, separator)}:</strong> {section.slice(separator + 2)}
          </p>
        ) : (
          <p key={section}>{section}</p>
        );
      })}
    </div>
  );
}

export function festivalDateLabel(value: string) {
  return new Date(`${value}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  });
}

export function FestivalBoard({ board }: { board: MissionBoard }) {
  const festival = board.festival;
  if (!festival) return null;
  const mission = festival.mission;
  const activeFestival = Boolean(board.activeAssignment?.eventDay);
  const finished = festival.completedCount >= festival.totalMissions;
  return (
    <section className="festival-board" data-wl-surface="raised" aria-labelledby="festival-title">
      <header className="festival-board__header">
        <div>
          <span className="eyebrow">8 a 25 de outubro · Preparativos do festival</span>
          <h2 id="festival-title">Noites Apavorantes</h2>
          <p>Ajude os visitantes a preparar a celebração do seu reino.</p>
        </div>
        <dl className="festival-board__totals">
          <div>
            <dt>Missões concluídas</dt>
            <dd>
              {festival.completedCount} / {festival.totalMissions}
            </dd>
          </div>
          <div>
            <dt>Seus Doces Apavorantes</dt>
            <dd>{festival.candyBalance.toLocaleString("pt-BR")}</dd>
          </div>
        </dl>
      </header>
      <p className="festival-board__rules">
        Uma missão nova por dia, liberada à meia-noite de São Paulo. Conclua as anteriores para
        avançar; você pode recuperar os dias atrasados até 31/10. Cada missão pode ser concluída uma
        vez por jogador. A recompensa é o dobro do XP de uma missão do seu rank atual, além de Doces
        Apavorantes.
      </p>
      <div className="festival-board__rules">
        <strong>Como escrever sua cena</strong>
        <p>
          Narre a chegada do seu personagem, suas ações e reações à complicação e o desfecho da
          ajuda. Você escolhe a estratégia, respeitando as capacidades do personagem e o reino. As
          quantidades orientam o pedido; a missão é realizada por texto, com desenvolvimento da
          cena. Não é necessário explicar a origem dos sinais misteriosos.
        </p>
        <p>Apresente sua cena à Guilda para avaliação e conclusão da missão.</p>
      </div>
      {finished ? (
        <p data-wl-status="success">
          Você concluiu todos os preparativos. Agora é esperar pela celebração.
        </p>
      ) : activeFestival ? (
        <p data-wl-status="warning">
          Sua missão do festival está em andamento. A conclusão pela Guilda libera a próxima.
        </p>
      ) : !festival.isActive ? (
        <p>Os preparativos do festival não estão disponíveis neste momento.</p>
      ) : mission ? (
        <article className="festival-board__mission" data-wl-component="card">
          <span className="eyebrow">Missão de {festivalDateLabel(mission.eventDay)}</span>
          <h3>{mission.name}</h3>
          <FestivalSceneBriefing description={mission.description} />
          <div className="festival-board__objective">
            <strong>Objetivo da cena</strong>
            <p>{mission.objective}</p>
          </div>
          <div className="festival-board__reward">
            <span>
              <strong>{mission.rewardXp.toLocaleString("pt-BR")} XP</strong> · XP em dobro do Rank{" "}
              {board.character.rank}
            </span>
            <span>
              <strong>{mission.rewardCandies} Doces Apavorantes</strong>
            </span>
          </div>
          {board.activeAssignment ? (
            <p>Conclua sua missão em andamento para ajudar nos preparativos.</p>
          ) : (
            <form action={acceptMissionAction}>
              <input name="missionId" type="hidden" value={mission.id} />
              <button className="button button--primary" type="submit">
                Ajudar o festival
              </button>
            </form>
          )}
        </article>
      ) : festival.nextReleaseDate ? (
        <p>
          Você está em dia com os preparativos. O próximo pedido chega em{" "}
          {festivalDateLabel(festival.nextReleaseDate)}.
        </p>
      ) : (
        <p>Nenhum novo pedido está disponível.</p>
      )}
    </section>
  );
}
