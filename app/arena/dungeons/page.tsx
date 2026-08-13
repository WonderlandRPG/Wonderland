import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { isAdministrativeRole } from "@/lib/auth/roles";
import { firstDungeon } from "@/lib/game/dungeons";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Dungeons | Arena" };
export const dynamic = "force-dynamic";

export default async function DungeonPage() {
  const { account } = await requireActiveCharacter("/arena/dungeons");
  if (!isAdministrativeRole(account.role)) redirect("/arena");
  const client = await createServerSupabaseClient();
  const { data: onlineCountResult } = client
    ? await client.rpc("v2_get_online_player_count")
    : { data: 0 };
  const onlineCount = Number(onlineCountResult ?? 0);
  const ready = onlineCount >= firstDungeon.minimumPlayers;

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
        <section className="dungeon-party-panel">
          <div className="dungeon-party-ring">
            <span>{onlineCount}</span>
            <small>ONLINE</small>
          </div>
          <div>
            <span className="eyebrow">Formação do grupo</span>
            <h2>{ready ? "Expedição disponível" : "Aguardando aventureiros"}</h2>
            <p>
              São necessários pelo menos {firstDungeon.minimumPlayers} jogadores online para
              iniciar. A fila cooperativa e o combate em grupo estão em prévia administrativa.
            </p>
          </div>
          <button className="button button--primary" disabled={!ready} type="button">
            {ready ? "Formar grupo" : `${onlineCount}/${firstDungeon.minimumPlayers} jogadores`}
          </button>
        </section>
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
                  style={{ backgroundImage: `url(${monster.imageUrl})` }}
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
