import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { getShopItems } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { buyItem } from "./actions";
import { itemSlotEmoji, itemSlotLabel } from "@/lib/game/equipment";
import { attributesSchema } from "@/lib/game/schemas";
import { ShopBuyButton } from "@/components/shop/shop-buy-button";

const rarityLabels: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};
export const dynamic = "force-dynamic";
type ShopSearchParams = {
  busca?: string;
  categoria?: string;
  slot?: string;
  empunhadura?: string;
  disponibilidade?: string;
  ordem?: string;
  compra?: string;
};

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const { characterId } = await requireActiveCharacter("/loja");
  const [items, character, filters] = await Promise.all([
    getShopItems(),
    requireCharacterSheet(characterId),
    searchParams,
  ]);
  const categories = [...new Set(items.map((item) => item.category))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const slots = [...new Set(items.map((item) => item.slot))].sort((a, b) =>
    itemSlotLabel(a).localeCompare(itemSlotLabel(b), "pt-BR"),
  );
  const search = normalized(filters.busca?.trim() ?? "");
  const filteredItems = items
    .filter((item) => {
      const searchable = normalized(`${item.name} ${item.description} ${item.category}`);
      return (
        (!search || searchable.includes(search)) &&
        (!filters.categoria || item.category === filters.categoria) &&
        (!filters.slot || item.slot === filters.slot) &&
        (!filters.empunhadura ||
          (filters.empunhadura === "duas" ? item.two_handed : !item.two_handed)) &&
        (filters.disponibilidade !== "compraveis" || item.price <= character.gold)
      );
    })
    .sort((a, b) => {
      if (filters.ordem === "preco_maior") return b.price - a.price;
      if (filters.ordem === "nome") return a.name.localeCompare(b.name, "pt-BR");
      return a.price - b.price;
    });
  const hasFilters = Boolean(
    filters.busca ||
    filters.categoria ||
    filters.slot ||
    filters.empunhadura ||
    filters.disponibilidade ||
    filters.ordem,
  );
  return (
    <PortalShell
      eyebrow="Mercado real"
      title="Loja de Wonderland"
      description={`${character.name} possui ${character.gold.toLocaleString("pt-BR")} WG para comprar equipamentos.`}
    >
      {filters.compra ? (
        <div
          className={`shop-purchase-notice ${filters.compra === "sucesso" ? "is-success" : "is-error"}`}
          role="status"
        >
          <span>{filters.compra === "sucesso" ? "✓" : "!"}</span>
          <div>
            <strong>
              {filters.compra === "sucesso"
                ? "Item adquirido com sucesso"
                : filters.compra === "saldo"
                  ? "WG insuficiente"
                  : "Não foi possível concluir a compra"}
            </strong>
            <small>
              {filters.compra === "sucesso"
                ? `O item já está no inventário de ${character.name}.`
                : "Seu saldo não foi alterado. Tente novamente ou escolha outro item."}
            </small>
          </div>
        </div>
      ) : null}
      <section className="shop-filters" aria-labelledby="shop-filters-title">
        <header>
          <div>
            <span className="eyebrow">Localizar equipamentos</span>
            <h2 id="shop-filters-title">Filtros da loja</h2>
          </div>
          <strong>
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item encontrado" : "itens encontrados"}
          </strong>
        </header>
        <form action="/loja" method="get">
          <label className="shop-filters__search">
            <span>Buscar item</span>
            <input
              name="busca"
              type="search"
              defaultValue={filters.busca ?? ""}
              placeholder="Nome, descrição ou categoria"
            />
          </label>
          <label>
            <span>Categoria</span>
            <select name="categoria" defaultValue={filters.categoria ?? ""}>
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Slot</span>
            <select name="slot" defaultValue={filters.slot ?? ""}>
              <option value="">Todos</option>
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {itemSlotEmoji(slot)} {itemSlotLabel(slot)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Empunhadura</span>
            <select name="empunhadura" defaultValue={filters.empunhadura ?? ""}>
              <option value="">Todas</option>
              <option value="uma">Uma mão</option>
              <option value="duas">Duas mãos</option>
            </select>
          </label>
          <label>
            <span>Disponibilidade</span>
            <select name="disponibilidade" defaultValue={filters.disponibilidade ?? ""}>
              <option value="">Todos os preços</option>
              <option value="compraveis">Posso comprar agora</option>
            </select>
          </label>
          <label>
            <span>Ordenar</span>
            <select name="ordem" defaultValue={filters.ordem ?? "preco_menor"}>
              <option value="preco_menor">Menor preço</option>
              <option value="preco_maior">Maior preço</option>
              <option value="nome">Nome A–Z</option>
            </select>
          </label>
          <div className="shop-filters__actions">
            <button className="button button--primary" type="submit">
              Aplicar filtros
            </button>
            {hasFilters ? (
              <Link className="button button--glass" href="/loja">
                Limpar filtros
              </Link>
            ) : null}
          </div>
        </form>
      </section>
      <div className="portal-card-grid">
        {filteredItems.length ? (
          filteredItems.map((item) => {
            const parsed = attributesSchema.partial().safeParse(item.attributes);
            const attributes = parsed.success ? parsed.data : {};
            return (
              <article className="shop-item-card" key={item.id}>
                <div className="shop-item-card__art">
                  {item.image_url ? (
                    <span
                      className="is-image"
                      style={{ backgroundImage: `url(${item.image_url})` }}
                    />
                  ) : (
                    <span>{itemSlotEmoji(item.slot)}</span>
                  )}
                  <i>{item.two_handed ? "2M" : "1M"}</i>
                  <b>{itemSlotLabel(item.slot)}</b>
                </div>
                <div className="shop-item-card__body">
                  <small>
                    {rarityLabels[item.rarity] ?? item.rarity} · {itemSlotLabel(item.slot)}
                  </small>
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <div className="shop-item-card__stats">
                    {Object.entries(attributes).map(([key, value]) => (
                      <span key={key}>
                        <b>{key}</b> +{value}
                      </span>
                    ))}
                  </div>
                </div>
                <footer>
                  <div className="shop-item-card__price">
                    <strong>{item.price.toLocaleString("pt-BR")} WG</strong>
                    <small>
                      {character.gold >= item.price
                        ? `Restam ${(character.gold - item.price).toLocaleString("pt-BR")} WG`
                        : `Faltam ${(item.price - character.gold).toLocaleString("pt-BR")} WG`}
                    </small>
                  </div>
                  <form action={buyItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <ShopBuyButton disabled={character.gold < item.price} />
                  </form>
                </footer>
              </article>
            );
          })
        ) : (
          <div className="portal-empty">
            <span>⌕</span>
            <h2>Nenhum item encontrado</h2>
            <p>Altere ou limpe os filtros para visualizar outros equipamentos.</p>
            <Link className="button button--primary" href="/loja">
              Limpar filtros
            </Link>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
