import Link from "next/link";

import { CharacterImageUploader } from "@/components/characters/character-image-uploader";
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
import { getOwnedCosmetics } from "@/lib/content/cosmetics";

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
  const ownedCosmetics = await getOwnedCosmetics(id);
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
  const xpRemaining = Math.max(progress.next - character.xp, 0);
  const tabHref = (nextTab: "resumo" | "habilidades" | "equipamentos") =>
    `/personagens/${character.id}?tab=${nextTab}`;

  return (
    <main className="sheet-page">
      <PlayerNav />
      <div className="page-container sheet-page__inner">
        <nav className="sheet-breadcrumb" aria-label="Localização na jornada">
          <Link href="/personagens">Meus personagens</Link>
          <span aria-hidden="true">/</span>
          <strong>{character.name}</strong>
          <span className="sheet-breadcrumb__status">● Em jornada</span>
        </nav>
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
              cosmetics={character.cosmetics}
              variant="hero"
            />
          </div>
          <div className="character-command-hero__identity">
            <div className="character-command-hero__overline">
              <span className="eyebrow">Dossiê do aventureiro</span>
              <span className="character-command-hero__online">● Online · {kingdomName(character.kingdom)}</span>
            </div>
            <h1>{character.name}</h1>
            <p className="character-command-hero__calling">
              <strong>{character.race.name}</strong>
              <span aria-hidden="true">◆</span>
              <strong>{character.characterClass.name}</strong>
              <span aria-hidden="true">◆</span>
              <span>{classPath?.name ?? "Caminho ainda não escolhido"}</span>
            </p>
            <dl className="character-command-hero__facts">
              <div className="is-rank"><dt>Rank atual</dt><dd>{rank.key}</dd></div>
              <div><dt>Nível</dt><dd>{character.level}</dd></div>
              <div><dt>Reino</dt><dd>{kingdomName(character.kingdom)}</dd></div>
              <div><dt>Caminho</dt><dd>{classPath?.name ?? "Não definido"}</dd></div>
            </dl>
            <div className="character-readiness" aria-label="Prontidão para combate">
              <div><small>Vitalidade</small><strong>{character.stats.maxHp}</strong><span>HP máximo</span></div>
              <div><small>Defesa</small><strong>{character.stats.attributes.DEF}</strong><span>Redução física</span></div>
              <div><small>Iniciativa</small><strong>{character.stats.initiative}</strong><span>Ordem de ação</span></div>
              <div><small>Maior poder</small><strong>{Math.max(character.stats.physicalPower, character.stats.magicalPower, character.stats.supportPower)}</strong><span>Potência atual</span></div>
            </div>
            <nav className="character-command-hero__actions">
              <Link className="button button--primary" href={`/arena?personagem=${character.id}`}>⚔ Entrar na Arena</Link>
              <Link className="button button--dark" href={tabHref("equipamentos")}>◈ Preparar equipamentos</Link>
              <Link className="character-command-hero__shop" href="/loja">Visitar mercado →</Link>
            </nav>
            <details className="character-command-hero__image-editor">
              <summary>Alterar retrato do personagem</summary>
              <CharacterImageUploader characterId={character.id} currentImageUrl={character.image_url} />
              <div className="character-image-url-option">
                <span>ou usar uma imagem por link</span>
                <form action={updateCharacterImageAction.bind(null, character.id)}>
                  <label className="sr-only" htmlFor="character-image-url">URL da imagem</label>
                  <input
                    id="character-image-url"
                    name="imageUrl"
                    type="url"
                    defaultValue={character.image_url ?? ""}
                    placeholder="https://exemplo.com/personagem.png"
                  />
                  <button className="button button--dark">Salvar link</button>
                </form>
              </div>
            </details>
          </div>
        </section>

        <section
          className="character-progress-strip character-vitals-panel"
          style={{ "--character-rank": rank.color } as React.CSSProperties}
        >
          <div className="character-progress-strip__level"><small>Nível atual</small><strong>{character.level}</strong></div>
          <div className="player-xp">
            <div><small>Progresso para o nível {character.level + 1}</small><strong>{progress.percent}%</strong></div>
            <span aria-label={`${progress.percent}% do nível concluído`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress.percent} role="progressbar"><i style={{ width: `${progress.percent}%` }} /></span>
            <small>{character.xp.toLocaleString("pt-BR")} XP · faltam {xpRemaining.toLocaleString("pt-BR")}</small>
          </div>
          <div className="character-progress-strip__wallet"><small>Carteira</small><strong>◆ {character.gold.toLocaleString("pt-BR")} WG</strong></div>
        </section>

        <nav className="sheet-tabs" aria-label="Seções da ficha">
          <Link aria-current={tab === "resumo" ? "page" : undefined} className={tab === "resumo" ? "is-active" : ""} href={tabHref("resumo")}><span>01</span><strong>Ficha</strong><small>Atributos e identidade</small></Link>
          <Link aria-current={tab === "habilidades" ? "page" : undefined} className={tab === "habilidades" ? "is-active" : ""} href={tabHref("habilidades")}><span>02</span><strong>Habilidades</strong><small>{character.unlockedRaceAbilities.length + character.unlockedClassSkills.length + unlockedPathSkills.length} técnicas disponíveis</small></Link>
          <Link aria-current={tab === "equipamentos" ? "page" : undefined} className={tab === "equipamentos" ? "is-active" : ""} href={tabHref("equipamentos")}><span>03</span><strong>Equipamentos</strong><small>{character.inventory.filter((item) => item.equippedSlot).length} itens equipados</small></Link>
        </nav>

        {tab === "resumo" ? (
          <>
            <section className="sheet-stat-grid" aria-label="Resumo de combate">
              <article data-stat="hp"><span>HP máximo</span><strong>{character.stats.maxHp}</strong><small>Sobrevivência total</small></article>
              <article data-stat="resource">
                <span>Recursos iniciais</span>
                <strong>{`+${classResourceBonus} ${character.characterClass.payload.resource.name}${raceResourceBonus ? ` · +${raceResourceBonus} ${character.race.payload.resource?.name}` : ""}`}</strong>
                <small>Disponíveis no início</small>
              </article>
              <article data-stat="initiative"><span>Iniciativa</span><strong>{character.stats.initiative}</strong><small>Prioridade de turno</small></article>
              <article data-stat="physical"><span>Poder físico</span><strong>{character.stats.physicalPower}</strong><small>Escala com FOR</small></article>
              <article data-stat="magic"><span>Poder mágico</span><strong>{character.stats.magicalPower}</strong><small>Escala com INT</small></article>
              <article data-stat="support"><span>Poder de suporte</span><strong>{character.stats.supportPower}</strong><small>Escala com ARC</small></article>
            </section>

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

            <details className="sheet-section combat-formulas">
              <summary><span><small>Manual de combate</small><strong>Como os cálculos funcionam</strong></span><em>Abrir fórmulas</em></summary>
              <p className="combat-formulas__intro">Os mesmos cálculos são usados em Arena, PvE, Treino e Dungeon.</p>
              <div>
                <article><b>HP máximo</b><code>HP base + RES × {defaultCombatRules.hpPerResistance}</code><p>RES aumenta sua vida total antes do combate.</p></article>
                <article><b>Ataque básico</b><code>maior valor entre FOR e INT × {defaultCombatRules.basicAttackMultiplier}</code><p>FOR causa dano físico; INT causa dano mágico quando for maior.</p></article>
                <article><b>Dano físico recebido</b><code>Dano bruto × 100 ÷ (100 + DEF)</code><p>DEF reduz ataques e habilidades de dano físico.</p></article>
                <article><b>Dano mágico recebido</b><code>Dano bruto × 100 ÷ (100 + RES)</code><p>RES também reduz ataques e habilidades mágicas.</p></article>
                <article><b>Habilidades</b><code>Σ atributo × multiplicador da habilidade</code><p>Cada card informa quais atributos entram na escala.</p></article>
                <article><b>Escudo e defesa</b><code>Escudo absorve primeiro · Defender bloqueia o próximo dano</code><p>Dano verdadeiro ignora DEF e RES. O dano mínimo normal é {defaultCombatRules.minimumDamage}.</p></article>
              </div>
            </details>

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
              cosmetics={ownedCosmetics}
              character={{
                id: character.id,
                name: character.name,
                imageUrl: character.image_url,
                rank: character.adventure_rank,
                level: character.level,
                cosmetics: character.cosmetics,
              }}
              slots={equipmentSlots.map((slot) => {
                const item = character.inventory.find((entry) => entry.equippedSlots.includes(slot.key));
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
                equippedSlots: entry.equippedSlots,
                imageUrl: entry.imageUrl,
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
