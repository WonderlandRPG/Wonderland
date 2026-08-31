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

const halloween2026Cosmetics = [
  {
    type: "Card animado",
    name: "Noite do Véu Partido",
    tag: "Lendário • Animado",
    description:
      "Duas cortinas espectrais rasgadas respiram nas laterais do retrato, como se o personagem estivesse atravessando o véu entre os mundos. Luz fria, brasas discretas e névoa baixa criam profundidade sem cobrir o rosto.",
    highlights: ["Véus laterais rasgados", "Retrato preservado", "Luz espectral", "Névoa e brasas discretas"],
    preview: "card",
    key: "noite-veu-partido",
  },
  {
    type: "Aura animada",
    name: "Cortejo dos Fogos-Fátuos",
    tag: "Mítico • Animado",
    description:
      "Cinco pequenos espíritos, com rostos, corpos e caudas reconhecíveis, formam uma procissão dentro do retrato. Eles percorrem um circuito lento e coordenado sem escapar das bordas nem cobrir permanentemente o personagem.",
    highlights: ["5 fantasmas reconhecíveis", "Procissão interna", "Movimento coordenado", "Sem efeitos recortados"],
    preview: "aura",
    key: "cortejo-fogos-fatuos",
  },
  {
    type: "Borda",
    name: "Trono do Rei Oco",
    tag: "Mítico • Borda",
    description:
      "Uma moldura régia de madeira carbonizada e ferro antigo, coroada pelo elmo quebrado do Rei Oco. Abóboras ritualísticas, lanternas espectrais e filigranas em ouro envelhecido cercam o retrato sem esconder sua arte.",
    highlights: ["Coroa oca central", "Abóboras ritualísticas", "Chamas espectrais", "PNG transparente em alta definição"],
    preview: "border",
    key: "trono-rei-oco",
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
  const pageSize = 15;
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
  const affordableCount = filtered.filter((item) => item.price <= gold).length;
  const buildMatches = filtered.filter((item) => item.recommendedClasses.length > 0).length;
  const remainingGold = gold - cartTotal;
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
              <span>HALLOWEEN 2026 • COLEÇÃO LIMITADA</span>
              <h2>Véspera do Rei Oco</h2>
              <p>
                Na última noite de outubro, a coroa vazia volta a arder e os fogos-fátuos escolhem
                novos nomes para conduzir pelo véu. Uma coleção criada como um conjunto visual único,
                sem conceder qualquer vantagem de combate.
              </p>
            </div>
            <aside>
              <small>ACESSO DE PRÉVIA</small>
              <strong>Somente Administração</strong>
              <span>Venda aos jogadores ainda bloqueada</span>
            </aside>
          </header>

          <div className="cosmetics-grid">
            {halloween2026Cosmetics.map((cosmetic) => (
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
                    <strong>Véspera do Rei Oco</strong>
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
              <h3>Regalia do Rei Oco</h3>
              <p>
                Card + Aura + Borda formam a identidade completa da coleção. Os três cosméticos
                são independentes e podem ser combinados, criando a apresentação máxima da
                coleção Véspera do Rei Oco — Halloween 2026.
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
      <section className="shop-intelligence" aria-label="Resumo do mercado">
        <div><small>Resultados</small><strong>{filtered.length}</strong><span>itens encontrados</span></div>
        <div><small>Ao seu alcance</small><strong>{affordableCount}</strong><span>cabem na carteira</span></div>
        <div><small>Com recomendação</small><strong>{buildMatches}</strong><span>possuem indicação de classe</span></div>
        <div data-negative={remainingGold < 0 ? "true" : undefined}><small>Saldo após carrinho</small><strong>{remainingGold.toLocaleString("pt-BR")}</strong><span>WG projetado</span></div>
      </section>
      <div className="shop-browser">
        <section>
          <header className="shop-browser__result">
            <strong>{filtered.length} equipamentos</strong>
            <span>Exibindo {visible.length} · página {currentPage} de {pageCount}</span>
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
