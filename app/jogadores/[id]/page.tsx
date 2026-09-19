import { notFound } from "next/navigation";
import Link from "next/link";

import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { ItemArtwork } from "@/components/items/item-artwork";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { getCharacterSheet } from "@/lib/content/characters";
import { itemSlotLabel } from "@/lib/game/equipment";
import { kingdomName } from "@/lib/game/kingdoms";
import { getAdventureRank } from "@/lib/game/ranks";
import { reworkAttributeKeys } from "@/lib/game/rework-attributes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  const rank = getAdventureRank(sheet.adventure_rank);
  const strongestAttribute = reworkAttributeKeys.reduce((strongest, key) =>
    sheet.reworkStats.attributes[key] > sheet.reworkStats.attributes[strongest] ? key : strongest,
  );
  const labels = { FOR: "Força", INT: "Inteligência", DEF: "Defesa", RES: "Resistência", HP: "Vida", INI: "Iniciativa" } as const;

  return (
    <main className="public-character-page">
      <PlayerNav />
      <div className="page-container public-character-shell">
        <Link className="public-character-back" href="/ranking">← Voltar aos rankings</Link>
        <section
          className="public-character-hero public-character-dossier"
          data-rank={sheet.adventure_rank}
          style={{ "--public-rank": rank.color } as React.CSSProperties}
        >
          <div className="public-character-hero__portrait official-character-card-host">
            <CharacterPortraitCard
              imageUrl={sheet.image_url}
              level={sheet.level}
              name={sheet.name}
              rank={sheet.adventure_rank}
              title={equippedTitle}
              cosmetics={sheet.cosmetics}
              variant="hero"
            />
          </div>
          <div className="public-character-hero__copy">
            <div className="public-character-dossier__overline">
              <span className="eyebrow">Registro oficial da Guilda</span>
              <span className="public-character-dossier__status">● Aventureiro verificado</span>
            </div>
            <h1>{sheet.name}</h1>
            <p className="public-character-dossier__calling">
              <strong>{sheet.race.name}</strong>
              <span aria-hidden="true">◆</span>
              <strong>{sheet.characterClass.name}</strong>
              <span aria-hidden="true">◆</span>
              <span>{path?.name ?? "Caminho ainda não escolhido"}</span>
            </p>
            <dl className="public-character-dossier__facts">
              <div className="is-rank"><dt>Rank atual</dt><dd>{sheet.adventure_rank}</dd><small>{rank.title}</small></div>
              <div><dt>Nível</dt><dd>{sheet.level}</dd><small>Experiência de jornada</small></div>
              <div><dt>Reino</dt><dd>{kingdomName(sheet.kingdom)}</dd></div>
              <div><dt>Caminho</dt><dd>{path?.name ?? "Ainda não escolhido"}</dd></div>
            </dl>
            <div className="public-character-readiness" aria-label="Prontidão pública para combate">
              <article><small>Vitalidade</small><strong>{sheet.stats.maxHp}</strong><span>HP máximo</span></article>
              <article><small>Defesa</small><strong>{sheet.stats.attributes.DEF}</strong><span>Proteção física</span></article>
              <article><small>Iniciativa</small><strong>{sheet.stats.initiative}</strong><span>Prioridade de turno</span></article>
              <article><small>Poder Total</small><strong>{sheet.reworkStats.powerTotal}</strong><span>Soma dos atributos finais</span></article>
            </div>
            <footer className="public-character-dossier__owner">
              <span>Registrado por <strong>{profile?.display_name || "Aventureiro"}</strong></span>
              <span>Membro desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "—"}</span>
            </footer>
          </div>
        </section>
        <section className="public-character-summary">
          <header className="public-character-section-heading">
            <div><span className="eyebrow">Leitura de build</span><h2>Atributos finais</h2></div>
            <p>Maior afinidade: <strong>{labels[strongestAttribute]}</strong> · {sheet.reworkStats.attributes[strongestAttribute]} pontos</p>
          </header>
          <div className="public-character-stats">
            {reworkAttributeKeys.map((key) => (
              <article data-highlight={key === strongestAttribute ? "true" : undefined} key={key}>
                <small>{labels[key]}</small><strong>{sheet.reworkStats.attributes[key]}</strong>
                <span>{key === strongestAttribute ? "Afinidade principal" : key}</span>
              </article>
            ))}
          </div>
          <div className="public-character-power-grid">
            <article><small>Poder Total</small><strong>{sheet.reworkStats.powerTotal}</strong><span>FOR + INT + DEF + RES + HP + INI</span></article>
          </div>
        </section>
        <section className="public-character-equipment">
          <header>
            <div><span className="eyebrow">Arsenal inspecionado</span><h2>Conjunto utilizado</h2><p>Itens, bônus e efeitos que compõem esta build.</p></div>
            <span className="public-character-equipment__count"><strong>{equipped.length}</strong> itens equipados</span>
          </header>
          <div>
            {equipped.map((item) => (
              <article data-rarity={item.rarity} key={`${item.id}-${item.equippedSlot}`}>
                <ItemArtwork name={item.name} rarity={item.rarity} slot={item.slot} />
                <span>
                  <small>{itemSlotLabel(item.equippedSlot ?? item.slot)} · {item.rarity}</small>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </span>
                <dl>
                  {Object.entries(item.attributes).map(([key, value]) => (
                    <div key={key}><dt>{key}</dt><dd>+{value}</dd></div>
                  ))}
                </dl>
                {item.specialEffects.map((effect) => (
                  <aside key={effect.key}><small>Efeito</small><b>{effect.name}</b><p>{effect.description}</p></aside>
                ))}
              </article>
            ))}
            {!equipped.length ? <p className="public-character-empty">Este personagem ainda não equipou itens.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
