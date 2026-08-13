"use client";

import { useMemo, useState } from "react";
import { ItemGlyph } from "@/components/items/item-glyph";
import { ShopBuyButton } from "@/components/shop/shop-buy-button";
import { buyCart, buyItem } from "@/app/loja/actions";

export type ShopCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string | null;
  slot: string;
  slotLabel: string;
  rarity: string;
  rarityLabel: string;
  attributes: Record<string, number>;
  effects: Array<{ key: string; name: string; description: string }>;
  twoHanded: boolean;
};

const rarityTabs = [
  ["", "Todos"],
  ["common", "Comum"],
  ["uncommon", "Incomum"],
  ["rare", "Raro"],
  ["epic", "Épico"],
  ["legendary", "Lendário"],
  ["mythic", "Mítico"],
] as const;
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function ShopCatalog({ items, gold }: { items: ShopCatalogItem[]; gold: number }) {
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("");
  const [slot, setSlot] = useState("");
  const [order, setOrder] = useState("featured");
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<string[]>([]);
  const pageSize = 18;
  const slots = useMemo(
    () =>
      [...new Map(items.map((item) => [item.slot, item.slotLabel])).entries()].sort((a, b) =>
        a[1].localeCompare(b[1], "pt-BR"),
      ),
    [items],
  );
  const filtered = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (!search ||
              normalize(`${item.name} ${item.category} ${item.description}`).includes(
                normalize(search),
              )) &&
            (!rarity || item.rarity === rarity) &&
            (!slot || item.slot === slot),
        )
        .sort((a, b) =>
          order === "price-asc"
            ? a.price - b.price
            : order === "price-desc"
              ? b.price - a.price
              : order === "name"
                ? a.name.localeCompare(b.name, "pt-BR")
                : 0,
        ),
    [items, order, rarity, search, slot],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const cartItems = cart
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is ShopCatalogItem => Boolean(item));
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);
  const addToCart = (id: string) => setCart((current) => [...current, id]);
  const removeFromCart = (index: number) =>
    setCart((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const clear = () => {
    setSearch("");
    setRarity("");
    setSlot("");
    setOrder("featured");
    setPage(1);
  };

  return (
    <>
      <section className="shop-controls" aria-label="Filtros da loja">
        <nav>
          {rarityTabs.map(([key, label]) => (
            <button
              className={rarity === key ? "is-active" : ""}
              data-rarity={key || undefined}
              key={key || "all"}
              onClick={() => {
                setRarity(key);
                setPage(1);
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
        <div>
          <label className="shop-controls__search">
            <span>⌕</span>
            <input
              aria-label="Pesquisar item"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Pesquisar por nome ou descrição"
            />
          </label>
          <label>
            <span>Espaço</span>
            <select
              value={slot}
              onChange={(event) => {
                setSlot(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {slots.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Organizar</span>
            <select
              value={order}
              onChange={(event) => {
                setOrder(event.target.value);
                setPage(1);
              }}
            >
              <option value="featured">Destaques</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome A–Z</option>
            </select>
          </label>
          {search || rarity || slot || order !== "featured" ? (
            <button className="shop-controls__clear" onClick={clear} type="button">
              Limpar
            </button>
          ) : null}
        </div>
      </section>
      <div className="shop-browser">
        <section>
          <header className="shop-browser__result">
            <strong>{filtered.length} equipamentos</strong>
            <span>Efeitos, atributos e raridade aparecem diretamente nos cards.</span>
          </header>
          {visible.length ? (
            <div className="classic-item-grid">
              {visible.map((item) => (
                <article
                  className={`classic-item-card ${item.effects.length ? "has-effect" : ""}`}
                  data-rarity={item.rarity}
                  key={item.id}
                >
                  <div className="classic-item-card__select">
                    <div className="classic-item-card__art">
                      {item.imageUrl ? (
                        <span
                          className="is-image"
                          style={{ backgroundImage: `url(${item.imageUrl})` }}
                        />
                      ) : (
                        <ItemGlyph slot={item.slot} />
                      )}
                      <small>{item.twoHanded ? "Duas mãos" : item.slotLabel}</small>
                    </div>
                    <div className="classic-item-card__body">
                      <span>{item.rarityLabel}</span>
                      <h2>{item.name}</h2>
                      <div className="classic-item-card__stats">
                        {Object.entries(item.attributes)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <b key={key}>
                              {key} <i>+{value}</i>
                            </b>
                          ))}
                      </div>
                      {item.effects.slice(0, 2).map((effect) => (
                        <article className="classic-item-card__effect" key={effect.key}>
                          <b>✦ {effect.name}</b><p>{effect.description}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                  <footer>
                    <strong>
                      {item.price.toLocaleString("pt-BR")} <small>WG</small>
                    </strong>
                    <form action={buyItem}>
                      <input name="itemId" type="hidden" value={item.id} />
                      <ShopBuyButton disabled={gold < item.price} itemName={item.name} compact />
                    </form>
                    <button
                      className="shop-add-cart"
                      onClick={() => addToCart(item.id)}
                      type="button"
                    >
                      + Carrinho
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <div className="market-empty">
              <ItemGlyph slot="necklace" />
              <h2>Nenhum equipamento encontrado</h2>
              <p>Limpe ou altere os filtros para consultar o restante do arsenal.</p>
              <button className="button button--dark" onClick={clear} type="button">
                Limpar filtros
              </button>
            </div>
          )}
          {pageCount > 1 ? (
            <nav className="shop-client-pagination" aria-label="Páginas da loja">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                ← Anterior
              </button>
              <span>
                Página {currentPage} de {pageCount}
              </span>
              <button
                disabled={currentPage === pageCount}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                type="button"
              >
                Próxima →
              </button>
            </nav>
          ) : null}
        </section>
        <aside className="shop-cart shop-cart--sidebar">
          <header>
            <div><span className="eyebrow">Seu carrinho</span><h2>{cart.length} item(ns)</h2></div>
            <strong>{cartTotal.toLocaleString("pt-BR")} WG</strong>
          </header>
          <small className="shop-cart__balance">Saldo disponível: {gold.toLocaleString("pt-BR")} WG</small>
          {cartItems.length ? (
            <>
              <div>
                {cartItems.map((item, index) => (
                  <button key={`${item.id}-${index}`} onClick={() => removeFromCart(index)} type="button">
                    <ItemGlyph slot={item.slot} />
                    <span>{item.name}<small>{item.price.toLocaleString("pt-BR")} WG</small></span>
                    <b>×</b>
                  </button>
                ))}
              </div>
              <form action={buyCart}>
                {cart.map((id, index) => (
                  <input name="itemId" type="hidden" value={id} key={`${id}-input-${index}`} />
                ))}
                <button className="button button--primary" disabled={cartTotal > gold}>
                  Comprar tudo · {cartTotal.toLocaleString("pt-BR")} WG
                </button>
              </form>
            </>
          ) : (
            <p>Seu carrinho está vazio. Adicione itens para finalizar tudo de uma vez.</p>
          )}
        </aside>
      </div>
    </>
  );
}
