import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCharacterSheet } from "@/lib/content/characters";
import { EquippedTitle } from "@/components/characters/equipped-title";
export const dynamic = "force-dynamic";
export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireActiveCharacter(`/jogadores/${id}`);
  const client = await createServerSupabaseClient();
  if (!client) notFound();
  const [{ data: profile }, { data: characters }] = await Promise.all([
    client
      .from("v2_profiles")
      .select("display_name,avatar_url,created_at")
      .eq("user_id", id)
      .maybeSingle(),
    client.rpc("v2_character_ranking", {}),
  ]);
  if (!profile) notFound();
  const publicCharacters = (characters ?? []).filter((character) => character.user_id === id);
  const sheets = await Promise.all(publicCharacters.map((character) => getCharacterSheet(character.id)));
  const sheetsById = new Map(sheets.filter(Boolean).map((sheet) => [sheet!.id, sheet!]));
  return (
    <PortalShell
      eyebrow="Perfil público"
      title={profile.display_name || "Aventureiro"}
      description={`Membro de Wonderland desde ${new Date(profile.created_at).toLocaleDateString("pt-BR")}.`}
    >
      <h2 className="portal-subtitle">Personagens</h2>
      <div className="ranking-list">
        {publicCharacters.map((character) => {
            const equippedTitle = sheetsById.get(character.id)?.inventory.find((item) => item.equippedSlot === "title") ?? null;
            return (
            <article key={character.id}>
              <span className="public-profile-portrait">
                <span
                  className={`portal-avatar ${character.image_url ? "is-image" : ""}`}
                  style={character.image_url ? { backgroundImage: `url(${character.image_url})` } : undefined}
                >
                  {character.image_url ? "" : character.name.slice(0, 2).toUpperCase()}
                </span>
                <EquippedTitle title={equippedTitle} />
              </span>
              <div>
                <h2>{character.name}</h2>
                <p>
                  {character.race_name} · {character.class_name}
                </p>
              </div>
              <b>Nível {character.level}</b>
            </article>
          );})}
      </div>
    </PortalShell>
  );
}
