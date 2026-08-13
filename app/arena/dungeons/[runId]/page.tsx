import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { DungeonBattle } from "@/components/arena/dungeon-battle";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { getCharacterSheet } from "@/lib/content/characters";
import { isAdministrativeRole } from "@/lib/auth/roles";
import { toArenaCharacter } from "@/lib/game/arena-character";
import { createInitialDungeonState } from "@/lib/game/dungeon-combat";
import { firstDungeon } from "@/lib/game/dungeons";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/db/types";
export const metadata = { title: "Combate | Ruínas de Verdantia" };
export const dynamic = "force-dynamic";
export default async function DungeonRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { account, characterId } = await requireActiveCharacter("/arena/dungeons");
  if (!isAdministrativeRole(account.role)) redirect("/arena");
  const { runId } = await params;
  const client = await createServerSupabaseClient();
  if (!client) notFound();
  const { data: run } = await client
    .from("v2_dungeon_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();
  if (
    !run ||
    run.dungeon_key !== firstDungeon.key ||
    !run.party_character_ids.includes(characterId)
  )
    notFound();
  const characters = (await Promise.all(run.party_character_ids.map((id) => getCharacterSheet(id))))
    .filter(Boolean)
    .map((entry) => toArenaCharacter(entry!));
  if (!characters.length) notFound();
  const { data: initialized, error } = await client.rpc("v2_initialize_dungeon_run", {
    p_run_id: runId,
    p_state: createInitialDungeonState(characters) as unknown as Json,
  });
  if (error || !initialized || Array.isArray(initialized) || typeof initialized !== "object")
    notFound();
  return (
    <main className="arena-page dungeon-page">
      <PlayerNav />
      <div className="page-container dungeon-shell">
        <Link className="arena-mode-back" href="/arena/dungeons">
          ← Voltar à fila
        </Link>
        <DungeonBattle
          runId={runId}
          initialRoom={initialized as never}
          characters={characters}
          ownCharacterId={characterId}
        />
      </div>
    </main>
  );
}
