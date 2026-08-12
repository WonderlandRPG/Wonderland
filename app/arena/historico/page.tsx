import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { getPvpHistory } from "@/lib/game/player-portal";

export const metadata = { title: "Histórico PvP" };
export const dynamic = "force-dynamic";

export default async function PvpHistoryPage() {
  const { characterId } = await requireActiveCharacter("/arena/historico");
  const history = await getPvpHistory(characterId);
  const victories = history.filter((entry) => entry.result === "victory").length;
  const defeats = history.length - victories;
  const rate = history.length ? (victories / history.length) * 100 : 0;
  return (
    <main className="arena-page pvp-history-page">
      <PlayerNav />
      <div className="page-container pvp-history-shell">
        <header className="pvp-history-hero">
          <div>
            <span className="eyebrow">Registro competitivo</span>
            <h1>Histórico PvP</h1>
            <p>
              Cada duelo oficial, seu resultado e o adversário enfrentado pelo personagem
              selecionado.
            </p>
          </div>
          <Link className="button button--primary" href="/arena?modo=pvp">
            Entrar na fila
          </Link>
        </header>
        <section className="pvp-history-metrics">
          <article>
            <small>Partidas</small>
            <strong>{history.length}</strong>
          </article>
          <article>
            <small>Vitórias</small>
            <strong>{victories}</strong>
          </article>
          <article>
            <small>Derrotas</small>
            <strong>{defeats}</strong>
          </article>
          <article>
            <small>Taxa de vitória</small>
            <strong>{rate.toFixed(1)}%</strong>
          </article>
        </section>
        <section className="pvp-history-ledger">
          <header>
            <div>
              <span className="eyebrow">Últimos confrontos</span>
              <h2>Diário da Arena</h2>
            </div>
            <small>Até 100 partidas recentes</small>
          </header>
          {history.map((entry) => (
            <article
              className={entry.result === "victory" ? "is-victory" : "is-defeat"}
              key={`${entry.match_id}-${entry.opponent_id}`}
            >
              <span
                className={`pvp-history-avatar ${entry.opponent_image_url ? "is-image" : ""}`}
                style={
                  entry.opponent_image_url
                    ? { backgroundImage: `url(${entry.opponent_image_url})` }
                    : undefined
                }
              >
                {entry.opponent_image_url ? "" : entry.opponent_name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <small>
                  {entry.result === "victory" ? "Vitória" : "Derrota"} · Rank {entry.rank}
                </small>
                <h3>Contra {entry.opponent_name}</h3>
                <p>
                  {entry.rounds} rodada(s) ·{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  }).format(new Date(entry.finished_at))}
                </p>
              </div>
              <strong>{entry.result === "victory" ? "V" : "D"}</strong>
            </article>
          ))}
          {!history.length ? (
            <div className="pvp-history-empty">
              <span>VS</span>
              <h3>Nenhum duelo concluído</h3>
              <p>Entre na fila PvP e escreva o primeiro resultado deste personagem.</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
