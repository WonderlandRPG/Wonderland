import Link from "next/link";

import { CharacterImageUploader } from "@/components/characters/character-image-uploader";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { SkillLoadoutBuilder } from "@/components/characters/skill-loadout-builder";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { getReworkClasses, getReworkRaces } from "@/lib/content/rework-catalog";
import { getLevelProgress } from "@/lib/game/experience";
import { reworkAttributeKeys } from "@/lib/game/rework-attributes";
import { kingdomName } from "@/lib/game/kingdoms";
import { InventoryWorkbench } from "@/components/inventory/inventory-workbench";
import { getAdventureRank } from "@/lib/game/ranks";
import {
  compatibleEquipSlots,
  equipmentSlots,
  itemSlotLabel,
  occupiedEquipmentSlots,
} from "@/lib/game/equipment";
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
  const [character, ownedCosmetics, classes, races] = await Promise.all([
    requireCharacterSheet(id),
    getOwnedCosmetics(id),
    getReworkClasses(),
    getReworkRaces(),
  ]);
  const reworkClass = classes.find((entry) => entry.name === character.characterClass.name);
  const reworkRace = races.find((entry) => entry.name === character.race.name);
  const progress = getLevelProgress(character.xp);
  const tab = ["resumo", "habilidades", "equipamentos"].includes(query.tab ?? "")
    ? query.tab!
    : "resumo";
  const futureClassSkills = (reworkClass?.abilities ?? [])
    .filter((ability) => ability.unlockLevel > character.level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel);
  const futureRaceSkills = (reworkRace?.powers ?? [])
    .filter((power) => power.unlockLevel > character.level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel);
  const rank = getAdventureRank(character.adventure_rank);
  const equippedTitle = character.inventory.find((item) => item.equippedSlot === "title") ?? null;
  const classPath = reworkClass?.paths.find((path) => path.id === character.class_path_key);
  const supportedPathKeys = new Set(character.characterClass.payload.paths.map((path) => path.key));
  const selectablePaths = reworkClass?.paths.filter((path) => supportedPathKeys.has(path.id)) ?? [];
  const attributes = character.reworkStats.attributes;
  const xpRemaining = Math.max(progress.next - character.xp, 0);
  const tabHref = (nextTab: "resumo" | "habilidades" | "equipamentos") =>
    `/personagens/${character.id}?tab=${nextTab}`;

  return (
    <main className="sheet-page">
      <PlayerNav />
      <div
        className={
          tab === "equipamentos" ? "inventory-page-container" : "page-container sheet-page__inner"
        }
      >
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
            <span>✓</span>Caminho escolhido. A especialização já está salva na ficha.
          </div>
        ) : null}
        {query.status === "caminho-erro" || query.status === "caminho-bloqueado" ? (
          <div className="account-notice is-warning" role="alert">
            <span>!</span>Não foi possível concluir a escolha do caminho. Confirme o nível e tente
            novamente.
          </div>
        ) : null}
        {query.status === "loadout-salvo" ? (
          <div className="account-notice" role="status">
            <span>✓</span>Preparação salva. A Arena já usará este conjunto de habilidades e
            passivas.
          </div>
        ) : null}
        {query.status === "loadout-invalido" || query.status === "loadout-erro" ? (
          <div className="account-notice is-warning" role="alert">
            <span>!</span>
            {query.status === "loadout-invalido"
              ? "Revise os limites e selecione os talentos na ordem da árvore."
              : "Não foi possível salvar o loadout. Confirme se a migração do item 4 foi aplicada."}
          </div>
        ) : null}

        {tab !== "equipamentos" ? (
          <>
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
                  <span className="character-command-hero__online">
                    ● Online · {kingdomName(character.kingdom)}
                  </span>
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
                  <div className="is-rank">
                    <dt>Rank atual</dt>
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
                <div className="character-readiness" aria-label="Prontidão para combate">
                  <div>
                    <small>Vitalidade</small>
                    <strong>{attributes.HP}</strong>
                    <span>HP máximo</span>
                  </div>
                  <div>
                    <small>Defesa</small>
                    <strong>{attributes.DEF}</strong>
                    <span>Redução física</span>
                  </div>
                  <div>
                    <small>Iniciativa</small>
                    <strong>{attributes.INI}</strong>
                    <span>Ordem de ação</span>
                  </div>
                  <div>
                    <small>Maior poder</small>
                    <strong>{Math.max(attributes.FOR, attributes.INT)}</strong>
                    <span>Potência atual</span>
                  </div>
                </div>
                <nav className="character-command-hero__actions">
                  <Link
                    className="button button--primary"
                    href={`/arena?personagem=${character.id}`}
                  >
                    ⚔ Entrar na Arena
                  </Link>
                  <Link className="button button--dark" href={tabHref("equipamentos")}>
                    ◈ Preparar equipamentos
                  </Link>
                  <Link className="character-command-hero__shop" href="/loja">
                    Visitar mercado →
                  </Link>
                </nav>
                <details className="character-command-hero__image-editor">
                  <summary>Alterar retrato do personagem</summary>
                  <CharacterImageUploader
                    characterId={character.id}
                    currentImageUrl={character.image_url}
                  />
                  <div className="character-image-url-option">
                    <span>ou usar uma imagem por link</span>
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
              <div className="character-progress-strip__level">
                <small>Nível atual</small>
                <strong>{character.level}</strong>
              </div>
              <div className="player-xp">
                <div>
                  <small>Progresso para o nível {character.level + 1}</small>
                  <strong>{progress.percent}%</strong>
                </div>
                <span
                  aria-label={`${progress.percent}% do nível concluído`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={progress.percent}
                  role="progressbar"
                >
                  <i style={{ width: `${progress.percent}%` }} />
                </span>
                <small>
                  {character.xp.toLocaleString("pt-BR")} XP · faltam{" "}
                  {xpRemaining.toLocaleString("pt-BR")}
                </small>
              </div>
              <div className="character-progress-strip__wallet">
                <small>Carteira</small>
                <strong>◆ {character.gold.toLocaleString("pt-BR")} WG</strong>
              </div>
            </section>
          </>
        ) : null}

        <nav className="sheet-tabs" aria-label="Seções da ficha">
          <Link
            aria-current={tab === "resumo" ? "page" : undefined}
            className={tab === "resumo" ? "is-active" : ""}
            href={tabHref("resumo")}
          >
            <span>01</span>
            <strong>Ficha</strong>
            <small>Atributos e identidade</small>
          </Link>
          <Link
            aria-current={tab === "habilidades" ? "page" : undefined}
            className={tab === "habilidades" ? "is-active" : ""}
            href={tabHref("habilidades")}
          >
            <span>02</span>
            <strong>Habilidades</strong>
            <small>
              {character.unlockedRaceAbilities.length + character.unlockedClassSkills.length}{" "}
              técnicas disponíveis
            </small>
          </Link>
          <Link
            aria-current={tab === "equipamentos" ? "page" : undefined}
            className={tab === "equipamentos" ? "is-active" : ""}
            href={tabHref("equipamentos")}
          >
            <span>03</span>
            <strong>Equipamentos</strong>
            <small>
              {character.inventory.filter((item) => item.equippedSlot).length} itens equipados
            </small>
          </Link>
        </nav>

        {tab === "resumo" ? (
          <>
            <section className="sheet-stat-grid" aria-label="Resumo de combate">
              <article data-stat="hp">
                <span>HP máximo</span>
                <strong>{attributes.HP}</strong>
                <small>Sobrevivência total</small>
              </article>
              <article data-stat="resource">
                <span>Poder total</span>
                <strong>{character.reworkStats.powerTotal}</strong>
                <small>Soma dos seis atributos finais</small>
              </article>
              <article data-stat="initiative">
                <span>Iniciativa</span>
                <strong>{attributes.INI}</strong>
                <small>Prioridade de turno</small>
              </article>
              <article data-stat="physical">
                <span>Força</span>
                <strong>{attributes.FOR}</strong>
                <small>Base das técnicas físicas</small>
              </article>
              <article data-stat="magic">
                <span>Inteligência</span>
                <strong>{attributes.INT}</strong>
                <small>Base das técnicas mágicas</small>
              </article>
              <article data-stat="support">
                <span>Resistência</span>
                <strong>{attributes.RES}</strong>
                <small>Proteção contra magia</small>
              </article>
            </section>

            {!classPath && selectablePaths.length ? (
              <section className="sheet-section path-selection-board">
                <header>
                  <span className="eyebrow">Especialização · nível 50</span>
                  <h2>Escolha seu caminho</h2>
                  <p>
                    {character.level >= 50
                      ? "Escolha a especialização da sua classe."
                      : `A escolha fica disponível no nível 50. Faltam ${50 - character.level} níveis.`}
                  </p>
                </header>
                <div className="path-dossier-grid">
                  {selectablePaths.map((path) => (
                    <article key={path.id} className={character.level < 50 ? "is-locked" : ""}>
                      <header>
                        <span>{path.name.slice(0, 1)}</span>
                        <div>
                          <small>Nível 50</small>
                          <h3>{path.name}</h3>
                        </div>
                      </header>
                      <p>{path.description}</p>
                      {character.level >= 50 ? (
                        <form action={completePathQuestAction.bind(null, character.id)}>
                          <input name="pathKey" type="hidden" value={path.id} />
                          <button className="button button--primary">Escolher {path.name}</button>
                        </form>
                      ) : (
                        <button className="button button--dark" disabled>
                          Bloqueado até o nível 50
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="sheet-section">
              <header>
                <span className="eyebrow">Atributos finais</span>
                <h2>Distribuição da ficha</h2>
                <p>Base racial + estrelas distribuídas + equipamentos ativos.</p>
                <strong>Poder Total: {character.reworkStats.powerTotal}</strong>
              </header>
              <div className="sheet-attributes">
                {reworkAttributeKeys.map((attribute) => (
                  <article key={attribute}>
                    <span>{attribute}</span>
                    <strong>{character.reworkStats.attributes[attribute]}</strong>
                    <small>
                      {
                        {
                          FOR: "Força",
                          INT: "Inteligência",
                          DEF: "Defesa",
                          RES: "Resistência",
                          HP: "Vida",
                          INI: "Iniciativa",
                        }[attribute]
                      }
                    </small>
                    <p>
                      {character.reworkStats.base[attribute]} racial +{" "}
                      {character.reworkAttributes[attribute]} estrelas +{" "}
                      {character.reworkStats.equipment[attribute] ?? 0} equipamento
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
                <p>{reworkRace?.description ?? "Raça do personagem."}</p>
                <div className="sheet-lore-block">
                  <h3>Habilidades e característica racial</h3>
                  {reworkRace?.powers.map((power) => (
                    <article key={power.id}>
                      <strong>{power.name}</strong>
                      <p>{power.description}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="sheet-section">
                <header>
                  <span className="eyebrow">Identidade da classe</span>
                  <h2>{character.characterClass.name}</h2>
                </header>
                <p>{reworkClass?.description ?? "Classe do personagem."}</p>
                <div className="sheet-lore-block">
                  <h3>Passiva e ataque básico</h3>
                  {reworkClass?.abilities
                    .filter(
                      (ability) => ability.kind === "Passiva" || ability.kind === "Ataque básico",
                    )
                    .map((ability) => (
                      <article key={ability.id}>
                        <strong>{ability.name}</strong>
                        <p>{ability.description}</p>
                      </article>
                    ))}
                </div>
              </section>
            </div>
          </>
        ) : null}

        {tab === "habilidades" ? (
          <>
            <SkillLoadoutBuilder character={character} />
            <section className="sheet-section grimoire">
              <header>
                <span className="eyebrow">Próximos desbloqueios</span>
                <h2>Progressão do grimório</h2>
                <p>
                  O nível da ficha controla os desbloqueios; alterações publicadas pelo Painel ADM
                  aparecem automaticamente.
                </p>
              </header>
              <div className="grimoire-columns">
                <SkillList
                  title="Raça"
                  unlocked={[]}
                  locked={futureRaceSkills.map((entry) => ({
                    level: entry.unlockLevel,
                    name: entry.name,
                    description: entry.description,
                  }))}
                />
                <SkillList
                  title="Classe"
                  unlocked={[]}
                  locked={futureClassSkills.map((entry) => ({
                    level: entry.unlockLevel,
                    name: entry.name,
                    description: entry.description,
                  }))}
                />
              </div>
            </section>
          </>
        ) : null}

        {tab === "equipamentos" ? (
          <section
            className="inventory-hud"
            style={{ "--character-rank": rank.color } as React.CSSProperties}
          >
            <header>
              <span className="eyebrow">Arsenal do personagem</span>
              <h2>Equipamentos de {character.name}</h2>
              <p>Monte seu conjunto de combate. Cada peça equipada altera a ficha e a Arena.</p>
            </header>
            <InventoryWorkbench
              cosmetics={ownedCosmetics}
              currentPowerTotal={character.reworkStats.powerTotal}
              character={{
                id: character.id,
                name: character.name,
                imageUrl: character.image_url,
                rank: character.adventure_rank,
                level: character.level,
                raceName: character.race.name,
                className: character.characterClass.name,
                gold: character.gold,
                attributes: character.reworkStats.attributes,
                cosmetics: character.cosmetics,
              }}
              slots={equipmentSlots.map((slot) => {
                const item = character.inventory.find((entry) =>
                  occupiedEquipmentSlots(entry).includes(slot.key),
                );
                return {
                  key: slot.key,
                  label: slot.label,
                  itemId: item?.id ?? null,
                  reserved: Boolean(item?.twoHanded && !item.equippedSlots.includes(slot.key)),
                };
              })}
              items={character.inventory.map((entry) => ({
                id: entry.id,
                name: entry.name,
                description: entry.description,
                rarity: entry.rarity,
                price: entry.price,
                rarityLabel:
                  (
                    {
                      common: "Comum",
                      uncommon: "Incomum",
                      rare: "Raro",
                      epic: "Épico",
                      legendary: "Lendário",
                      mythic: "Mítico",
                      awakened: "Desperto",
                    } as Record<string, string>
                  )[entry.rarity] ?? entry.rarity,
                slot: entry.slot,
                slotLabel: itemSlotLabel(entry.slot),
                quantity: entry.quantity,
                location: entry.location,
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
