import { PortalShell } from "@/components/portal-shell";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { getPvpRanking, getRanking } from "@/lib/game/player-portal";
import { RankingHall } from "@/components/ranking/ranking-hall";
export const dynamic = "force-dynamic";
export default async function RankingPage() {
  await requireActiveCharacter("/ranking");
  const [ranking, pvpRanking] = await Promise.all([getRanking(), getPvpRanking()]);
  return (
    <PortalShell
      eyebrow="Salão competitivo"
      title="Rankings de Wonderland"
      description="Compare a progressão dos aventureiros e conheça os campeões da Arena PvP."
    >
      <RankingHall levelEntries={ranking} pvpEntries={pvpRanking} />
    </PortalShell>
  );
}
