import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { achievements } from "@/lib/game/player-portal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await createServerSupabaseClient();
  if (!client) notFound();
  const [{ data: profile }, { data: progress }, { data: unlocked }] = await Promise.all([
    client
      .from("v2_profiles")
      .select("display_name,avatar_url,created_at")
      .eq("user_id", id)
      .maybeSingle(),
    client
      .from("v2_player_progress")
      .select("level,experience,daily_streak")
      .eq("user_id", id)
      .maybeSingle(),
    client.from("v2_player_achievements").select("achievement_slug,unlocked_at").eq("user_id", id),
  ]);
  if (!profile) notFound();
  const unlockedSet = new Set((unlocked ?? []).map((x) => x.achievement_slug));
  return (
    <PortalShell
      eyebrow="Perfil público"
      title={profile.display_name || "Aventureiro"}
      description={`Membro de Wonderland desde ${new Date(profile.created_at).toLocaleDateString("pt-BR")}.`}
    >
      <section className="public-profile-stats">
        <article>
          <small>Nível</small>
          <strong>{progress?.level ?? 1}</strong>
        </article>
        <article>
          <small>Experiência</small>
          <strong>{(progress?.experience ?? 0).toLocaleString("pt-BR")} XP</strong>
        </article>
        <article>
          <small>Sequência</small>
          <strong>{progress?.daily_streak ?? 0} dias</strong>
        </article>
      </section>
      <h2 className="portal-subtitle">Conquistas públicas</h2>
      <div className="portal-card-grid">
        {achievements.map((item) => (
          <article
            className={`achievement-card ${unlockedSet.has(item.slug) ? "is-unlocked" : ""}`}
            key={item.slug}
          >
            <span>{item.icon}</span>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <em>{unlockedSet.has(item.slug) ? "Conquistada" : "Ainda não conquistada"}</em>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
