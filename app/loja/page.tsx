import "./loja.css";
import "./rarity-glow.css";
import "./shop-rework.css";
import "./cosmetics.css";
import { PlayerNav } from "@/components/player-nav";
import { ShopCatalog, type ShopCatalogItem } from "@/components/shop/shop-catalog";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { itemSlotLabel } from "@/lib/game/equipment";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";
import { getShopItems } from "@/lib/game/player-portal";
import { attributesSchema } from "@/lib/game/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAccount, isAdministrativeRole } from "@/lib/auth/account";

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
  const [rows, character, query, account] = await Promise.all([
    getShopItems(),
    requireCharacterSheet(characterId),
    searchParams,
    getCurrentAccount(),
  ]);
  const canPreviewCosmetics = Boolean(account && isAdministrativeRole(account.role));
  const client = await createServerSupabaseClient();
  const { data: kingdomState } = client
    ? await client
        .from("v2_kingdom_states")
        .select("market_stars,penalty_until,shop_markup_percent")
        .eq("kingdom", character.kingdom)
        .maybeSingle()
    : { data: null };
  const penaltyActive = Boolean(
    kingdomState?.penalty_until && new Date(kingdomState.penalty_until) > new Date(),
  );
  const shopMultiplier =
    1 -
    (kingdomState?.market_stars ?? 0) * 0.03 +
    (penaltyActive ? (kingdomState?.shop_markup_percent ?? 0) * 0.01 : 0);
  const items: ShopCatalogItem[] = rows.map((item) => {
    const parsed = attributesSchema.partial().safeParse(item.attributes);
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: Math.max(1, Math.round(item.price * shopMultiplier)),
      imageUrl: item.image_url,
      slot: item.slot,
      slotLabel: itemSlotLabel(item.slot),
      rarity: item.rarity,
      rarityLabel: rarityLabels[item.rarity] ?? item.rarity,
      attributes: parsed.success ? (parsed.data as Record<string, number>) : {},
      effects: parseItemSpecialEffects(item.special_effects),
      twoHanded: item.two_handed,
      buildName: item.build_name,
      recommendedClasses: item.recommended_classes ?? [],
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
            className={`shop-purchase-notice ${query.compra === "sucesso" || query.compra === "carrinho" ? "is-success" : "is-error"}`}
            role="status"
          >
            <span>{query.compra === "sucesso" || query.compra === "carrinho" ? "✓" : "!"}</span>
            <div>
              <strong>
                {query.compra === "sucesso" || query.compra === "carrinho"
                  ? query.compra === "carrinho"
                    ? "Carrinho comprado com sucesso"
                    : "Item enviado para a mochila"
                  : query.compra === "saldo"
                    ? "WG insuficiente"
                    : "Compra não concluída"}
              </strong>
              <small>
                {query.compra === "sucesso" || query.compra === "carrinho"
                  ? `O equipamento já pode ser usado por ${character.name}.`
                  : "Nenhum WG foi descontado."}
              </small>
            </div>
          </div>
        ) : null}
        {shopMultiplier !== 1 ? (
          <div className={`shop-purchase-notice ${shopMultiplier < 1 ? "is-success" : "is-error"}`}>
            <span>{shopMultiplier < 1 ? "↓" : "↑"}</span>
            <div>
              <strong>
                {shopMultiplier < 1
                  ? `Mercado Próspero: ${Math.round((1 - shopMultiplier) * 100)}% de desconto`
                  : `Consequência de guerra: ${Math.round((shopMultiplier - 1) * 100)}% de aumento`}
              </strong>
              <small>
                O preço exibido já é o valor final exclusivo para os moradores deste reino.
              </small>
            </div>
          </div>
        ) : null}
        <ShopCatalog
          gold={character.gold}
          items={items}
          showCosmetics={canPreviewCosmetics}
          previewCharacter={{
            name: character.name,
            imageUrl: character.image_url,
            rank: character.adventure_rank,
            level: character.level,
          }}
        />
      </div>
    </main>
  );
}
