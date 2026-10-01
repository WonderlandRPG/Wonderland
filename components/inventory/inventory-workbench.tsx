"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  equipItemAction,
  sellInventoryItemAction,
  setInventoryLocationAction,
  unequipItemAction,
} from "@/app/personagens/[id]/equipment-actions";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import type { CharacterCosmeticLoadout } from "@/lib/content/character-cosmetics";
import { ItemGlyph } from "@/components/items/item-glyph";
import { InventoryActionForm } from "./inventory-action-form";
import { ItemArtwork } from "@/components/items/item-artwork";
import { equipOwnedCosmeticAction } from "@/app/personagens/[id]/cosmetic-actions";
import type { CosmeticCatalogItem } from "@/lib/content/cosmetics";
import { itemPower, itemPowerDelta } from "@/lib/game/item-attributes";
import { equippedItemCopies } from "@/lib/game/equipment";
import type { ReworkAttributes } from "@/lib/game/rework-attributes";

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  rarity: string;
  price: number;
  rarityLabel: string;
  slot: string;
  slotLabel: string;
  quantity: number;
  location: "bag" | "storage";
  equippedSlot: string | null;
  equippedSlots: string[];
  imageUrl: string | null;
  attributes: Record<string, number>;
  effects: Array<{ key: string; name: string; description: string }>;
  titleStyle: { primary: string; secondary: string; glow: string } | null;
  twoHanded: boolean;
  compatibleSlots: string[];
};
type Slot = { key: string; label: string; itemId: string | null; reserved: boolean };

export function InventoryWorkbench({
  character,
  slots,
  items,
  cosmetics,
  currentPowerTotal,
}: {
  character: {
    id: string;
    name: string;
    imageUrl: string | null;
    rank: string;
    level: number;
    raceName: string;
    className: string;
    gold: number;
    attributes: ReworkAttributes;
    cosmetics: CharacterCosmeticLoadout;
  };
  slots: Slot[];
  items: InventoryItem[];
  cosmetics: CosmeticCatalogItem[];
  currentPowerTotal: number;
}) {
  const [view, setView] = useState<
    "all" | "bag" | "storage" | "equipped" | "rewards" | "cosmetics"
  >("bag");
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const activeSlot = slots.find((slot) => slot.key === activeSlotKey) ?? null;
  const activeSlotItem = activeSlot
    ? (items.find((item) => item.id === activeSlot.itemId) ?? null)
    : null;
  const compatibleItems = useMemo(
    () =>
      activeSlot
        ? items
            .filter(
              (item) =>
                item.location === "bag" &&
                (item.compatibleSlots.includes(activeSlot.key) ||
                  item.equippedSlots.includes(activeSlot.key)),
            )
            .sort((left, right) => {
              const leftEquipped = left.id === activeSlot.itemId ? 1 : 0;
              const rightEquipped = right.id === activeSlot.itemId ? 1 : 0;
              return rightEquipped - leftEquipped || left.name.localeCompare(right.name, "pt-BR");
            })
        : [],
    [activeSlot, items],
  );
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (view === "bag"
            ? item.location === "bag" && !item.equippedSlot
            : view === "storage"
              ? item.location === "storage"
              : view === "equipped"
                ? Boolean(item.equippedSlot)
                : view === "rewards"
                  ? item.slot === "title"
                  : true) &&
          (!slotFilter ||
            item.compatibleSlots.includes(slotFilter) ||
            item.equippedSlot === slotFilter) &&
          (!search ||
            `${item.name} ${item.description}`
              .toLocaleLowerCase("pt-BR")
              .includes(search.toLocaleLowerCase("pt-BR"))),
      ),
    [items, search, slotFilter, view],
  );
  const occupied = slots.filter((slot) => slot.itemId).length;
  const selectedPower = selected ? itemPower(selected.attributes) : 0;
  const comparisonItems =
    selected && !selected.equippedSlot
      ? selected.twoHanded &&
        selected.compatibleSlots.some((slot) => slot === "main_weapon" || slot === "off_weapon")
        ? [
            ...new Map(
              items
                .filter((item) =>
                  item.equippedSlots.some(
                    (slot) => slot === "main_weapon" || slot === "off_weapon",
                  ),
                )
                .map((item) => [item.id, item]),
            ).values(),
          ]
        : items
            .filter((item) =>
              item.equippedSlots.some((slot) => selected.compatibleSlots.includes(slot)),
            )
            .sort((left, right) => itemPower(left.attributes) - itemPower(right.attributes))
            .slice(0, 1)
      : [];
  const comparisonAttributeSets = comparisonItems.flatMap((item) =>
    Array.from(
      { length: selected?.twoHanded ? equippedItemCopies(item) : 1 },
      () => item.attributes,
    ),
  );
  const selectedPowerDelta = selected
    ? itemPowerDelta(selected.attributes, comparisonAttributeSets)
    : 0;
  useEffect(() => {
    if (!activeSlotKey) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveSlotKey(null);
    };
    document.body.classList.add("has-equipment-modal");
    window.addEventListener("keydown", close);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.classList.remove("has-equipment-modal");
      window.removeEventListener("keydown", close);
    };
  }, [activeSlotKey]);

  const selectSlot = (slot: Slot) => {
    setActiveSlotKey(slot.key);
    const candidate =
      items.find((item) => item.id === slot.itemId) ??
      items.find((item) => item.compatibleSlots.includes(slot.key));
    if (candidate) setSelectedId(candidate.id);
  };

  const renderSlot = (slot: Slot) => {
    const item = items.find((entry) => entry.id === slot.itemId);
    return (
      <button
        className={`${slot.itemId ? "is-equipped" : ""} ${slot.reserved ? "is-reserved" : ""}`}
        data-rarity={item?.rarity}
        key={slot.key}
        onClick={() => selectSlot(slot)}
        type="button"
      >
        <span className="arsenal-slot-art" aria-hidden="true">
          {item?.imageUrl ? (
            <ItemArtwork
              imageUrl={item.imageUrl}
              name={item.name}
              rarity={item.rarity}
              slot={item.slot}
            />
          ) : (
            <ItemGlyph slot={slot.key} />
          )}
        </span>
        <span>
          <small>{slot.label}</small>
          <strong>{item?.name ?? "Espaço livre"}</strong>
          {item ? <em>{item.rarityLabel}</em> : null}
          {slot.reserved ? <em>Reservado por arma de duas mãos</em> : null}
        </span>
      </button>
    );
  };

  return (
    <div className="arsenal-shell">
      <section className="arsenal-loadout">
        <header className="arsenal-loadout-heading">
          <div>
            <span className="eyebrow">Equipado</span>
            <h3>{character.name}</h3>
          </div>
          <span className="arsenal-loadout-heading__count">
            {occupied}/{slots.length}
          </span>
        </header>

        <p className="arsenal-loadout__hint">Selecione um espaço para trocar o item.</p>
        <div className="arsenal-slot-column">{slots.map(renderSlot)}</div>

        <footer className="inventory-loadout-summary">
          <div className="inventory-loadout-summary__power">
            <span>Poder Total</span>
            <strong>{currentPowerTotal.toLocaleString("pt-BR")}</strong>
          </div>
          <div className="inventory-loadout-summary__wallet">
            <span>Carteira</span>
            <strong>◆ {character.gold.toLocaleString("pt-BR")} WG</strong>
          </div>
        </footer>
      </section>

      <section className="arsenal-browser">
        <div className="arsenal-catalog">
          <header>
            <div>
              <span className="eyebrow">Inventário</span>
              <h3>Seus itens</h3>
            </div>
            <nav aria-label="Local dos itens">
              <button
                className={view === "bag" ? "is-active" : ""}
                onClick={() => {
                  setView("bag");
                  setSelectedId("");
                }}
                type="button"
              >
                Mochila
              </button>
              <button
                className={view === "storage" ? "is-active" : ""}
                onClick={() => {
                  setView("storage");
                  setSelectedId("");
                }}
                type="button"
              >
                Armazém
              </button>
              <button
                className={view === "cosmetics" ? "is-active" : ""}
                onClick={() => {
                  setView("cosmetics");
                  setSelectedId("");
                }}
                type="button"
              >
                Cosméticos
              </button>
            </nav>
          </header>

          {view === "cosmetics" ? (
            <div className="arsenal-cosmetics">
              <div className="arsenal-cosmetics__intro">
                <span className="eyebrow">Guarda-roupa mágico</span>
                <h3>Seus cosméticos</h3>
                <p>Ative aqui as peças que já foram adicionadas ao inventário deste personagem.</p>
              </div>
              {cosmetics.length ? (
                <div className="arsenal-cosmetics__grid">
                  {cosmetics.map((cosmetic) => {
                    const active = character.cosmetics[cosmetic.slot] === cosmetic.key;
                    return (
                      <article key={cosmetic.id} data-rarity={cosmetic.rarity}>
                        <div className="arsenal-cosmetics__preview">
                          <CharacterPortraitCard
                            imageUrl={character.imageUrl}
                            level={character.level}
                            name={character.name}
                            rank={character.rank}
                            title={null}
                            variant="compact"
                            cosmetics={{
                              card: cosmetic.slot === "card" ? cosmetic.key : null,
                              aura: cosmetic.slot === "aura" ? cosmetic.key : null,
                              border: cosmetic.slot === "border" ? cosmetic.key : null,
                            }}
                          />
                        </div>
                        <small>
                          {cosmetic.collectionName} ·{" "}
                          {cosmetic.slot === "border"
                            ? "Borda"
                            : cosmetic.slot === "aura"
                              ? "Aura"
                              : "Card"}
                        </small>
                        <h4>{cosmetic.name}</h4>
                        <p>{cosmetic.description}</p>
                        <form action={equipOwnedCosmeticAction.bind(null, character.id)}>
                          <input name="slot" type="hidden" value={cosmetic.slot} />
                          <input name="key" type="hidden" value={active ? "" : cosmetic.key} />
                          <button
                            className={`button ${active ? "button--dark" : "button--primary"}`}
                          >
                            {active ? "✓ Ativo · remover" : "Ativar cosmético"}
                          </button>
                        </form>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="arsenal-empty">
                  <strong>Nenhum cosmético neste inventário</strong>
                  <p>
                    Quando uma peça for adquirida ou concedida pela administração, ela aparecerá
                    aqui.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="arsenal-search">
                <label>
                  <span>⌕</span>
                  <input
                    placeholder="Pesquisar item"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                {slotFilter ? (
                  <button onClick={() => setSlotFilter("")} type="button">
                    Filtro: {slots.find((slot) => slot.key === slotFilter)?.label} ×
                  </button>
                ) : null}
                <small>{visible.length} itens</small>
              </div>

              {visible.length ? (
                <div className="arsenal-grid">
                  {visible.map((item) => (
                    <button
                      className={`arsenal-item-card ${item.id === selected?.id ? "is-selected" : ""} ${item.effects.length ? "has-effect" : ""}`}
                      data-rarity={item.rarity}
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      type="button"
                    >
                      <div>
                        <ItemArtwork
                          imageUrl={item.imageUrl}
                          name={item.name}
                          rarity={item.rarity}
                          slot={item.slot}
                        />
                        {item.quantity > 1 ? <b>×{item.quantity}</b> : null}
                      </div>
                      <small>
                        {item.rarityLabel} · {item.slotLabel}
                      </small>
                      <strong>{item.name}</strong>
                      <footer>
                        {item.equippedSlot ? (
                          <span>✓ Equipado</span>
                        ) : item.location === "storage" ? (
                          <span>No armazém</span>
                        ) : (
                          <span>Na mochila</span>
                        )}
                        <i>Detalhes</i>
                      </footer>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="arsenal-empty">
                  <ItemGlyph slot="necklace" />
                  <strong>Nenhum item neste filtro</strong>
                  <button
                    onClick={() => {
                      setSearch("");
                      setSlotFilter("");
                      setView("bag");
                    }}
                    type="button"
                  >
                    Mostrar todo o inventário
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {view !== "cosmetics" ? (
          <aside
            aria-hidden={!selected}
            aria-label="Detalhes do item"
            className={`arsenal-inspector ${selected ? "is-open" : ""}`}
          >
            {selected ? (
              <>
                <header>
                  <div>
                    <span>{selected.rarityLabel} · {selected.slotLabel}</span>
                    <h3>{selected.name}</h3>
                  </div>
                  <button
                    aria-label="Fechar detalhes do item"
                    className="arsenal-inspector__close"
                    onClick={() => setSelectedId("")}
                    type="button"
                  >
                    ×
                  </button>
                </header>
                <div className="arsenal-inspector__glyph">
                  <ItemArtwork
                    imageUrl={selected.imageUrl}
                    name={selected.name}
                    rarity={selected.rarity}
                    slot={selected.slot}
                  />
                </div>
                <p>{selected.description}</p>
                <dl>
                  {Object.entries(selected.attributes).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>+{value}</dd>
                    </div>
                  ))}
                </dl>
                <article>
                  <small>COMPARAÇÃO DE PODER</small>
                  <strong>{selectedPower.toLocaleString("pt-BR")} de Poder no item</strong>
                  <p>
                    {selected.equippedSlot
                      ? `Poder Total atual: ${currentPowerTotal.toLocaleString("pt-BR")}.`
                      : `${selectedPowerDelta >= 0 ? "+" : ""}${selectedPowerDelta} ao equipar · projeção ${Math.max(0, currentPowerTotal + selectedPowerDelta).toLocaleString("pt-BR")}.`}
                  </p>
                </article>
                {selected.effects.map((effect) => (
                  <article key={effect.key}>
                    <small>EFEITO ESPECIAL</small>
                    <strong>{effect.name}</strong>
                    <p>{effect.description}</p>
                  </article>
                ))}
                <footer>
                  {selected.equippedSlot ? (
                    <InventoryActionForm
                      key={selected.id}
                      action={unequipItemAction.bind(null, character.id)}
                    >
                      <input name="inventoryId" type="hidden" value={selected.id} />
                      <input name="slot" type="hidden" value={selected.equippedSlot} />
                      <button className="button button--dark">Desequipar</button>
                    </InventoryActionForm>
                  ) : selected.location === "bag" ? (
                    <InventoryActionForm
                      key={selected.id}
                      action={equipItemAction.bind(null, character.id)}
                    >
                      <input name="inventoryId" type="hidden" value={selected.id} />
                      <label>
                        <span>Equipar em</span>
                        <select name="slot" defaultValue={selected.compatibleSlots[0]}>
                          {selected.compatibleSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slots.find((entry) => entry.key === slot)?.label ?? slot}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="button button--primary">Equipar item</button>
                    </InventoryActionForm>
                  ) : (
                    <InventoryActionForm
                      action={setInventoryLocationAction.bind(null, character.id)}
                    >
                      <input name="inventoryId" type="hidden" value={selected.id} />
                      <input name="location" type="hidden" value="bag" />
                      <button className="button button--primary">Mover para mochila</button>
                    </InventoryActionForm>
                  )}
                  {!selected.equippedSlot && selected.location === "bag" ? (
                    <InventoryActionForm
                      action={setInventoryLocationAction.bind(null, character.id)}
                    >
                      <input name="inventoryId" type="hidden" value={selected.id} />
                      <input name="location" type="hidden" value="storage" />
                      <button className="button button--dark">Armazenar</button>
                    </InventoryActionForm>
                  ) : null}
                  {!selected.equippedSlot && selected.slot !== "title" && selected.price > 0 ? (
                    <InventoryActionForm
                      key={selected.id}
                      action={sellInventoryItemAction.bind(null, character.id)}
                      confirmation={{
                        title: "Confirmar venda",
                        description: `Vender ${selected.name} por ${Math.floor(selected.price / 3).toLocaleString("pt-BR")} WG? O item será removido do inventário.`,
                        confirmLabel: "Vender item",
                      }}
                    >
                      <input name="inventoryId" type="hidden" value={selected.id} />
                      <button className="button button--danger">
                        Vender por {Math.floor(selected.price / 3).toLocaleString("pt-BR")} WG
                      </button>
                    </InventoryActionForm>
                  ) : null}
                </footer>
              </>
            ) : null}
          </aside>
        ) : null}
      </section>

      {activeSlot && typeof document !== "undefined"
        ? createPortal(
            <div
              className="equipment-modal"
              role="presentation"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) setActiveSlotKey(null);
              }}
            >
              <section
                aria-labelledby="equipment-modal-title"
                aria-modal="true"
                className="equipment-modal__dialog"
                role="dialog"
              >
                <header className="equipment-modal__header">
                  <div>
                    <span className="eyebrow">Escolher equipamento</span>
                    <h3 id="equipment-modal-title">{activeSlot.label}</h3>
                    <p>
                      {activeSlotItem
                        ? `${activeSlotItem.name} está equipado neste espaço.`
                        : `Escolha um dos ${compatibleItems.length} itens compatíveis da mochila.`}
                    </p>
                  </div>
                  <button
                    aria-label="Fechar seleção de equipamento"
                    onClick={() => setActiveSlotKey(null)}
                    ref={closeButtonRef}
                    type="button"
                  >
                    ×
                  </button>
                </header>

                {activeSlot.reserved && activeSlotItem ? (
                  <div className="equipment-modal__two-handed">
                    <ItemArtwork
                      name={activeSlotItem.name}
                      rarity={activeSlotItem.rarity}
                      slot={activeSlotItem.slot}
                    />
                    <span>
                      <strong>Espaço reservado por arma de duas mãos</strong>
                      <small>
                        Equipar outra arma aqui substituirá {activeSlotItem.name} e liberará os dois
                        espaços.
                      </small>
                    </span>
                  </div>
                ) : null}

                <div className="equipment-modal__list">
                  {compatibleItems.length ? (
                    compatibleItems.map((item) => {
                      const equippedHere = item.equippedSlots.includes(activeSlot.key);
                      const equippedElsewhere = item.equippedSlots.length > 0 && !equippedHere;
                      const availableCopies = item.quantity - item.equippedSlots.length;
                      return (
                        <article
                          className={equippedHere ? "is-equipped" : ""}
                          data-rarity={item.rarity}
                          key={item.id}
                        >
                          <div className="equipment-modal__glyph">
                            <ItemArtwork
                              imageUrl={item.imageUrl}
                              name={item.name}
                              rarity={item.rarity}
                              slot={item.slot}
                            />
                            {item.quantity > 1 ? <b>×{item.quantity}</b> : null}
                          </div>
                          <div className="equipment-modal__item-copy">
                            <small>
                              {item.rarityLabel} · {item.twoHanded ? "Duas mãos" : item.slotLabel}
                            </small>
                            <strong>{item.name}</strong>
                            <p>{item.description}</p>
                            <div>
                              {Object.entries(item.attributes).map(([key, value]) => (
                                <span key={key}>
                                  {key} <b>+{value}</b>
                                </span>
                              ))}
                              {item.effects.map((effect) => (
                                <span
                                  className="is-effect"
                                  key={effect.key}
                                  title={effect.description}
                                >
                                  ✦ {effect.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="equipment-modal__action">
                            {equippedHere ? (
                              <>
                                <span>✓ Equipado</span>
                                <InventoryActionForm
                                  action={unequipItemAction.bind(null, character.id)}
                                >
                                  <input name="inventoryId" type="hidden" value={item.id} />
                                  <input name="slot" type="hidden" value={activeSlot.key} />
                                  <button className="button button--dark">Desequipar</button>
                                </InventoryActionForm>
                              </>
                            ) : (
                              <InventoryActionForm
                                action={equipItemAction.bind(null, character.id)}
                              >
                                <input name="inventoryId" type="hidden" value={item.id} />
                                <input name="slot" type="hidden" value={activeSlot.key} />
                                {equippedElsewhere ? (
                                  <small>
                                    {availableCopies > 0
                                      ? `${availableCopies} cópia disponível`
                                      : `Em ${item.equippedSlots.map((key) => slots.find((slot) => slot.key === key)?.label).join(" e ")}`}
                                  </small>
                                ) : null}
                                <button className="button button--primary">
                                  {availableCopies > 0
                                    ? "Equipar outra cópia"
                                    : equippedElsewhere
                                      ? "Mover para cá"
                                      : "Equipar"}
                                </button>
                              </InventoryActionForm>
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="arsenal-empty">
                      <ItemGlyph slot={activeSlot.key} />
                      <strong>
                        Nenhum {activeSlot.label.toLocaleLowerCase("pt-BR")} na mochila
                      </strong>
                      <p>
                        {activeSlot.key === "title"
                          ? "Títulos são concedidos exclusivamente pela administração."
                          : "Visite a Loja para encontrar um equipamento compatível."}
                      </p>
                    </div>
                  )}
                </div>

                <footer className="equipment-modal__footer">
                  <span>{compatibleItems.length} itens compatíveis</span>
                  <button className="button button--dark" onClick={() => setActiveSlotKey(null)}>
                    Voltar ao inventário
                  </button>
                </footer>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
