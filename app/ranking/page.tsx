import { PortalShell } from "@/components/portal-shell";
import { getRanking } from "@/lib/game/player-portal";
export const dynamic = "force-dynamic";
export default async function RankingPage() {
  const ranking = await getRanking();
  return (
    <PortalShell
      eyebrow="Classificação por nível"
      title="Ranking de personagens"
      description="Personagens ordenados exclusivamente por nível; a experiência desempata posições iguais."
    >
      <div className="ranking-list">
        {ranking.length ? (
          ranking.map((character) => (
            <article key={character.id}>
              <strong>#{character.rank}</strong>
              <span className="portal-avatar">{character.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <h2>{character.name}</h2>
                <p>
                  {character.race_name} · {character.class_name}
                </p>
              </div>
              <b>Nível {character.level}</b>
            </article>
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
