import { PortalShell } from "@/components/portal-shell";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { kingdomName } from "@/lib/game/kingdoms";
import { getRanking } from "@/lib/game/player-portal";
import { RankBadge } from "@/components/characters/rank-badge";
export const dynamic = "force-dynamic";
export default async function RankingPage() {
  await requireActiveCharacter("/ranking");
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
              <span
                className={`portal-avatar ${character.image_url ? "is-image" : ""}`}
                style={
                  character.image_url
                    ? { backgroundImage: `url(${character.image_url})` }
                    : undefined
                }
              >
                {character.image_url ? "" : character.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h2>{character.name}</h2>
                <p>
                  {character.race_name} · {character.class_name} · {kingdomName(character.kingdom)}
                </p>
              </div>
              <b>Nível {character.level}</b>
              <RankBadge compact rank={character.adventure_rank} />
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
