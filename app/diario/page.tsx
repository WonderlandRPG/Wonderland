import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createDiaryEntryAction, deleteDiaryEntryAction } from "./actions";
import styles from "./journey.module.css";

export const metadata = { title: "Diário do personagem" };
export const dynamic = "force-dynamic";

const labels: Record<string, string> = { scene: "Cena", relationship: "Relação", journey: "Jornada" };

export default async function DiaryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ characterId }, query] = await Promise.all([requireActiveCharacter("/diario"), searchParams]);
  const client = await createServerSupabaseClient();
  const { data: character } = client ? await client.from("v2_characters").select("name").eq("id", characterId).single() : { data: null };
  const { data: entries } = client ? await client.from("v2_character_diary").select("*").eq("character_id", characterId).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }) : { data: [] };
  return <main className={styles.page}><PlayerNav/><div className={styles.shell}>
    <header className={styles.hero}><div><small>Memórias de {character?.name}</small><h1>Diário de jornada</h1><p>Registre cenas do WhatsApp, relações importantes e os marcos da sua história.</p></div><span>{entries?.length ?? 0} registros</span></header>
    {query.status ? <p className={styles.notice} role="status">{query.status === "criado" ? "Memória registrada." : query.status === "removido" ? "Registro removido." : "Não foi possível salvar o registro."}</p> : null}
    <section className={styles.layout}><form action={createDiaryEntryAction} className={styles.form} data-wl-surface="raised">
      <h2>Nova memória</h2><label>Título<input data-wl-field name="title" maxLength={100} required/></label>
      <div className={styles.row}><label>Tipo<select data-wl-field name="category"><option value="scene">Cena</option><option value="relationship">Relação</option><option value="journey">Jornada</option></select></label><label>Data<input data-wl-field name="occurredOn" type="date" defaultValue={new Date().toISOString().slice(0,10)} required/></label></div>
      <label>Relato<textarea data-wl-field name="body" maxLength={4000} rows={8} required placeholder="O que aconteceu, quem estava presente e como isso mudou sua jornada?"/></label>
      <button className="button button--primary" type="submit">Registrar no diário</button>
    </form><div className={styles.timeline}>{entries?.map((entry) => <article className={styles.entry} data-wl-component="card" key={entry.id}><header><span>{labels[entry.category] ?? entry.category}</span><time>{new Date(entry.occurred_on + "T12:00:00").toLocaleDateString("pt-BR")}</time></header><h2>{entry.title}</h2><p>{entry.body}</p><form action={deleteDiaryEntryAction}><input type="hidden" name="entryId" value={entry.id}/><button type="submit">Remover</button></form></article>)}{!entries?.length ? <div className={styles.empty}><h2>Seu diário começa agora</h2><p>O primeiro registro pode ser a chegada do personagem a Wonderland.</p></div> : null}</div></section>
  </div></main>;
}
