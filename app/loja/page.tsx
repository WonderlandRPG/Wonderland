import { PlayerNav } from "@/components/player-nav";
import { ShopCatalog, type ShopCatalogItem } from "@/components/shop/shop-catalog";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { itemSlotLabel } from "@/lib/game/equipment";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";
import { getShopItems } from "@/lib/game/player-portal";
import { attributesSchema } from "@/lib/game/schemas";

const rarityLabels: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};
export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ compra?: string }>;
}) {
  const { characterId } = await requireActiveCharacter("/loja");
  const [rows, character, query] = await Promise.all([
    getShopItems(),
    requireCharacterSheet(characterId),
    searchParams,
  ]);
  const items: ShopCatalogItem[] = rows.map((item) => {
    const parsed = attributesSchema.partial().safeParse(item.attributes);
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      imageUrl: item.image_url,
      slot: item.slot,
      slotLabel: itemSlotLabel(item.slot),
      rarity: item.rarity,
      rarityLabel: rarityLabels[item.rarity] ?? item.rarity,
      attributes: parsed.success ? (parsed.data as Record<string, number>) : {},
      effects: parseItemSpecialEffects(item.special_effects),
      twoHanded: item.two_handed,
    };
  });
  return (
    <main className="market-page">
      <PlayerNav />
      <div className="page-container market-shell">
        <header className="market-hero">
          <div>
            <span className="eyebrow">Mercado dos cinco reinos</span>
            <h1>Arsenal de Wonderland</h1>
            <p>
              Escolha com calma, compare os atributos e prepare seu personagem para a próxima
              batalha.
            </p>
          </div>
          <aside>
            <small>Carteira de {character.name}</small>
            <strong>{character.gold.toLocaleString("pt-BR")} WG</strong>
            <span>{items.length} equipamentos no catálogo</span>
          </aside>
        </header>
        {query.compra ? (
          <div
            className={`shop-purchase-notice ${query.compra === "sucesso" ? "is-success" : "is-error"}`}
            role="status"
          >
            <span>{query.compra === "sucesso" ? "✓" : "!"}</span>
            <div>
              <strong>
                {query.compra === "sucesso"
                  ? "Item enviado para a mochila"
                  : query.compra === "saldo"
                    ? "WG insuficiente"
                    : "Compra não concluída"}
              </strong>
              <small>
                {query.compra === "sucesso"
                  ? `O equipamento já pode ser usado por ${character.name}.`
                  : "Nenhum WG foi descontado."}
              </small>
            </div>
          </div>
        ) : null}
        <ShopCatalog gold={character.gold} items={items} />
      </div>
    </main>
  );
}
