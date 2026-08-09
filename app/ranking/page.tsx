import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import { getRanking } from "@/lib/game/player-portal";
export const dynamic = "force-dynamic";
export default async function RankingPage() {
  const ranking = await getRanking();
  return (
    <PortalShell
      eyebrow="Salão da fama"
      title="Ranking de aventureiros"
      description="Acompanhe quem está deixando sua marca nos reinos de Wonderland."
    >
      <div className="ranking-list">
        {ranking.length ? (
          ranking.map((player) => (
            <Link href={`/jogadores/${player.user_id}`} key={player.user_id}>
              <strong>#{player.rank}</strong>
              <span className="portal-avatar">{player.displayName.slice(0, 2).toUpperCase()}</span>
              <div>
                <h2>{player.displayName}</h2>
                <p>
                  {player.experience.toLocaleString("pt-BR")} XP · {player.daily_streak} dias de
                  sequência
                </p>
              </div>
              <b>Nível {player.level}</b>
            </Link>
          ))
        ) : (
          <div className="portal-empty">
            <span>♜</span>
            <h2>O primeiro lugar pode ser seu</h2>
            <p>Os aventureiros aparecerão aqui assim que começarem a progredir.</p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
