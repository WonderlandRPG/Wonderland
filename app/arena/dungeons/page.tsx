import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { isAdministrativeRole } from "@/lib/auth/roles";
import { firstDungeon } from "@/lib/game/dungeons";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DungeonLobby } from "@/components/arena/dungeon-lobby";
import type { DungeonQueueEntry } from "./actions";

export const metadata = { title: "Dungeons | Arena" };
export const dynamic = "force-dynamic";

export default async function DungeonPage() {
  const { account, characterId } = await requireActiveCharacter("/arena/dungeons");
  if (!isAdministrativeRole(account.role)) redirect("/arena");
  const client = await createServerSupabaseClient();
  const { data: queueResult } = client
    ? await client.rpc("v2_get_dungeon_queue", { p_dungeon_key: firstDungeon.key })
    : { data: [] };
  const initialQueue = Array.isArray(queueResult) ? (queueResult as DungeonQueueEntry[]) : [];

  return (
    <main className="dungeon-page">
      <PlayerNav />
      <div className="page-container dungeon-shell">
        <Link className="arena-mode-back" href="/arena">
          ← Voltar aos modos
        </Link>
        <header className="dungeon-hero">
          <div>
            <span className="eyebrow">Expedição cooperativa · acesso ADM</span>
            <h1>{firstDungeon.name}</h1>
            <p>{firstDungeon.description}</p>
          </div>
          <aside>
            <b>RANK {firstDungeon.rank}</b>
            <span>{firstDungeon.recommendedLevel}</span>
            <small>Nível recomendado</small>
          </aside>
        </header>
        <DungeonLobby
          dungeonKey={firstDungeon.key}
          characterId={characterId}
          userId={account.id}
          minimumPlayers={firstDungeon.minimumPlayers}
          initialQueue={initialQueue}
        />
        <section className="dungeon-bestiary">
          <header>
            <span className="eyebrow">Bestiário da expedição</span>
            <h2>Ameaças das ruínas</h2>
          </header>
          <div>
            {firstDungeon.encounters.map((monster) => (
              <article key={monster.key}>
                <div
                  aria-label={`Retrato de ${monster.name}`}
                  className="dungeon-bestiary__portrait"
                  role="img"
                  style={{
                    backgroundImage: `url(${monster.imageUrl})`,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "contain",
                  }}
                />
                <small>{monster.role}</small>
                <strong>{monster.name}</strong>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
