"use client";

import { useMemo, useState } from "react";
import { ItemGlyph } from "@/components/items/item-glyph";
import { ItemArtwork } from "@/components/items/item-artwork";
import { ShopBuyButton } from "@/components/shop/shop-buy-button";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { buyCart, buyItem } from "@/app/loja/actions";
import { setAdminCosmeticAction } from "@/app/loja/cosmetic-actions";
import type { CharacterCosmeticLoadout } from "@/lib/content/character-cosmetics";

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
  buildName: string | null;
  recommendedClasses: string[];
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

type ShopSection = "equipment" | "cosmetics";

const bloodyMoonCosmetics = [
  {
    type: "Card animado",
    name: "Epitáfio da Lua Carmesim",
    tag: "Lendário • Animado",
    description:
      "Um card de perfil vivo, cercado por lápides, névoa rasteira e uma lua de sangue pulsante. Corvos atravessam o céu em intervalos raros, velas funerárias tremulam nas bordas e o nome do personagem recebe um brilho carmesim que parece respirar.",
    highlights: ["Lua pulsante", "Névoa em movimento", "Corvos e velas", "Moldura funerária"],
    preview: "card",
    key: "epitafio-lua-carmesim",
  },
  {
    type: "Aura animada",
    name: "Procissão das Almas Rubras",
    tag: "Mítico • Animado",
    description:
      "Uma aura espectral para envolver o personagem. Almas rubras surgem aos pés, orbitam lentamente o corpo e se desfazem em cinzas; a cada ciclo, um eclipse carmesim se forma atrás do retrato e deixa um rastro sobrenatural.",
    highlights: ["Almas orbitais", "Cinzas flutuantes", "Eclipse espectral", "Pulso carmesim"],
    preview: "aura",
    key: "procissao-almas-rubras",
  },
  {
    type: "Borda",
    name: "Pórtico da Lua Sangrenta",
    tag: "Mítico • Borda",
    description:
      "Uma estrutura funerária independente que envolve o card sem substituir sua arte: ferro negro retorcido, espinhos, correntes, rosas rubras, crânios, velas e uma lua carmesim no topo. Pode ser combinada com Card e Aura.",
    highlights: ["Lua carmesim central", "Ferro, espinhos e correntes", "Crânios, rosas e velas", "Combina com Card + Aura"],
    preview: "border",
    key: "portico-lua-sangrenta",
  },
] as const;

export function ShopCatalog({
  items,
  gold,
  showCosmetics = false,
  previewCharacter,
}: {
  items: ShopCatalogItem[];
  gold: number;
  showCosmetics?: boolean;
  previewCharacter?: {
    name: string;
    imageUrl: string | null;
    rank: string;
    level: number;
    cosmetics: CharacterCosmeticLoadout;
  };
}) {
  const [section, setSection] = useState<ShopSection>("equipment");
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("");
  const [slot, setSlot] = useState("");
  const [recommendedClass, setRecommendedClass] = useState("");
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
  const recommendedClasses = useMemo(
    () =>
      [...new Set(items.flatMap((item) => item.recommendedClasses))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
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
            (!slot || item.slot === slot) &&
            (!recommendedClass || item.recommendedClasses.includes(recommendedClass)),
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
    [items, order, rarity, recommendedClass, search, slot],
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
    setRecommendedClass("");
    setOrder("featured");
    setPage(1);
  };

  return (
    <>
      {showCosmetics ? (
        <nav className="shop-departments" aria-label="Seções da loja">
          <button
            className={section === "equipment" ? "is-active" : ""}
            onClick={() => setSection("equipment")}
            type="button"
          >
            ⚔ Equipamentos
          </button>
          <button
            className={section === "cosmetics" ? "is-active is-cosmetic" : "is-cosmetic"}
            onClick={() => setSection("cosmetics")}
            type="button"
          >
            ✦ Cosméticos <small>ADM</small>
          </button>
        </nav>
      ) : null}

      {section === "cosmetics" && showCosmetics ? (
        <section className="cosmetics-preview" aria-label="Prévia administrativa de cosméticos">
          <header className="cosmetics-collection-hero">
            <div>
              <span>HALLOWEEN • COLEÇÃO LIMITADA</span>
              <h2>Cemitério da Lua Sangrenta</h2>
              <p>
                Quando a lua tinge as lápides de vermelho, os mortos de Wonderland não descansam.
                Uma coleção sombria criada para jogadores que querem transformar presença em
                espetáculo — sem conceder qualquer vantagem de combate.
              </p>
            </div>
            <aside>
              <small>ACESSO DE PRÉVIA</small>
              <strong>Somente Administração</strong>
              <span>Venda aos jogadores ainda bloqueada</span>
            </aside>
          </header>

          <div className="cosmetics-grid">
            {bloodyMoonCosmetics.map((cosmetic) => (
              <article className="cosmetic-card" data-preview={cosmetic.preview} key={cosmetic.name}>
                <header className="cosmetic-card__heading">
                  <div>
                    <small>{cosmetic.type}</small>
                    <h3>{cosmetic.name}</h3>
                  </div>
                  <b>{cosmetic.tag}</b>
                </header>
                <div className="cosmetic-compare">
                  <div className="cosmetic-compare__side">
                    <b>SEM COSMÉTICO</b>
                    <div className="cosmetic-compare__stage is-before">
                      {previewCharacter ? (
                        <CharacterPortraitCard
                          imageUrl={previewCharacter.imageUrl}
                          level={previewCharacter.level}
                          name={previewCharacter.name}
                          rank={previewCharacter.rank}
                          title={null}
                          cosmetics={{ card: null, aura: null, border: null }}
                          variant="standard"
                        />
                      ) : (
                        <span className="cosmetic-preview-placeholder">Sem personagem</span>
                      )}
                    </div>
                  </div>

                  <span className="cosmetic-compare__arrow" aria-hidden="true">→</span>

                  <div className="cosmetic-compare__side is-after">
                    <b>COM COSMÉTICO</b>
                    <div className={`cosmetic-compare__stage is-after is-${cosmetic.preview}`}>
                      {previewCharacter ? (
                        <div className={`cosmetic-character-demo is-${cosmetic.preview}`}>
                          <CharacterPortraitCard
                            imageUrl={previewCharacter.imageUrl}
                            level={previewCharacter.level}
                            name={previewCharacter.name}
                            rank={previewCharacter.rank}
                            title={null}
                            variant="standard"
                            cosmetics={{
                              card: cosmetic.preview === "card" ? cosmetic.key : null,
                              aura: cosmetic.preview === "aura" ? cosmetic.key : null,
                              border: cosmetic.preview === "border" ? cosmetic.key : null,
                            }}
                          />
                        </div>
                      ) : (
                        <span className="cosmetic-preview-placeholder">Sem personagem</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="cosmetic-card__body">
                  <p>{cosmetic.description}</p>
                  <ul>
                    {cosmetic.highlights.map((highlight) => (
                      <li key={highlight}>✦ {highlight}</li>
                    ))}
                  </ul>
                </div>
                <footer className="cosmetic-card__footer">
                  <div>
                    <span>Parte da coleção</span>
                    <strong>Cemitério da Lua Sangrenta</strong>
                  </div>
                  <form action={setAdminCosmeticAction}>
                    <input name="slot" type="hidden" value={cosmetic.preview} />
                    <input name="key" type="hidden" value={cosmetic.key} />
                    {previewCharacter?.cosmetics[cosmetic.preview] === cosmetic.key ? (
                      <>
                        <input name="remove" type="hidden" value="1" />
                        <button className="cosmetic-equip is-equipped" type="submit">
                          ✓ Equipado · Remover
                        </button>
                      </>
                    ) : (
                      <button className="cosmetic-equip" type="submit">
                        Equipar cosmético
                      </button>
                    )}
                  </form>
                </footer>
              </article>
            ))}
          </div>

          <aside className="cosmetics-bundle">
            <div>
              <small>CONJUNTO COMPLETO</small>
              <h3>Relíquia do Último Halloween</h3>
              <p>
                Card + Aura + Borda formam a identidade completa da coleção. Os três cosméticos
                são independentes e podem ser combinados, criando a apresentação máxima da
                coleção Cemitério da Lua Sangrenta.
              </p>
            </div>
            <strong>Preço ainda não definido</strong>
          </aside>
        </section>
      ) : (
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
            <span>Classe</span>
            <select
              value={recommendedClass}
              onChange={(event) => {
                setRecommendedClass(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas</option>
              {recommendedClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
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
          {search || rarity || slot || recommendedClass || order !== "featured" ? (
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
                        <ItemArtwork name={item.name} rarity={item.rarity} slot={item.slot} />
                      )}
                      <small>{item.twoHanded ? "Duas mãos" : item.slotLabel}</small>
                    </div>
                    <div className="classic-item-card__body">
                      <span>{item.rarityLabel}</span>
                      <h2>{item.name}</h2>
                      {item.buildName ? (
                        <small className="classic-item-card__build">Build: {item.buildName}</small>
                      ) : null}
                      <div className="classic-item-card__stats">
                        {Object.entries(item.attributes)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <b key={key}>
                              {key} <i>+{value}</i>
                            </b>
                          ))}
                      </div>
                      {item.recommendedClasses.length ? (
                        <p className="classic-item-card__classes">
                          Ideal para: {item.recommendedClasses.join(", ")}
                        </p>
                      ) : null}
                      {item.effects.slice(0, 2).map((effect) => (
                        <article className="classic-item-card__effect" key={effect.key}>
                          <b>✦ {effect.name}</b>
                          <p>{effect.description}</p>
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
            <div>
              <span className="eyebrow">Seu carrinho</span>
              <h2>{cart.length} item(ns)</h2>
            </div>
            <strong>{cartTotal.toLocaleString("pt-BR")} WG</strong>
          </header>
          <small className="shop-cart__balance">
            Saldo disponível: {gold.toLocaleString("pt-BR")} WG
          </small>
          {cartItems.length ? (
            <>
              <div>
                {cartItems.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    onClick={() => removeFromCart(index)}
                    type="button"
                  >
                    <ItemArtwork name={item.name} rarity={item.rarity} slot={item.slot} />
                    <span>
                      {item.name}
                      <small>{item.price.toLocaleString("pt-BR")} WG</small>
                    </span>
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
      )}
    </>
  );
}
