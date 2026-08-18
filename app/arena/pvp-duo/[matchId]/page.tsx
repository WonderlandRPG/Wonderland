import { notFound } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { PvpDuoBattle } from "@/components/arena/pvp-duo-battle";
import { CombatExitGuard } from "@/components/arena/combat-exit-guard";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getPvpTeamRoster } from "@/lib/content/pvp-team-roster";
import { createInitialPvpDuoState } from "@/lib/game/pvp-duo-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "PvP 2x2 — Wonderland" };

export default async function PvpDuoPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  await requireCurrentAccount(`/arena/pvp-duo/${matchId}`);
  const [roster, client] = await Promise.all([getPvpTeamRoster(matchId), createServerSupabaseClient()]);
  if (!roster || roster.format !== "duo" || !client) notFound();

  const teamOne = roster.members.filter((member) => member.team === 1).sort((a, b) => a.slot - b.slot);
  const teamTwo = roster.members.filter((member) => member.team === 2).sort((a, b) => a.slot - b.slot);
  if (teamOne.length !== 2 || teamTwo.length !== 2) notFound();

  const initialState = createInitialPvpDuoState(
    teamOne.map((member) => member.character),
    teamTwo.map((member) => member.character),
  );
  await client.rpc("v2_initialize_pvp_match", {
    p_match_id: matchId,
    p_state: initialState as unknown as Json,
  });
  const { data } = await client.rpc("v2_get_pvp_match_state", { p_match_id: matchId });
  if (!data || Array.isArray(data) || typeof data !== "object") notFound();

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner">
        <CombatExitGuard kind="pvp" combatId={matchId} />
        <PvpDuoBattle
          matchId={matchId}
          initialRoom={data as never}
          members={roster.members}
          ownTeam={roster.ownTeam}
        />
      </div>
    </main>
  );
}
