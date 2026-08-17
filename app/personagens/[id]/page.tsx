import Link from "next/link";

import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { getLevelProgress } from "@/lib/game/experience";
import { attributeLabels } from "@/lib/game/races";
import { attributeKeys } from "@/lib/game/schemas";
import { kingdomName } from "@/lib/game/kingdoms";
import { InventoryWorkbench } from "@/components/inventory/inventory-workbench";
import { getAdventureRank } from "@/lib/game/ranks";
import { defaultCombatRules, getConvertedResourceBonus } from "@/lib/game/combat";
import { getStructuredRaceAbilities } from "@/lib/game/races";
import { compatibleEquipSlots, equipmentSlots, itemSlotLabel } from "@/lib/game/equipment";
import { updateCharacterImageAction } from "./equipment-actions";
import { completePathQuestAction } from "./path-actions";

export const metadata = { title: "Ficha do Personagem" };
export const dynamic = "force-dynamic";

export default async function CharacterSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; tab?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireActiveCharacter(`/personagens/${id}`);
  const character = await requireCharacterSheet(id);
  const progress = getLevelProgress(character.xp);
  const tab = ["resumo", "habilidades", "equipamentos"].includes(query.tab ?? "")
    ? query.tab!
    : "resumo";
  const futureClassSkills = character.characterClass.payload.progression
    .filter((skill) => skill.level > character.level)
    .sort((a, b) => a.level - b.level);
  const futureRaceSkills = getStructuredRaceAbilities(character.race.payload)
    .filter((skill) => skill.level > character.level)
    .sort((a, b) => a.level - b.level);
  const equippedItems = new Map(
    character.inventory
      .filter((item) => item.equippedSlot)
      .map((item) => [item.equippedSlot, item]),
  );
  const twoHandedWeapon = equippedItems.get("main_weapon")?.twoHanded
    ? equippedItems.get("main_weapon")
    : equippedItems.get("off_weapon")?.twoHanded
      ? equippedItems.get("off_weapon")
      : null;
  if (twoHandedWeapon) {
    equippedItems.set("main_weapon", twoHandedWeapon);
    equippedItems.set("off_weapon", twoHandedWeapon);
  }
  const rank = getAdventureRank(character.adventure_rank);
  const equippedTitle = character.inventory.find((item) => item.equippedSlot === "title") ?? null;
  const classPath = character.characterClass.payload.paths?.find(
    (path) => path.key === character.class_path_key,
  );
  const unlockedPathSkills = (classPath?.skills ?? []).filter(
    (skill) => skill.level <= character.level,
  );
  const futurePathSkills = (classPath?.skills ?? []).filter(
    (skill) => skill.level > character.level,
  );
  const classResourceBonus = getConvertedResourceBonus(
    character.stats.attributes.INT,
    character.characterClass.payload.resource.maximum,
  );
  const raceResourceBonus = getConvertedResourceBonus(
    character.stats.attributes.INT,
    character.race.payload.resource?.maximum ?? 0,
  );

  return (
    <main className="sheet-page">
      <PlayerNav />
      <div className="page-container sheet-page__inner">
        {query.status === "criado" ? (
          <div className="account-notice" data-sfx-on-mount="confirm" role="status">
            <span>✓</span>Personagem criado! A ficha já está salva no seu perfil.
          </div>
        ) : null}
        {query.status === "caminho-escolhido" ? (
          <div className="account-notice" role="status">
            <span>✓</span>Missão concluída. O caminho e a habilidade de nível 50 foram desbloqueados.
          </div>
        ) : null}
        {query.status === "caminho-erro" || query.status === "caminho-bloqueado" ? (
          <div className="account-notice is-warning" role="alert">
            <span>!</span>Não foi possível concluir a escolha do caminho. Confirme o nível e tente novamente.
          </div>
        ) : null}

        <section
          className="character-command-hero"
          style={{ "--character-rank": rank.color } as React.CSSProperties}
          data-character-rank={rank.key}
        >
          <div className="character-command-hero__art official-character-card-host">
            <CharacterPortraitCard
              imageUrl={character.image_url}
              level={character.level}
              name={character.name}
              rank={character.adventure_rank}
              title={equippedTitle}
              variant="hero"
            />
          </div>
          <div className="character-command-hero__identity">
            <span className="eyebrow">Personagem online · {kingdomName(character.kingdom)}</span>
            <h1>{character.name}</h1>
            <p>{character.race.name} · {character.characterClass.name}</p>
            <dl className="character-command-hero__facts">
              <div><dt>Rank</dt><dd>{rank.key}</dd></div>
              <div><dt>Nível</dt><dd>{character.level}</dd></div>
              <div><dt>Reino</dt><dd>{kingdomName(character.kingdom)}</dd></div>
              <div><dt>Caminho</dt><dd>{classPath?.name ?? "Não definido"}</dd></div>
            </dl>
            <nav className="character-command-hero__actions">
              <Link className="button button--primary" href={`/arena?personagem=${character.id}`}>Entrar na Arena</Link>
              <Link className="button button--dark" href="/loja">Visitar loja</Link>
            </nav>
            <details className="character-command-hero__image-editor">
              <summary>Alterar retrato por link</summary>
              <form action={updateCharacterImageAction.bind(null, character.id)}>
                <label className="sr-only" htmlFor="character-image-url">URL da imagem</label>
                <input
                  id="character-image-url"
                  name="imageUrl"
                  type="url"
                  defaultValue={character.image_url ?? ""}
                  placeholder="https://exemplo.com/personagem.png"
                />
                <button className="button button--primary">Salvar retrato</button>
              </form>
            </details>
          </div>
        </section>

        <section
          className="character-progress-strip character-vitals-panel"
          style={{ "--character-rank": rank.color } as React.CSSProperties}
        >
          <div><small>Nível atual</small><strong>{character.level}</strong></div>
          <div className="player-xp">
            <small>Experiência</small>
            <strong>{character.xp.toLocaleString("pt-BR")} / {progress.next.toLocaleString("pt-BR")} XP</strong>
            <span><i style={{ width: `${progress.percent}%` }} /></span>
          </div>
          <div><small>WG de {character.name}</small><strong>◆ {character.gold.toLocaleString("pt-BR")}</strong></div>
        </section>

        <nav className="sheet-tabs" aria-label="Seções da ficha">
          <Link className={tab === "resumo" ? "is-active" : ""} href={`/personagens/${character.id}?tab=resumo`}>Ficha</Link>
          <Link className={tab === "habilidades" ? "is-active" : ""} href={`/personagens/${character.id}?tab=habilidades`}>Habilidades</Link>
          <Link className={tab === "equipamentos" ? "is-active" : ""} href={`/personagens/${character.id}?tab=equipamentos`}>Equipamentos</Link>
        </nav>

        {tab === "resumo" ? (
          <>
            {!classPath ? (
              <section className="sheet-section path-selection-board">
                <header>
                  <span className="eyebrow">Missão de classe · nível 50</span>
                  <h2>Escolha seu caminho</h2>
                  <p>
                    {character.level >= 50
                      ? "Leia as missões e confirme a especialização que acompanhará este personagem."
                      : `Faltam ${50 - character.level} níveis para abrir o Salão dos Caminhos.`}
                  </p>
                </header>
                <div className="path-dossier-grid">
                  {character.characterClass.payload.paths.map((path) => (
                    <article key={path.key} className={character.level < 50 ? "is-locked" : ""}>
                      <header>
                        <span>{path.name.slice(0, 1)}</span>
                        <div><small>Nível 50</small><h3>{path.quest.title}</h3></div>
                      </header>
                      <p>{path.quest.briefing}</p>
                      <ol>{path.quest.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ol>
                      <div className="path-passive">
                        <small>Doutrina recebida</small><b>{path.passive.name}</b><span>{path.passive.description}</span>
                      </div>
                      {character.level >= 50 ? (
                        <form action={completePathQuestAction.bind(null, character.id)}>
                          <input name="pathKey" type="hidden" value={path.key} />
                          <button className="button button--primary">Concluir missão e escolher {path.name}</button>
                        </form>
                      ) : (
                        <button className="button button--dark" disabled>Bloqueado até o nível 50</button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="sheet-stat-grid">
              <article><span>HP máximo</span><strong>{character.stats.maxHp}</strong></article>
              <article>
                <span>Recursos iniciais</span>
                <strong>{`+${classResourceBonus} ${character.characterClass.payload.resource.name}${raceResourceBonus ? ` · +${raceResourceBonus} ${character.race.payload.resource?.name}` : ""}`}</strong>
              </article>
              <article><span>Iniciativa</span><strong>{character.stats.initiative}</strong></article>
              <article><span>Poder físico</span><strong>{character.stats.physicalPower}</strong></article>
              <article><span>Poder mágico</span><strong>{character.stats.magicalPower}</strong></article>
              <article><span>Poder de suporte</span><strong>{character.stats.supportPower}</strong></article>
            </section>

            <section className="sheet-section combat-formulas">
              <header>
                <span className="eyebrow">Transparência de combate</span>
                <h2>Como os cálculos funcionam</h2>
                <p>Os mesmos cálculos são usados em Arena, PvE, Treino e Dungeon.</p>
              </header>
              <div>
                <article><b>HP máximo</b><code>HP base + RES × {defaultCombatRules.hpPerResistance}</code><p>RES aumenta sua vida total antes do combate.</p></article>
                <article><b>Ataque básico</b><code>maior valor entre FOR e INT × {defaultCombatRules.basicAttackMultiplier}</code><p>FOR causa dano físico; INT causa dano mágico quando for maior.</p></article>
                <article><b>Dano físico recebido</b><code>Dano bruto × 100 ÷ (100 + DEF)</code><p>DEF reduz ataques e habilidades de dano físico.</p></article>
                <article><b>Dano mágico recebido</b><code>Dano bruto × 100 ÷ (100 + RES)</code><p>RES também reduz ataques e habilidades mágicas.</p></article>
                <article><b>Habilidades</b><code>Σ atributo × multiplicador da habilidade</code><p>Cada card informa quais atributos entram na escala.</p></article>
                <article><b>Escudo e defesa</b><code>Escudo absorve primeiro · Defender bloqueia o próximo dano</code><p>Dano verdadeiro ignora DEF e RES. O dano mínimo normal é {defaultCombatRules.minimumDamage}.</p></article>
              </div>
            </section>

            <section className="sheet-section">
              <header>
                <span className="eyebrow">Atributos finais</span>
                <h2>Distribuição da ficha</h2>
                <p>Base + pontos livres + bônus raciais + equipamentos ativos.</p>
              </header>
              <div className="sheet-attributes">
                {attributeKeys.map((attribute) => (
                  <article key={attribute}>
                    <span>{attribute}</span>
                    <strong>{character.stats.attributes[attribute]}</strong>
                    <small>{attributeLabels[attribute]}</small>
                    <p>
                      {20} base + {character.allocatedAttributes[attribute]} livre +{" "}
                      {character.race.payload.attributeBonuses[attribute]} racial +{" "}
                      {character.stats.attributes[attribute] - 20 - character.allocatedAttributes[attribute] - character.race.payload.attributeBonuses[attribute]} equipamento
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <div className="sheet-columns">
              <section className="sheet-section">
                <header><span className="eyebrow">Identidade racial</span><h2>{character.race.name}</h2></header>
                <div className="sheet-lore-block">
                  <h3>Mecânica racial</h3>
                  {character.race.payload.mechanics.map((entry) => <article key={entry.name}><strong>{entry.name}</strong><p>{entry.description}</p></article>)}
                </div>
                <div className="sheet-lore-block">
                  <h3>Traços passivos</h3>
                  {character.race.payload.traits.map((entry) => <article key={entry.name}><strong>{entry.name}</strong><p>{entry.description}</p></article>)}
                </div>
              </section>
              <section className="sheet-section">
                <header><span className="eyebrow">Identidade da classe</span><h2>{character.characterClass.name}</h2></header>
                <div className="sheet-lore-block">
                  <h3>Mecânica exclusiva</h3>
                  <article><strong>{character.characterClass.payload.mechanic.name}</strong><p>{character.characterClass.payload.mechanic.description}</p></article>
                </div>
                <div className="sheet-lore-block">
                  <h3>Passiva da classe</h3>
                  <article><strong>{character.characterClass.payload.passive.name}</strong><p>{character.characterClass.payload.passive.description}</p></article>
                </div>
              </section>
            </div>
          </>
        ) : null}

        {tab === "habilidades" ? (
          <section className="sheet-section grimoire">
            <header>
              <span className="eyebrow">Grimório automático</span>
              <h2>Habilidades disponíveis</h2>
              <p>O nível da ficha controla os desbloqueios; alterações do Painel ADM aparecem aqui automaticamente.</p>
            </header>
            <div className="grimoire-columns">
              <SkillList
                title="Habilidades da raça"
                unlocked={character.unlockedRaceAbilities.map((entry) => ({ level: entry.level, name: entry.name, description: entry.playerDescription }))}
                locked={futureRaceSkills.map((entry) => ({ level: entry.level, name: entry.name, description: entry.playerDescription }))}
              />
              <SkillList
                title="Habilidades da classe"
                unlocked={character.unlockedClassSkills
                  .filter((entry) => !(classPath?.skills ?? []).some((skill) => skill.key === entry.key))
                  .map((entry) => ({ level: entry.level, name: entry.name, description: entry.effect }))}
                locked={futureClassSkills.map((entry) => ({ level: entry.level, name: entry.name, description: entry.effect }))}
              />
              <SkillList
                title={`Caminho · ${classPath?.name ?? "Não definido"}`}
                unlocked={unlockedPathSkills.map((entry) => ({ level: entry.level, name: entry.name, description: entry.playerDescription }))}
                locked={futurePathSkills.map((entry) => ({ level: entry.level, name: entry.name, description: entry.playerDescription }))}
              />
            </div>
          </section>
        ) : null}

        {tab === "equipamentos" ? (
          <section className="sheet-section inventory-hud" style={{ "--character-rank": rank.color } as React.CSSProperties}>
            <header>
              <span className="eyebrow">Arsenal do personagem</span>
              <h2>Equipamentos de {character.name}</h2>
              <p>Monte seu conjunto de combate. Cada peça equipada altera a ficha e a Arena.</p>
            </header>
            <InventoryWorkbench
              character={{
                id: character.id,
                name: character.name,
                imageUrl: character.image_url,
                rank: character.adventure_rank,
                level: character.level,
              }}
              slots={equipmentSlots.map((slot) => {
                const item = equippedItems.get(slot.key);
                return {
                  key: slot.key,
                  label: slot.label,
                  itemId: item?.id ?? null,
                  reserved: Boolean(item?.twoHanded && item.equippedSlot !== slot.key),
                };
              })}
              items={character.inventory.map((entry) => ({
                id: entry.id,
                name: entry.name,
                description: entry.description,
                rarity: entry.rarity,
                price: entry.price,
                rarityLabel:
                  ({ common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico", legendary: "Lendário", mythic: "Mítico", awakened: "Desperto" } as Record<string, string>)[entry.rarity] ?? entry.rarity,
                slot: entry.slot,
                slotLabel: itemSlotLabel(entry.slot),
                quantity: entry.quantity,
                equippedSlot: entry.equippedSlot,
                attributes: entry.attributes as Record<string, number>,
                effects: entry.specialEffects,
                titleStyle: entry.titleStyle,
                twoHanded: entry.twoHanded,
                compatibleSlots: compatibleEquipSlots(entry.slot, entry.twoHanded),
              }))}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function SkillList({
  title,
  unlocked,
  locked,
}: {
  title: string;
  unlocked: Array<{ level: number; name: string; description: string }>;
  locked: Array<{ level: number; name: string; description: string }>;
}) {
  return (
    <div className="grimoire-list">
      <h3>{title}</h3>
      {unlocked.length === 0 ? <p>Nenhuma habilidade desbloqueada neste nível.</p> : unlocked.map((skill) => (
        <article className="is-unlocked" key={`${skill.level}-${skill.name}`}>
          <span>Nível {skill.level}</span><strong>{skill.name}</strong><p>{skill.description}</p>
        </article>
      ))}
      {locked.slice(0, 4).map((skill) => (
        <article className="is-locked" key={`${skill.level}-${skill.name}`}>
          <span>Desbloqueia no nível {skill.level}</span><strong>{skill.name}</strong><p>{skill.description}</p>
        </article>
      ))}
    </div>
  );
}
