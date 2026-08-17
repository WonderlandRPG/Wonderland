import { LoreRichEditor } from "@/components/admin/lore-rich-editor";
import { parseLoreStoryPayload, type LoreStoryPayload } from "@/lib/game/lore-stories";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deleteLoreStoryAction, saveLoreStoryAction } from "./actions";
import styles from "./history-admin.module.css";

export const metadata = { title: "Histórias | Painel ADM" };
export const dynamic = "force-dynamic";

type StoryRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  payload: unknown;
  published_at: string | null;
  updated_at: string;
};

export default async function AdminHistoryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const client = await createServerSupabaseClient();
  const [{ data }, query] = await Promise.all([
    client
      ? client
          .from("v2_content")
          .select("id, slug, name, status, payload, published_at, updated_at")
          .eq("content_type", "lore_story")
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    searchParams,
  ]);
  const stories = (data ?? []) as StoryRow[];

  return (
    <div className={`${styles.page} admin-content`}>
      <header className={styles.hero}>
        <div>
          <span className="eyebrow">Biblioteca Real · mesa dos escribas</span>
          <h2>Histórias e contos</h2>
          <p>Escreva, revise e publique novas crônicas de Wonderland. O editor funciona como um documento, com títulos, listas, citações, links e formatação de texto.</p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">✒</div>
      </header>

      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ História salva." : query.status === "apagado" ? "✓ História apagada." : "! Não foi possível salvar. Revise os campos."}
        </div>
      ) : null}

      <section className={styles.composer} id="novo-conto">
        <header className={styles.sectionHeader}>
          <div><small>NOVA OBRA</small><h2>Abrir um novo manuscrito</h2></div>
          <span>Publicação da biblioteca</span>
        </header>
        <StoryForm />
      </section>

      <section className={styles.archive}>
        <header className={styles.sectionHeader}>
          <div><small>ACERVO EDITORIAL</small><h2>Obras cadastradas</h2></div>
          <span>{stories.length} manuscrito(s)</span>
        </header>
        <div className={styles.archiveList}>
          {stories.length ? stories.map((story) => {
            const payload = parseLoreStoryPayload(story.payload as never);
            return (
              <details className={styles.storyCard} key={story.id}>
                <summary>
                  <span><small>{payload.publishedOn} · /historia/{story.slug}</small><strong>{story.name}</strong></span>
                  <b className={styles.status} data-published={story.status === "published"}>{story.status === "published" ? "Publicado" : "Rascunho"}</b>
                </summary>
                <div className={styles.storyBody}>
                  <StoryForm story={{ id: story.id, slug: story.slug, title: story.name, status: story.status, payload }} />
                  <form action={deleteLoreStoryAction} className={styles.dangerRow}>
                    <input name="id" type="hidden" value={story.id} />
                    <button className="button button--danger">Apagar história</button>
                  </form>
                </div>
              </details>
            );
          }) : <p>Nenhum conto novo foi cadastrado ainda.</p>}
        </div>
      </section>
    </div>
  );
}

function StoryForm({ story }: { story?: { id: string; slug: string; title: string; status: string; payload: LoreStoryPayload } }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={saveLoreStoryAction} className={styles.form}>
      <input name="id" type="hidden" value={story?.id ?? ""} />
      <div className={styles.grid}>
        <label><span>Título da história</span><input name="title" defaultValue={story?.title} placeholder="O canto das ruínas de Namida" required /></label>
        <label><span>Identificador</span><input name="slug" defaultValue={story?.slug} placeholder="gerado pelo título" /></label>
        <label><span>Data da publicação</span><input name="publishedOn" type="date" defaultValue={story?.payload.publishedOn ?? today} required /></label>
      </div>
      <div className={styles.gridTwo}>
        <label><span>Autor / assinatura</span><input name="authorName" defaultValue={story?.payload.authorName} placeholder="Arquivo Real" /></label>
        <label><span>Capa do livro</span><select name="coverTone" defaultValue={story?.payload.coverTone ?? "forest"}><option value="forest">Verde da Guilda</option><option value="wine">Vinho Real</option><option value="midnight">Azul da Meia-noite</option><option value="royal">Dourado Real</option><option value="ember">Brasa Carmesim</option><option value="ocean">Azul Oceânico</option></select></label>
      </div>
      <label><span>Resumo da capa</span><textarea name="excerpt" defaultValue={story?.payload.excerpt} placeholder="Uma breve apresentação para a estante da biblioteca." maxLength={320} /></label>
      <div className={styles.editorShell}><LoreRichEditor initial={story?.payload.bodyHtml ?? ""} /></div>
      <div className={styles.publishRow}>
        <label><input name="published" type="checkbox" defaultChecked={story?.status === "published" || !story} /> Publicar para os jogadores</label>
        <button className="button button--primary">{story ? "Salvar manuscrito" : "Publicar história"}</button>
      </div>
    </form>
  );
}
