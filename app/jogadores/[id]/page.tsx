import { notFound } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCharacterSheet } from "@/lib/content/characters";
import { EquippedTitle } from "@/components/characters/equipped-title";
import { RankBadge } from "@/components/characters/rank-badge";
import { ItemGlyph } from "@/components/items/item-glyph";
import { kingdomName } from "@/lib/game/kingdoms";
import { attributeLabels } from "@/lib/game/races";
import { attributeKeys } from "@/lib/game/schemas";
import { itemSlotLabel } from "@/lib/game/equipment";

export const dynamic = "force-dynamic";

export default async function PublicCharacterProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireActiveCharacter(`/jogadores/${id}`);
  const client = await createServerSupabaseClient();
  if (!client) notFound();
  const { data: ranking } = await client.rpc("v2_character_ranking", {});
  const selected = (ranking ?? []).find((entry) => entry.id === id);
  if (!selected) notFound();
  const [{ data: profile }, sheet] = await Promise.all([
    client
      .from("v2_profiles")
      .select("display_name,created_at")
      .eq("user_id", selected.user_id)
      .maybeSingle(),
    getCharacterSheet(selected.id),
  ]);
  if (!sheet) notFound();
  const equipped = sheet.inventory.filter(
    (item) => item.equippedSlot && item.equippedSlot !== "title",
  );
  const equippedTitle = sheet.inventory.find((item) => item.equippedSlot === "title") ?? null;
  const path = sheet.characterClass.payload.paths?.find(
    (entry) => entry.key === sheet.class_path_key,
  );

  return (
    <main className="public-character-page">
      <PlayerNav />
      <div className="page-container public-character-shell">
        <section className="public-character-hero" data-rank={sheet.adventure_rank}>
          <div
            className={`public-character-hero__portrait ${sheet.image_url ? "is-image" : ""}`}
            style={sheet.image_url ? { backgroundImage: `url(${sheet.image_url})` } : undefined}
          >
            {sheet.image_url ? null : sheet.name.slice(0, 2).toUpperCase()}
            <RankBadge rank={sheet.adventure_rank} />
          </div>
          <div className="public-character-hero__copy">
            <span className="eyebrow">Ficha pública de aventureiro</span>
            <h1>{sheet.name}</h1>
            <EquippedTitle title={equippedTitle} />
            <p>
              {sheet.race.name} · {sheet.characterClass.name}
            </p>
            <dl>
              <div>
                <dt>Nível</dt>
                <dd>{sheet.level}</dd>
              </div>
              <div>
                <dt>Rank</dt>
                <dd>{sheet.adventure_rank}</dd>
              </div>
              <div>
                <dt>Reino</dt>
                <dd>{kingdomName(sheet.kingdom)}</dd>
              </div>
              <div>
                <dt>Caminho</dt>
                <dd>{path?.name ?? "Ainda não escolhido"}</dd>
              </div>
            </dl>
            <small>
              Personagem de {profile?.display_name || "Aventureiro"} · membro desde{" "}
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "—"}
            </small>
          </div>
        </section>
        <section className="public-character-summary">
          <header>
            <span className="eyebrow">Resumo de combate</span>
            <h2>Atributos finais</h2>
          </header>
          <div className="public-character-stats">
            <article>
              <small>HP máximo</small>
              <strong>{sheet.stats.maxHp}</strong>
            </article>
            {attributeKeys.map((key) => (
              <article key={key}>
                <small>{attributeLabels[key]}</small>
                <strong>{sheet.stats.attributes[key]}</strong>
              </article>
            ))}
          </div>
        </section>
        <section className="public-character-equipment">
          <header>
            <div>
              <span className="eyebrow">Equipamento público</span>
              <h2>Conjunto utilizado</h2>
            </div>
            <small>{equipped.length} itens equipados</small>
          </header>
          <div>
            {equipped.map((item) => (
              <article data-rarity={item.rarity} key={`${item.id}-${item.equippedSlot}`}>
                <ItemGlyph slot={item.slot} />
                <span>
                  <small>
                    {itemSlotLabel(item.equippedSlot ?? item.slot)} · {item.rarity}
                  </small>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </span>
                <dl>
                  {Object.entries(item.attributes).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>+{value}</dd>
                    </div>
                  ))}
                </dl>
                {item.specialEffects.map((effect) => (
                  <aside key={effect.key}>
                    <small>Efeito</small>
                    <b>{effect.name}</b>
                    <p>{effect.description}</p>
                  </aside>
                ))}
              </article>
            ))}
            {!equipped.length ? (
              <p className="public-character-empty">Este personagem ainda não equipou itens.</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
