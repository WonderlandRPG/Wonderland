"use client";

import { useMemo, useState } from "react";
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
  const selected = items.find((item) => item.id === selectedId) ?? null;
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
  const selectSlot = (slot: Slot) => {
    setSlotFilter(slot.key);
    setView("all");
    const candidate =
      items.find((item) => item.id === slot.itemId) ??
      items.find((item) => !item.equippedSlot && item.compatibleSlots.includes(slot.key));
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
            <small>Selecione um espaço para filtrar equipamentos compatíveis.</small>
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
                  <i>›</i>
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
    </div>
  );
}
