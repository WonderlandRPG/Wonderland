import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { isAdministrativeRole } from "@/lib/auth/roles";
import { firstDungeon } from "@/lib/game/dungeons";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Expedição | Ruínas de Verdantia" };
export const dynamic = "force-dynamic";

export default async function DungeonRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { account } = await requireActiveCharacter("/arena/dungeons");
  if (!isAdministrativeRole(account.role)) redirect("/arena");
  const { runId } = await params;
  const client = await createServerSupabaseClient();
  if (!client) notFound();
  const { data: run } = await client.from("v2_dungeon_runs").select("*").eq("id", runId).maybeSingle();
  if (!run || run.dungeon_key !== firstDungeon.key) notFound();
  const { data: party } = await client
    .from("v2_characters")
    .select("id,name,level,adventure_rank,image_url")
    .in("id", run.party_character_ids);

  return (
    <main className="dungeon-page">
      <PlayerNav />
      <div className="page-container dungeon-shell">
        <Link className="arena-mode-back" href="/arena/dungeons">← Voltar à fila</Link>
        <header className="dungeon-hero">
          <div>
            <span className="eyebrow">Expedição em andamento · Rank {firstDungeon.rank}</span>
            <h1>{firstDungeon.name}</h1>
            <p>A entrada foi confirmada. Prepare o grupo para atravessar as ruínas e enfrentar a infestação.</p>
          </div>
          <aside><b>{run.forced_start ? "ADM" : "4/4"}</b><span>{party?.length ?? 0} no grupo</span><small>{run.forced_start ? "Início forçado" : "Grupo completo"}</small></aside>
        </header>
        <section className="dungeon-party-panel">
          <div className="dungeon-party-ring"><span>{party?.length ?? 0}</span><small>GRUPO</small></div>
          <div><span className="eyebrow">Sessão confirmada</span><h2>Expedição iniciada</h2><p>A sala foi criada às {new Date(run.started_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. O combate cooperativo desta Dungeon está em prévia administrativa.</p></div>
          <strong className="button button--primary">EM ANDAMENTO</strong>
        </section>
        <section className="dungeon-bestiary">
          <header><span className="eyebrow">Grupo da expedição</span><h2>Aventureiros reunidos</h2></header>
          <div>
            {(party ?? []).map((member) => <article key={member.id}><div aria-label={`Retrato de ${member.name}`} className="dungeon-bestiary__portrait" role="img" style={member.image_url ? { backgroundImage: `url(${member.image_url})`, backgroundPosition: "center 18%", backgroundRepeat: "no-repeat", backgroundSize: "cover" } : undefined} /><small>Nível {member.level} · Rank {member.adventure_rank}</small><strong>{member.name}</strong></article>)}
          </div>
        </section>
        <section className="dungeon-bestiary">
          <header><span className="eyebrow">Rota da expedição</span><h2>Encontros das ruínas</h2></header>
          <div>{firstDungeon.encounters.map((monster, index) => <article key={monster.key}><div aria-label={`Retrato de ${monster.name}`} className="dungeon-bestiary__portrait" role="img" style={{ backgroundImage: `url(${monster.imageUrl})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain" }} /><small>Encontro {index + 1} · {monster.role}</small><strong>{monster.name}</strong></article>)}</div>
        </section>
      </div>
    </main>
  );
}
