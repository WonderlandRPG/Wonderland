import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { getLevelProgress } from "@/lib/game/experience";
import { attributeLabels } from "@/lib/game/races";
import { attributeKeys } from "@/lib/game/schemas";
import { kingdomName } from "@/lib/game/kingdoms";
import {
  defaultEquipSlot,
  equipmentSlots,
  itemSlotEmoji,
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
  const futureRaceSkills = character.race.payload.progression
    .filter((skill) => skill.level > character.level)
    .sort((a, b) => a.level - b.level);
  const equippedItems = new Map(
    character.inventory
      .filter((item) => item.equippedSlot)
      .map((item) => [item.equippedSlot, item]),
  );
  return (
    <main className="sheet-page">
      <header className="account-header">
        <BrandMark inverse />
        <nav>
          <Link href="/personagens">Personagens</Link>
          <Link href="/perfil">Minha conta</Link>
        </nav>
      </header>
      <div className="page-container sheet-page__inner">
        {query.status === "criado" ? (
          <div className="account-notice" data-sfx-on-mount="confirm" role="status">
            <span>✓</span>Personagem criado! A ficha já está salva no seu perfil.
          </div>
        ) : null}
        <section className="sheet-hero">
          <div className="sheet-hero__portrait">
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
          </div>
          <div>
            <span className="eyebrow">
              {character.race.name} · {character.characterClass.name} ·{" "}
              {kingdomName(character.kingdom)}
            </span>
            <h1>{character.name}</h1>
            <p>{character.characterClass.payload.specialization}</p>
            <form
              className="sheet-hero__image-form"
              action={updateCharacterImageAction.bind(null, character.id)}
            >
              <label htmlFor="character-image-url">Imagem do personagem por link</label>
              <div>
                <input
                  id="character-image-url"
                  name="imageUrl"
                  type="url"
                  defaultValue={character.image_url ?? ""}
                  placeholder="https://exemplo.com/personagem.png"
                />
                <button className="button button--primary">Salvar imagem</button>
              </div>
            </form>
          </div>
        </section>
        <section className="character-progress-strip">
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
        <nav className="sheet-actions">
          <Link className="button button--primary" href={`/arena?personagem=${character.id}`}>
            Entrar na Arena
          </Link>
          <Link className="button button--dark" href="/loja">
            Visitar loja
          </Link>
        </nav>
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
                <span>Mana máxima</span>
                <strong>{character.stats.maxMana}</strong>
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
                  name: entry.title,
                  description: entry.description,
                }))}
                locked={futureRaceSkills.map((entry) => ({
                  level: entry.level,
                  name: entry.title,
                  description: entry.description,
                }))}
              />
              <SkillList
                title="Habilidades da classe"
                unlocked={character.unlockedClassSkills.map((entry) => ({
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
            </div>
          </section>
        ) : null}
        {tab === "equipamentos" ? (
          <section className="sheet-section">
            <header>
              <span className="eyebrow">Equipamentos</span>
              <h2>Inventário de {character.name}</h2>
              <p>Itens equipados alteram a ficha e os cálculos da Arena.</p>
            </header>
            <div className="equipment-slot-grid">
              {equipmentSlots.map((slot) => {
                const item = equippedItems.get(slot.key);
                return (
                  <article className={item ? "is-equipped" : ""} key={slot.key}>
                    <span aria-hidden="true">{slot.emoji}</span>
                    <small>{slot.label}</small>
                    <strong>{item?.name ?? "Vazio"}</strong>
                    {item ? (
                      <form action={unequipItemAction.bind(null, character.id)}>
                        <input name="inventoryId" type="hidden" value={item.id} />
                        <button>Desequipar</button>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <h3 className="inventory-heading">Mochila</h3>
            {character.inventory.length ? (
              <div className="portal-card-grid inventory-card-grid">
                {character.inventory
                  .filter((entry) => !entry.equippedSlot)
                  .map((entry) => (
                    <article className={`shop-card shop-card--${entry.rarity}`} key={entry.id}>
                      <span className="shop-card__icon" aria-hidden="true">
                        {itemSlotEmoji(entry.slot)}
                      </span>
                      <small>
                        {entry.rarity} · {itemSlotLabel(entry.slot)}
                      </small>
                      <h3>{entry.name}</h3>
                      <p>{entry.description}</p>
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
