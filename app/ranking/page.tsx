import { PortalShell } from "@/components/portal-shell";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { getPvpRanking, getRanking } from "@/lib/game/player-portal";
import { RankingHall } from "@/components/ranking/ranking-hall";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const { characterId } = await requireActiveCharacter("/ranking");
  const [ranking, pvpRanking] = await Promise.all([getRanking(), getPvpRanking()]);
  const levels = new Map(ranking.map((entry) => [entry.id, entry.level]));
  const enrichedPvpRanking = pvpRanking.map((entry) => ({
    ...entry,
    level: levels.get(entry.id) ?? 1,
  }));

  return (
    <PortalShell
      eyebrow="Salão competitivo"
      title="Salão dos Campeões"
      description="Sua posição, os líderes da temporada e os rivais da Arena em um único painel."
    >
      <RankingHall currentCharacterId={characterId} levelEntries={ranking} pvpEntries={enrichedPvpRanking} />
    </PortalShell>
  );
}
