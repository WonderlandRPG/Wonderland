import { PortalShell } from "@/components/portal-shell";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { getRanking } from "@/lib/game/player-portal";
import { PlayerRanking } from "@/components/ranking/player-ranking";
export const dynamic = "force-dynamic";
export default async function RankingPage() {
  await requireActiveCharacter("/ranking");
  const ranking = await getRanking();
  return (
    <PortalShell
      eyebrow="Classificação por nível"
      title="Ranking de jogadores"
      description="Os aventureiros que estão escrevendo seus nomes no topo da história de Wonderland."
    >
      <PlayerRanking entries={ranking} />
    </PortalShell>
  );
}
