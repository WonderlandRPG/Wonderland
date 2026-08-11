"use client";

import { useEffect, useMemo, useState } from "react";
import { equipItemAction, unequipItemAction } from "@/app/personagens/[id]/equipment-actions";
import { ItemGlyph } from "@/components/items/item-glyph";
import { RankBadge } from "@/components/characters/rank-badge";

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  rarity: string;
  rarityLabel: string;
  slot: string;
  slotLabel: string;
  quantity: number;
  equippedSlot: string | null;
  attributes: Record<string, number>;
  effects: Array<{ key: string; name: string; description: string }>;
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
  const [view, setView] = useState<"all" | "bag" | "equipped">("all");
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState("");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
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
  return (
    <div className="inventory-command">
      <section className="inventory-command__loadout">
        <aside className="inventory-character-card">
          <div
            className={character.imageUrl ? "is-image" : ""}
            style={
              character.imageUrl ? { backgroundImage: `url(${character.imageUrl})` } : undefined
            }
          >
            {character.imageUrl ? "" : character.name.slice(0, 2).toUpperCase()}
          </div>
          <RankBadge rank={character.rank} />
          <span>CONJUNTO ATIVO</span>
          <strong>{character.name}</strong>
          <small>
            {occupied} / {slots.length} espaços ocupados
          </small>
        </aside>
        <div className="inventory-slot-panel">
          <header>
            <div>
              <span className="eyebrow">Conjunto equipado</span>
              <h3>Espaços de combate</h3>
            </div>
            <small>Selecione um espaço para abrir seus equipamentos compatíveis.</small>
          </header>
          <div className="inventory-slot-grid">
            {slots.map((slot) => {
              const item = items.find((entry) => entry.id === slot.itemId);
              return (
                <button
                  className={`${slot.itemId ? "is-equipped" : ""} ${slot.reserved ? "is-reserved" : ""} ${slotFilter === slot.key ? "is-selected" : ""}`}
                  key={slot.key}
                  onClick={() => selectSlot(slot)}
                  type="button"
                >
                  <ItemGlyph slot={slot.key} />
                  <span>
                    <small>{slot.label}</small>
                    <strong>{item?.name ?? "Espaço livre"}</strong>
                    {slot.reserved ? <em>Reservado por arma de duas mãos</em> : null}
                  </span>
                  <i aria-hidden="true">›</i>
                </button>
              );
            })}
          </div>
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
                  className={`inventory-classic-card ${item.id === selected?.id ? "is-selected" : ""}`}
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
      {activeSlot ? (
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
                            <span className="is-effect" key={effect.key} title={effect.description}>
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
                  <strong>Nenhum {activeSlot.label.toLocaleLowerCase("pt-BR")} na mochila</strong>
                  <p>Visite a Loja para encontrar um equipamento compatível.</p>
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
        </div>
      ) : null}
    </div>
  );
}
