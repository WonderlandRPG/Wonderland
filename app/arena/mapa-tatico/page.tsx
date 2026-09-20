import Link from "next/link";
import { redirect } from "next/navigation";

import { TacticalCombatShell } from "@/components/arena/tactical-combat-shell";
import { PlayerNav } from "@/components/player-nav";
import { isAdministrativeRole, requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheets } from "@/lib/content/characters";
import { getCreatureImageUrl, parseTextList } from "@/lib/game/bestiary";
import { parseCreatureCombatProfile } from "@/lib/game/creature-tactical-combat";
import { toTacticalArenaCharacter } from "@/lib/game/arena-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Combate Tático" };
export const dynamic = "force-dynamic";

export default async function TacticalMapLabPage() {
  const account = await requireCurrentAccount("/arena/mapa-tatico");

  if (!isAdministrativeRole(account.role)) {
    redirect("/arena");
  }

  const [sheets, client] = await Promise.all([
    getCharacterSheets(account.id),
    createServerSupabaseClient(),
  ]);

  const { data: creatureRows } = client
    ? await client.from("v2_creatures").select("*").eq("active", true).order("rank").order("name")
    : { data: [] };

  const creatures = (creatureRows ?? []).map((entry) => {
    const row = entry as typeof entry & { combat_profile?: unknown };
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      rank: row.rank,
      behavior: row.behavior,
      weaknesses: parseTextList(row.weaknesses),
      description: row.description,
      imageUrl: getCreatureImageUrl(row.slug),
      combatProfile: parseCreatureCombatProfile(row.rank, row.combat_profile),
    };
  });

  const characters = sheets.map(toTacticalArenaCharacter);

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner tactical-lab-stage">
        <Link className="arena-mode-back" href="/arena">
          ← Voltar para Arena
        </Link>
        <TacticalCombatShell characters={characters} creatures={creatures} />
      </div>
    </main>
  );
}
