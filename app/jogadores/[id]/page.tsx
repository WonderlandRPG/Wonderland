import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { achievements } from "@/lib/game/player-portal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await createServerSupabaseClient();
  if (!client) notFound();
  const [{ data: profile }, { data: characters }, { data: unlocked }] = await Promise.all([
    client
      .from("v2_profiles")
      .select("display_name,avatar_url,created_at")
      .eq("user_id", id)
      .maybeSingle(),
    client.rpc("v2_character_ranking", {}),
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
      <h2 className="portal-subtitle">Personagens</h2>
      <div className="ranking-list">
        {(characters ?? [])
          .filter((character) => character.user_id === id)
          .map((character) => (
            <article key={character.id}>
              <span className="portal-avatar">{character.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <h2>{character.name}</h2>
                <p>
                  {character.race_name} · {character.class_name}
                </p>
              </div>
              <b>Nível {character.level}</b>
            </article>
          ))}
      </div>
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
