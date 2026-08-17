import Link from "next/link";

import { deleteLoreStoryAction, saveLoreStoryAction } from "@/app/admin/historias/actions";
import { LoreRichEditor } from "@/components/admin/lore-rich-editor";
import { PlayerNav } from "@/components/player-nav";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";
import { parseLoreStoryPayload } from "@/lib/game/lore-stories";
import { officialHistoryEras } from "@/lib/game/wonderland-history";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import styles from "./history.module.css";

export const metadata = { title: "História de Wonderland" };
export const dynamic = "force-dynamic";

type StoryRow = {
  id: string;
  slug: string;
  name: string;
  payload: unknown;
  published_at: string | null;
};

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [account, client, query] = await Promise.all([
    getCurrentAccount(),
    createServerSupabaseClient(),
    searchParams,
  ]);
  const { data } = client
    ? await client
        .from("v2_content")
        .select("id, slug, name, payload, published_at")
        .eq("content_type", "lore_story")
        .eq("status", "published")
        .order("published_at", { ascending: false })
    : { data: [] };
  const stories = (data ?? []) as StoryRow[];
  const canWrite = Boolean(account && isAdministrativeRole(account.role));

  return (
    <main className={`${styles.page} lore-page`}>
      <PlayerNav />
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <small>BIBLIOTECA REAL · CRÔNICAS DE WONDERLAND</small>
            <h1>A História de Wonderland</h1>
            <p>Aqui ficam preservados o nascimento do mundo, a origem da magia e os acontecimentos que formam o cânone oficial do RPG. Abaixo das eras, a Biblioteca Real recebe novos contos e histórias publicados pelos escribas da administração.</p>
          </div>
          <div className={styles.heroMark} aria-hidden="true">W</div>
        </header>

        <nav className={styles.eraNav} aria-label="Eras da história oficial">
          {officialHistoryEras.map((era) => <a href={`#era-${era.id}`} key={era.id}>Era {era.number} · {era.title}</a>)}
          <a href="#biblioteca">Contos da Biblioteca</a>
        </nav>

        {officialHistoryEras.map((era) => (
          <section className={styles.era} id={`era-${era.id}`} key={era.id}>
            <aside className={styles.eraIndex}>
              <span>{era.number}</span>
              <small>ERA OFICIAL</small>
              <h2>{era.title}</h2>
              <p>{era.subtitle}</p>
              <nav aria-label={`Capítulos de ${era.title}`}>
                {era.chapters.map((chapter, index) => <a href={`#${chapter.id}`} key={chapter.id}>{String(index + 1).padStart(2, "0")} · {chapter.title}</a>)}
              </nav>
            </aside>
            <article className={styles.scroll}>
              {era.chapters.map((chapter, index) => (
                <section className={styles.chapter} id={chapter.id} key={chapter.id}>
                  <header><span>{String(index + 1).padStart(2, "0")}</span><h3>{chapter.title}</h3></header>
                  {chapter.paragraphs.map((paragraph, paragraphIndex) => <p key={`${chapter.id}-${paragraphIndex}`}>{paragraph}</p>)}
                </section>
              ))}
            </article>
          </section>
        ))}

        <section className={styles.library} id="biblioteca">
          <header className={styles.libraryHeader}>
            <div><small>NOVAS OBRAS · ACERVO VIVO</small><h2>Contos da Biblioteca</h2></div>
            <p>Histórias posteriores ao registro original ficam guardadas como livros. Abra uma capa para ler a obra completa.</p>
          </header>

          {query.status ? (
            <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`} style={{ marginBottom: 16 }}>
              {query.status === "apagado"
                ? "✓ História apagada da Biblioteca."
                : query.status === "salvo"
                  ? "✓ História publicada na Biblioteca."
                  : "! Não foi possível concluir a operação."}
            </div>
          ) : null}

          <div className={styles.bookGrid}>
            {stories.length ? stories.map((story, index) => {
              const payload = parseLoreStoryPayload(story.payload as never);
              return (
                <div key={story.id} style={{ display: "grid", gap: 8, minWidth: 0 }}>
                  <Link className={styles.book} data-tone={payload.coverTone} href={`/historia/${story.slug}`}>
                    <div>
                      <span className={styles.bookNumber}>Tomo {String(stories.length - index).padStart(2, "0")}</span>
                      <h3>{story.name}</h3>
                      <p>{payload.excerpt}</p>
                    </div>
                    <footer><span>{payload.authorName}</span><small>{new Date(`${payload.publishedOn}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</small></footer>
                  </Link>
                  {canWrite ? (
                    <form action={deleteLoreStoryAction} style={{ display: "flex", justifyContent: "flex-end" }}>
                      <input name="id" type="hidden" value={story.id} />
                      <input name="returnTo" type="hidden" value="/historia" />
                      <button className="button button--danger" style={{ minHeight: 34, padding: "7px 11px" }}>
                        Apagar história
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            }) : <div className={styles.emptyShelf}><strong>A estante de novos contos ainda está vazia.</strong><p>Quando um ADM publicar uma nova história, ela aparecerá aqui como um livro.</p></div>}
          </div>
        </section>

        {canWrite ? (
          <details className={styles.adminWrite}>
            <summary><span>✒ Mesa do escriba</span><b>Publicar um conto sem sair da História</b></summary>
            <div className={styles.adminWriteBody}>
              <form action={saveLoreStoryAction} className={styles.adminForm}>
                <input name="returnTo" type="hidden" value="/historia" />
                <div className={styles.adminFormGrid}>
                  <label><span>Título</span><input name="title" required /></label>
                  <label><span>Autor</span><input name="authorName" defaultValue={account?.displayName} /></label>
                  <label><span>Data</span><input name="publishedOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
                </div>
                <div className={styles.adminFormGrid}>
                  <label><span>Resumo</span><textarea name="excerpt" maxLength={320} /></label>
                  <label><span>Capa</span><select name="coverTone" defaultValue="forest"><option value="forest">Verde da Guilda</option><option value="wine">Vinho Real</option><option value="midnight">Azul da Meia-noite</option><option value="royal">Dourado Real</option><option value="ember">Brasa Carmesim</option><option value="ocean">Azul Oceânico</option></select></label>
                  <label><span>Identificador opcional</span><input name="slug" placeholder="gerado pelo título" /></label>
                </div>
                <div className={styles.adminEditor}><LoreRichEditor /></div>
                <label><input name="published" type="checkbox" defaultChecked /> Publicar imediatamente</label>
                <button className="button button--primary">Publicar na Biblioteca</button>
              </form>
            </div>
          </details>
        ) : null}
      </div>
    </main>
  );
}
