"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  equipItemAction,
  sellInventoryItemAction,
  unequipItemAction,
} from "@/app/personagens/[id]/equipment-actions";
import { ItemGlyph } from "@/components/items/item-glyph";
import { RankBadge } from "@/components/characters/rank-badge";

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
  character: { id: string; name: string; imageUrl: string | null; rank: string };
  slots: Slot[];
  items: InventoryItem[];
}) {
  const [view, setView] = useState<"all" | "bag" | "equipped" | "rewards">("all");
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
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
                item.equippedSlot === activeSlot.key,
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
  useEffect(() => {
    if (!activeSlotKey) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveSlotKey(null);
    };
    document.body.classList.add("has-equipment-modal");
    window.addEventListener("keydown", close);
    return () => {
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
  const leftSlotKeys = new Set(["head", "torso", "hands", "legs", "feet", "cape"]);
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
        <ItemGlyph slot={slot.key} />
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
          <div><span className="eyebrow">Conjunto equipado</span><h3>Espaços de combate</h3></div>
          <small>Clique em um espaço para trocar o equipamento.</small>
        </header>
        <div className="inventory-slot-column is-left">
          {slots.filter((slot) => leftSlotKeys.has(slot.key)).map(renderSlot)}
        </div>
        <aside className="inventory-character-card is-centered">
          <div
            className={character.imageUrl ? "is-image" : ""}
            style={
              character.imageUrl ? { backgroundImage: `url(${character.imageUrl})` } : undefined
            }
          >
            {character.imageUrl ? "" : character.name.slice(0, 2).toUpperCase()}
          </div>
          <RankBadge rank={character.rank} />
          {equippedTitle ? (
            <div
              className="character-equipped-title"
              data-title={equippedTitle.rarity}
              style={
                {
                  "--title-primary": equippedTitle.titleStyle?.primary ?? "#fff1b5",
                  "--title-secondary": equippedTitle.titleStyle?.secondary ?? "#1f7a4c",
                  "--title-glow": equippedTitle.titleStyle?.glow ?? "#d7ad45",
                } as CSSProperties
              }
            >
              ✦ {equippedTitle.name}
            </div>
          ) : null}
          <span>CONJUNTO ATIVO</span>
          <strong>{character.name}</strong>
          <small>
            {occupied} / {slots.length} espaços ocupados
          </small>
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
              <button
                className={view === "all" ? "is-active" : ""}
                onClick={() => setView("all")}
                type="button"
              >
                Todos
              </button>
              <button
                className={view === "bag" ? "is-active" : ""}
                onClick={() => setView("bag")}
                type="button"
              >
                Mochila
              </button>
              <button
                className={view === "equipped" ? "is-active" : ""}
                onClick={() => setView("equipped")}
                type="button"
              >
                Equipados
              </button>
              <button
                className={view === "rewards" ? "is-active" : ""}
                onClick={() => setView("rewards")}
                type="button"
              >
                Recompensas ADM
              </button>
            </nav>
          </header>
          <div className="inventory-search">
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
                    <ItemGlyph slot={item.slot} />
                    {item.quantity > 1 ? <b>×{item.quantity}</b> : null}
                  </div>
                  <small>
                    {item.rarityLabel} · {item.slotLabel}
                  </small>
                  <strong>{item.name}</strong>
                  {item.slot === "title" ? (
                    <em className="inventory-reward-tag">Presente ADM</em>
                  ) : null}
                  {item.effects.slice(0, 1).map((effect) => (
                    <span className="inventory-card-effect" key={effect.key}>✦ {effect.name}<small>{effect.description}</small></span>
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
                <span>
                  {selected.rarityLabel} · {selected.slotLabel}
                </span>
                <h3>{selected.name}</h3>
                {selected.equippedSlot ? (
                  <b>
                    Equipado em {slots.find((slot) => slot.key === selected.equippedSlot)?.label}
                  </b>
                ) : (
                  <b>Disponível na mochila</b>
                )}
              </header>
              <div className="inventory-inspector__glyph">
                <ItemGlyph slot={selected.slot} />
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
                          <option key={slot} value={slot}>
                            {slots.find((entry) => entry.key === slot)?.label ?? slot}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="button button--primary">Equipar item</button>
                  </form>
                )}
                {!selected.equippedSlot && selected.slot !== "title" && selected.price > 0 ? (
                  <form action={sellInventoryItemAction.bind(null, character.id)}>
                    <input name="inventoryId" type="hidden" value={selected.id} />
                    <button className="button button--danger">
                      Vender por {Math.floor(selected.price / 3).toLocaleString("pt-BR")} WG
                    </button>
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
      {mounted && activeSlot
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
                    type="button"
                  >
                    ×
                  </button>
                </header>
                {activeSlot.reserved && activeSlotItem ? (
                  <div className="equipment-modal__two-handed">
                    <ItemGlyph slot={activeSlotItem.slot} />
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
                      const equippedHere = item.id === activeSlot.itemId;
                      const equippedElsewhere = Boolean(item.equippedSlot && !equippedHere);
                      return (
                        <article
                          className={equippedHere ? "is-equipped" : ""}
                          data-rarity={item.rarity}
                          key={item.id}
                        >
                          <div className="equipment-modal__glyph">
                            <ItemGlyph slot={item.slot} />
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
                                <form action={unequipItemAction.bind(null, character.id)}>
                                  <input name="inventoryId" type="hidden" value={item.id} />
                                  <button className="button button--dark">Desequipar</button>
                                </form>
                              </>
                            ) : (
                              <form action={equipItemAction.bind(null, character.id)}>
                                <input name="inventoryId" type="hidden" value={item.id} />
                                <input name="slot" type="hidden" value={activeSlot.key} />
                                {equippedElsewhere ? (
                                  <small>
                                    Em {slots.find((slot) => slot.key === item.equippedSlot)?.label}
                                  </small>
                                ) : null}
                                <button className="button button--primary">
                                  {equippedElsewhere ? "Mover para cá" : "Equipar"}
                                </button>
                              </form>
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="inventory-empty">
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
