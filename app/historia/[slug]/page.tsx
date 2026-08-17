import Link from "next/link";
import { notFound } from "next/navigation";

import { PlayerNav } from "@/components/player-nav";
import { parseLoreStoryPayload } from "@/lib/game/lore-stories";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import styles from "../history.module.css";

export const dynamic = "force-dynamic";

export default async function LoreStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await createServerSupabaseClient();
  if (!client) notFound();
  const { data } = await client
    .from("v2_content")
    .select("id, slug, name, payload")
    .eq("content_type", "lore_story")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();
  const payload = parseLoreStoryPayload(data.payload);

  return (
    <main className={`${styles.storyPage} lore-page`}>
      <PlayerNav />
      <div className={styles.shell}>
        <Link className={styles.back} href="/historia#biblioteca">← Voltar para a Biblioteca</Link>
        <header className={styles.storyHero}>
          <div
            className={styles.miniBook}
            data-tone={payload.coverTone}
            style={payload.coverImageUrl ? {
              backgroundImage: `linear-gradient(rgba(28,23,18,.28),rgba(28,23,18,.62)),url(${payload.coverImageUrl})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            } : undefined}
          >
            {data.name}
          </div>
          <div>
            <small>BIBLIOTECA REAL · CONTO DE WONDERLAND</small>
            <h1>{data.name}</h1>
            <p>{payload.excerpt}</p>
            <div className={styles.storyMeta}>
              <span>✒ {payload.authorName}</span>
              <span>{new Date(`${payload.publishedOn}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</span>
            </div>
          </div>
        </header>
        <article className={styles.storyPaper} dangerouslySetInnerHTML={{ __html: payload.bodyHtml }} />
      </div>
    </main>
  );
}
