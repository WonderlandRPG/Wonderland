import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { getLevelProgress } from "@/lib/game/experience";
import { attributeLabels } from "@/lib/game/races";
import { attributeKeys } from "@/lib/game/schemas";
import { kingdomName } from "@/lib/game/kingdoms";
import { RankBadge } from "@/components/characters/rank-badge";
import { ItemGlyph } from "@/components/items/item-glyph";
import { getAdventureRank } from "@/lib/game/ranks";
import { getConvertedResourceBonus } from "@/lib/game/combat";
import { getStructuredRaceAbilities } from "@/lib/game/races";
import {
  defaultEquipSlot,
  equipmentSlots,
  itemSlotLabel,
} from "@/lib/game/equipment";
import {
  claimCharacterPresenceAction,
  equipItemAction,
  unequipItemAction,
  updateCharacterImageAction,
} from "./equipment-actions";

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
  const { characterId: activeCharacterId } = await requireActiveCharacter(`/personagens/${id}`);
  const character = await requireCharacterSheet(id);
  const progress = getLevelProgress(character.xp);
  const tab = ["resumo", "habilidades", "equipamentos"].includes(query.tab ?? "")
    ? query.tab!
    : "resumo";
  const claimedToday = character.last_daily_claim === new Date().toISOString().slice(0, 10);
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
  const twoHandedMain = equippedItems.get("main_weapon");
  if (twoHandedMain?.twoHanded) equippedItems.set("off_weapon", twoHandedMain);
  const rank = getAdventureRank(character.adventure_rank);
  const classPath = character.characterClass.payload.paths?.find(
    (path) => path.key === character.class_path_key,
  );
  const unlockedPathSkills = (classPath?.skills ?? []).filter((skill) => skill.level <= character.level);
  const futurePathSkills = (classPath?.skills ?? []).filter((skill) => skill.level > character.level);
  const usesMana = [...character.unlockedClassSkills, ...character.unlockedRaceAbilities].some(
    (skill) => skill.resource === "mana",
  );
  const classResourceBonus = getConvertedResourceBonus(
    character.stats.attributes.INT,
    character.characterClass.payload.resource.maximum,
  );
  const raceResourceBonus = getConvertedResourceBonus(
    character.stats.attributes.INT,
    character.race.payload.resource?.maximum ?? 0,
  );
  const renderEquipmentSlot = (slot: (typeof equipmentSlots)[number]) => {
    const item = equippedItems.get(slot.key);
    const isTwoHandedReservation = slot.key === "off_weapon" && item?.twoHanded;
    const catalogSlot = slot.key.startsWith("ring")
      ? "ring"
      : slot.key.startsWith("earring")
        ? "earring"
        : slot.key;
    const candidates = character.inventory.filter(
      (entry) => entry.slot === catalogSlot && entry.id !== item?.id,
    );
    return (
      <details className={`equipment-slot-picker ${item ? "is-equipped" : ""} ${isTwoHandedReservation ? "is-two-handed-reservation" : ""}`} key={slot.key}>
        <summary>
          <span className="equipment-slot__seal"><ItemGlyph slot={slot.key} /></span>
          <div><small>{slot.label}</small><strong>{item?.name ?? "Espaço livre"}</strong>{isTwoHandedReservation ? <em>Ocupado pela arma de duas mãos</em> : null}</div>
          <i aria-hidden="true">⌄</i>
        </summary>
        <div className="equipment-slot-picker__menu">
          <header><strong>{isTwoHandedReservation ? "Espaço reservado" : `Equipar em ${slot.label}`}</strong><small>{isTwoHandedReservation ? "Remova a arma principal para liberar" : `${candidates.length} opções na mochila`}</small></header>
          {item ? <form action={unequipItemAction.bind(null, character.id)}><input name="inventoryId" type="hidden" value={item.id} /><span><ItemGlyph slot={item.slot}/><b>{item.name}</b><small>Equipado agora</small></span><button>Remover</button></form> : null}
          {candidates.map((entry) => <form action={equipItemAction.bind(null, character.id)} key={entry.id}><input name="inventoryId" type="hidden" value={entry.id}/><input name="slot" type="hidden" value={slot.key}/><span><ItemGlyph slot={entry.slot}/><b>{entry.name}</b><small>{entry.rarity}</small></span><button>Equipar</button></form>)}
          {!item && !candidates.length ? <p>Você ainda não possui itens compatíveis com este espaço.</p> : null}
        </div>
      </details>
    );
  };
  return (
    <main className="sheet-page">
      <PlayerNav />
      <div className="page-container sheet-page__inner">
        {query.status === "criado" ? (
          <div className="account-notice" data-sfx-on-mount="confirm" role="status">
            <span>✓</span>Personagem criado! A ficha já está salva no seu perfil.
          </div>
        ) : null}
        <section
          className="character-command-hero"
          style={{ "--character-rank": rank.color } as React.CSSProperties}
          data-character-rank={rank.key}
        >
          <div className="character-command-hero__art">
            {character.image_url ? (
              <span
                className="is-image"
                role="img"
                aria-label={`Retrato de ${character.name}`}
                style={{ backgroundImage: `url(${character.image_url})` }}
              />
            ) : (
              <span>{character.name.slice(0, 2).toUpperCase()}</span>
            )}
            <RankBadge rank={character.adventure_rank} />
          </div>
          <div className="character-command-hero__identity">
            <span className="eyebrow">Personagem online · {kingdomName(character.kingdom)}</span>
            <h1>{character.name}</h1>
            <p>
              {character.race.name} · {character.characterClass.name}
            </p>
            <dl className="character-command-hero__facts">
              <div>
                <dt>Rank</dt>
                <dd>{rank.key}</dd>
              </div>
              <div>
                <dt>Nível</dt>
                <dd>{character.level}</dd>
              </div>
              <div>
                <dt>Reino</dt>
                <dd>{kingdomName(character.kingdom)}</dd>
              </div>
              <div>
                <dt>Caminho</dt>
                <dd>{classPath?.name ?? "Não definido"}</dd>
              </div>
            </dl>
            <nav className="character-command-hero__actions">
              <Link className="button button--primary" href={`/arena?personagem=${character.id}`}>
                Entrar na Arena
              </Link>
              <Link className="button button--dark" href="/loja">
                Visitar loja
              </Link>
            </nav>
            <details className="character-command-hero__image-editor">
              <summary>Alterar retrato por link</summary>
              <form action={updateCharacterImageAction.bind(null, character.id)}>
                <label className="sr-only" htmlFor="character-image-url">
                  URL da imagem
                </label>
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
          <div>
            <small>Nível atual</small>
            <strong>{character.level}</strong>
          </div>
          <div className="player-xp">
            <small>Experiência</small>
            <strong>
              {character.xp.toLocaleString("pt-BR")} / {progress.next.toLocaleString("pt-BR")} XP
            </strong>
            <span>
              <i style={{ width: `${progress.percent}%` }} />
            </span>
          </div>
          <div>
            <small>WG de {character.name}</small>
            <strong>◆ {character.gold.toLocaleString("pt-BR")}</strong>
          </div>
          <form action={claimCharacterPresenceAction.bind(null, character.id)}>
            <button
              className="button button--primary"
              disabled={claimedToday || activeCharacterId !== character.id}
            >
              {claimedToday
                ? `Sequência: ${character.daily_streak} dias`
                : activeCharacterId === character.id
                  ? "Marcar presença"
                  : "Selecione para jogar"}
            </button>
          </form>
        </section>
        <nav className="sheet-tabs" aria-label="Seções da ficha">
          <Link
            className={tab === "resumo" ? "is-active" : ""}
            href={`/personagens/${character.id}?tab=resumo`}
          >
            Ficha
          </Link>
          <Link
            className={tab === "habilidades" ? "is-active" : ""}
            href={`/personagens/${character.id}?tab=habilidades`}
          >
            Habilidades
          </Link>
          <Link
            className={tab === "equipamentos" ? "is-active" : ""}
            href={`/personagens/${character.id}?tab=equipamentos`}
          >
            Equipamentos
          </Link>
        </nav>
        {tab === "resumo" ? (
          <>
            <section className="sheet-stat-grid">
              <article>
                <span>HP máximo</span>
                <strong>{character.stats.maxHp}</strong>
              </article>
              <article>
                <span>{usesMana ? "Mana máxima" : "Recursos iniciais"}</span>
                <strong>{usesMana ? character.stats.maxMana : `+${classResourceBonus} ${character.characterClass.payload.resource.name}${raceResourceBonus ? ` · +${raceResourceBonus} ${character.race.payload.resource?.name}` : ""}`}</strong>
              </article>
              <article>
                <span>Iniciativa</span>
                <strong>{character.stats.initiative}</strong>
              </article>
              <article>
                <span>Poder físico</span>
                <strong>{character.stats.physicalPower}</strong>
              </article>
              <article>
                <span>Poder mágico</span>
                <strong>{character.stats.magicalPower}</strong>
              </article>
              <article>
                <span>Poder de suporte</span>
                <strong>{character.stats.supportPower}</strong>
              </article>
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
                      {character.stats.attributes[attribute] -
                        20 -
                        character.allocatedAttributes[attribute] -
                        character.race.payload.attributeBonuses[attribute]}{" "}
                      equipamento
                    </p>
                  </article>
                ))}
              </div>
            </section>
            <div className="sheet-columns">
              <section className="sheet-section">
                <header>
                  <span className="eyebrow">Identidade racial</span>
                  <h2>{character.race.name}</h2>
                </header>
                <div className="sheet-lore-block">
                  <h3>Mecânica racial</h3>
                  {character.race.payload.mechanics.map((entry) => (
                    <article key={entry.name}>
                      <strong>{entry.name}</strong>
                      <p>{entry.description}</p>
                    </article>
                  ))}
                </div>
                <div className="sheet-lore-block">
                  <h3>Traços passivos</h3>
                  {character.race.payload.traits.map((entry) => (
                    <article key={entry.name}>
                      <strong>{entry.name}</strong>
                      <p>{entry.description}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="sheet-section">
                <header>
                  <span className="eyebrow">Identidade da classe</span>
                  <h2>{character.characterClass.name}</h2>
                </header>
                <div className="sheet-lore-block">
                  <h3>Mecânica exclusiva</h3>
                  <article>
                    <strong>{character.characterClass.payload.mechanic.name}</strong>
                    <p>{character.characterClass.payload.mechanic.description}</p>
                  </article>
                </div>
                <div className="sheet-lore-block">
                  <h3>Passiva da classe</h3>
                  <article>
                    <strong>{character.characterClass.payload.passive.name}</strong>
                    <p>{character.characterClass.payload.passive.description}</p>
                  </article>
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
              <p>
                O nível da ficha controla os desbloqueios; alterações do Painel ADM aparecem aqui
                automaticamente.
              </p>
            </header>
            <div className="grimoire-columns">
              <SkillList
                title="Habilidades da raça"
                unlocked={character.unlockedRaceAbilities.map((entry) => ({
                  level: entry.level,
                  name: entry.name,
                  description: entry.playerDescription,
                }))}
                locked={futureRaceSkills.map((entry) => ({
                  level: entry.level,
                  name: entry.name,
                  description: entry.playerDescription,
                }))}
              />
              <SkillList
                title="Habilidades da classe"
                unlocked={character.unlockedClassSkills.filter((entry) => !(classPath?.skills ?? []).some((skill) => skill.key === entry.key)).map((entry) => ({
                  level: entry.level,
                  name: entry.name,
                  description: entry.effect,
                }))}
                locked={futureClassSkills.map((entry) => ({
                  level: entry.level,
                  name: entry.name,
                  description: entry.effect,
                }))}
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
          <section
            className="sheet-section inventory-hud"
            style={{ "--character-rank": rank.color } as React.CSSProperties}
          >
            <header>
              <span className="eyebrow">Arsenal do personagem</span>
              <h2>Equipamentos de {character.name}</h2>
              <p>Monte seu conjunto de combate. Cada peça equipada altera a ficha e a Arena.</p>
            </header>
            <div className="inventory-loadout">
              <div className="equipment-slot-grid is-left">
                {equipmentSlots.slice(0, 7).map(renderEquipmentSlot)}
              </div>
              <div className="inventory-loadout__character">
                <div
                  className={character.image_url ? "is-image" : ""}
                  style={
                    character.image_url
                      ? { backgroundImage: `url(${character.image_url})` }
                      : undefined
                  }
                >
                  {character.image_url ? "" : character.name.slice(0, 2).toUpperCase()}
                </div>
                <RankBadge rank={character.adventure_rank} />
                <span>Conjunto ativo</span>
                <strong>{character.name}</strong>
                <small>
                  {equippedItems.size} / {equipmentSlots.length} espaços ocupados
                </small>
              </div>
              <div className="equipment-slot-grid is-right">
                {equipmentSlots.slice(7).map(renderEquipmentSlot)}
              </div>
            </div>
            <div className="inventory-heading">
              <div>
                <span className="eyebrow">Reserva de itens</span>
                <h3>Mochila</h3>
              </div>
              <small>
                {character.inventory.filter((entry) => !entry.equippedSlot).length} itens
              </small>
            </div>
            {character.inventory.length ? (
              <div className="inventory-card-grid">
                {character.inventory
                  .filter((entry) => !entry.equippedSlot)
                  .map((entry) => (
                    <article
                      className={`inventory-item-card shop-card--${entry.rarity}`}
                      key={entry.id}
                    >
                      <ItemGlyph className="shop-card__icon" slot={entry.slot} />
                      <small>
                        {entry.rarity} · {itemSlotLabel(entry.slot)}
                      </small>
                      <h3>{entry.name}</h3>
                      <p>{entry.description}</p>
                      {entry.specialEffects.map((effect) => <div className="inventory-item-effect" key={effect.key}><b>{effect.name}</b><span>{effect.description}</span></div>)}
                      <footer>
                        <span>Quantidade {entry.quantity}</span>
                        <form action={equipItemAction.bind(null, character.id)}>
                          <input name="inventoryId" type="hidden" value={entry.id} />
                          {entry.slot === "ring" || entry.slot === "earring" ? (
                            <select
                              name="slot"
                              defaultValue={defaultEquipSlot(entry.slot) ?? undefined}
                            >
                              {equipmentSlots
                                .filter((slot) => slot.key.startsWith(entry.slot))
                                .map((slot) => (
                                  <option key={slot.key} value={slot.key}>
                                    {slot.label}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <input
                              name="slot"
                              type="hidden"
                              value={defaultEquipSlot(entry.slot) ?? ""}
                            />
                          )}
                          <button className="button button--dark">Equipar</button>
                        </form>
                      </footer>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="portal-empty">
                <span>◆</span>
                <h3>Inventário vazio</h3>
                <p>Compre equipamentos na Loja usando WG.</p>
              </div>
            )}
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
      {unlocked.length === 0 ? (
        <p>Nenhuma habilidade desbloqueada neste nível.</p>
      ) : (
        unlocked.map((skill) => (
          <article className="is-unlocked" key={`${skill.level}-${skill.name}`}>
            <span>Nível {skill.level}</span>
            <strong>{skill.name}</strong>
            <p>{skill.description}</p>
          </article>
        ))
      )}
      {locked.slice(0, 4).map((skill) => (
        <article className="is-locked" key={`${skill.level}-${skill.name}`}>
          <span>Desbloqueia no nível {skill.level}</span>
          <strong>{skill.name}</strong>
          <p>{skill.description}</p>
        </article>
      ))}
    </div>
  );
}
