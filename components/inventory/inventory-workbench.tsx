"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  equipItemAction,
  sellInventoryItemAction,
  unequipItemAction,
} from "@/app/personagens/[id]/equipment-actions";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { ItemGlyph } from "@/components/items/item-glyph";
import { ItemArtwork } from "@/components/items/item-artwork";

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
}: {
  character: { id: string; name: string; imageUrl: string | null; rank: string; level: number };
  slots: Slot[];
  items: InventoryItem[];
}) {
  const [view, setView] = useState<"all" | "bag" | "equipped" | "rewards">("all");
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
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
                item.compatibleSlots.includes(activeSlot.key) ||
                item.equippedSlots.includes(activeSlot.key),
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
            ? !item.equippedSlot
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
  const equippedTitle = items.find((item) => item.equippedSlot === "title") ?? null;
  const equippedTitleData = equippedTitle
    ? {
        name: equippedTitle.name,
        rarity: equippedTitle.rarity,
        titleStyle: equippedTitle.titleStyle,
      }
    : null;

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

  // 7 espaços de cada lado do card oficial do personagem.
  const leftSlotKeys = new Set(["head", "torso", "hands", "legs", "feet", "cape", "necklace"]);

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
        <span className="inventory-slot-art" aria-hidden="true">
          {item?.imageUrl ? (
            <ItemArtwork imageUrl={item.imageUrl} name={item.name} rarity={item.rarity} slot={item.slot} />
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
    <div className="inventory-command">
      <section className="inventory-command__loadout">
        <header className="inventory-loadout-heading">
          <div>
            <span className="eyebrow">Conjunto equipado</span>
            <h3>Espaços de combate</h3>
          </div>
          <small>Clique em um espaço para trocar o equipamento.</small>
        </header>

        <div className="inventory-slot-column is-left">
          {slots.filter((slot) => leftSlotKeys.has(slot.key)).map(renderSlot)}
        </div>

        <aside className="inventory-character-card is-centered has-official-character-card">
          <CharacterPortraitCard
            imageUrl={character.imageUrl}
            level={character.level}
            name={character.name}
            rank={character.rank}
            title={equippedTitleData}
            variant="inventory"
          />
          <div className="inventory-character-card__caption">
            <strong>{character.name}</strong>
            <small>{occupied} / {slots.length} espaços ocupados</small>
          </div>
        </aside>

        <div className="inventory-slot-column is-right">
          {slots.filter((slot) => !leftSlotKeys.has(slot.key)).map(renderSlot)}
        </div>
      </section>

      <section className="inventory-browser">
        <div className="inventory-browser__catalog">
          <header>
            <div>
              <span className="eyebrow">Inventário</span>
              <h3>Mochila e equipamentos</h3>
            </div>
            <nav>
              <button className={view === "all" ? "is-active" : ""} onClick={() => setView("all")} type="button">Todos</button>
              <button className={view === "bag" ? "is-active" : ""} onClick={() => setView("bag")} type="button">Mochila</button>
              <button className={view === "equipped" ? "is-active" : ""} onClick={() => setView("equipped")} type="button">Equipados</button>
              <button className={view === "rewards" ? "is-active" : ""} onClick={() => setView("rewards")} type="button">Recompensas ADM</button>
            </nav>
          </header>

          <div className="inventory-search">
            <label>
              <span>⌕</span>
              <input placeholder="Pesquisar item" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            {slotFilter ? (
              <button onClick={() => setSlotFilter("")} type="button">
                Filtro: {slots.find((slot) => slot.key === slotFilter)?.label} ×
              </button>
            ) : null}
            <small>{visible.length} itens</small>
          </div>

          {visible.length ? (
            <div className="inventory-classic-grid">
              {visible.map((item) => (
                <button
                  className={`inventory-classic-card ${item.id === selected?.id ? "is-selected" : ""} ${item.effects.length ? "has-effect" : ""}`}
                  data-rarity={item.rarity}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <div>
                    <ItemArtwork imageUrl={item.imageUrl} name={item.name} rarity={item.rarity} slot={item.slot} />
                    {item.quantity > 1 ? <b>×{item.quantity}</b> : null}
                  </div>
                  <small>{item.rarityLabel} · {item.slotLabel}</small>
                  <strong>{item.name}</strong>
                  {item.slot === "title" ? <em className="inventory-reward-tag">Presente ADM</em> : null}
                  {item.effects.slice(0, 1).map((effect) => (
                    <span className="inventory-card-effect" key={effect.key}>
                      ✦ {effect.name}<small>{effect.description}</small>
                    </span>
                  ))}
                  <footer>
                    {item.equippedSlot ? <span>✓ Equipado</span> : <span>Na mochila</span>}
                    <i>Ver detalhes</i>
                  </footer>
                </button>
              ))}
            </div>
          ) : (
            <div className="inventory-empty">
              <ItemGlyph slot="necklace" />
              <strong>Nenhum item neste filtro</strong>
              <button
                onClick={() => {
                  setSearch("");
                  setSlotFilter("");
                  setView("all");
                }}
                type="button"
              >
                Mostrar todo o inventário
              </button>
            </div>
          )}
        </div>

        <aside className="inventory-inspector">
          {selected ? (
            <>
              <header>
                <span>{selected.rarityLabel} · {selected.slotLabel}</span>
                <h3>{selected.name}</h3>
                {selected.equippedSlot ? (
                  <b>Equipado em {slots.find((slot) => slot.key === selected.equippedSlot)?.label}</b>
                ) : (
                  <b>Disponível na mochila</b>
                )}
              </header>
              <div className="inventory-inspector__glyph">
                <ItemArtwork imageUrl={selected.imageUrl} name={selected.name} rarity={selected.rarity} slot={selected.slot} />
              </div>
              <p>{selected.description}</p>
              <dl>
                {Object.entries(selected.attributes).map(([key, value]) => (
                  <div key={key}><dt>{key}</dt><dd>+{value}</dd></div>
                ))}
              </dl>
              {selected.effects.map((effect) => (
                <article key={effect.key}>
                  <small>EFEITO ESPECIAL</small>
                  <strong>{effect.name}</strong>
                  <p>{effect.description}</p>
                </article>
              ))}
              <footer>
                {selected.equippedSlot ? (
                  <form action={unequipItemAction.bind(null, character.id)}>
                    <input name="inventoryId" type="hidden" value={selected.id} />
                    <button className="button button--dark">Desequipar</button>
                  </form>
                ) : (
                  <form action={equipItemAction.bind(null, character.id)}>
                    <input name="inventoryId" type="hidden" value={selected.id} />
                    <label>
                      <span>Equipar em</span>
                      <select name="slot" defaultValue={selected.compatibleSlots[0]}>
                        {selected.compatibleSlots.map((slot) => (
                          <option key={slot} value={slot}>{slots.find((entry) => entry.key === slot)?.label ?? slot}</option>
                        ))}
                      </select>
                    </label>
                    <button className="button button--primary">Equipar item</button>
                  </form>
                )}
                {!selected.equippedSlot && selected.slot !== "title" && selected.price > 0 ? (
                  <form action={sellInventoryItemAction.bind(null, character.id)}>
                    <input name="inventoryId" type="hidden" value={selected.id} />
                    <button className="button button--danger">Vender por {Math.floor(selected.price / 3).toLocaleString("pt-BR")} WG</button>
                  </form>
                ) : null}
              </footer>
            </>
          ) : (
            <div className="inventory-empty">
              <strong>Selecione um item</strong>
              <p>Os atributos e ações aparecerão aqui.</p>
            </div>
          )}
        </aside>
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
                  <button aria-label="Fechar seleção de equipamento" onClick={() => setActiveSlotKey(null)} ref={closeButtonRef} type="button">×</button>
                </header>

                {activeSlot.reserved && activeSlotItem ? (
                  <div className="equipment-modal__two-handed">
                    <ItemArtwork name={activeSlotItem.name} rarity={activeSlotItem.rarity} slot={activeSlotItem.slot} />
                    <span>
                      <strong>Espaço reservado por arma de duas mãos</strong>
                      <small>Equipar outra arma aqui substituirá {activeSlotItem.name} e liberará os dois espaços.</small>
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
                        <article className={equippedHere ? "is-equipped" : ""} data-rarity={item.rarity} key={item.id}>
                          <div className="equipment-modal__glyph">
                            <ItemArtwork imageUrl={item.imageUrl} name={item.name} rarity={item.rarity} slot={item.slot} />
                            {item.quantity > 1 ? <b>×{item.quantity}</b> : null}
                          </div>
                          <div className="equipment-modal__item-copy">
                            <small>{item.rarityLabel} · {item.twoHanded ? "Duas mãos" : item.slotLabel}</small>
                            <strong>{item.name}</strong>
                            <p>{item.description}</p>
                            <div>
                              {Object.entries(item.attributes).map(([key, value]) => (
                                <span key={key}>{key} <b>+{value}</b></span>
                              ))}
                              {item.effects.map((effect) => (
                                <span className="is-effect" key={effect.key} title={effect.description}>✦ {effect.name}</span>
                              ))}
                            </div>
                          </div>
                          <div className="equipment-modal__action">
                            {equippedHere ? (
                              <>
                                <span>✓ Equipado</span>
                                <form action={unequipItemAction.bind(null, character.id)}>
                                  <input name="inventoryId" type="hidden" value={item.id} />
                                  <input name="slot" type="hidden" value={activeSlot.key} />
                                  <button className="button button--dark">Desequipar</button>
                                </form>
                              </>
                            ) : (
                              <form action={equipItemAction.bind(null, character.id)}>
                                <input name="inventoryId" type="hidden" value={item.id} />
                                <input name="slot" type="hidden" value={activeSlot.key} />
                                {equippedElsewhere ? <small>{availableCopies > 0 ? `${availableCopies} cópia disponível` : `Em ${item.equippedSlots.map((key) => slots.find((slot) => slot.key === key)?.label).join(" e ")}`}</small> : null}
                                <button className="button button--primary">{availableCopies > 0 ? "Equipar outra cópia" : equippedElsewhere ? "Mover para cá" : "Equipar"}</button>
                              </form>
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="inventory-empty">
                      <ItemGlyph slot={activeSlot.key} />
                      <strong>Nenhum {activeSlot.label.toLocaleLowerCase("pt-BR")} na mochila</strong>
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
                  <button className="button button--dark" onClick={() => setActiveSlotKey(null)}>Voltar ao inventário</button>
                </footer>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
