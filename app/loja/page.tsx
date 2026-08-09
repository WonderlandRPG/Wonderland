import { PortalShell } from "@/components/portal-shell";
import { getShopItems } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { buyItem } from "./actions";
import { itemSlotEmoji, itemSlotLabel } from "@/lib/game/equipment";
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
export default async function ShopPage() {
  const { characterId } = await requireActiveCharacter("/loja");
  const [items, character] = await Promise.all([
    getShopItems(),
    requireCharacterSheet(characterId),
  ]);
  return (
    <PortalShell
      eyebrow="Mercado real"
      title="Loja de Wonderland"
      description={`${character.name} possui ${character.gold.toLocaleString("pt-BR")} WG para comprar equipamentos.`}
    >
      <div className="portal-card-grid">
        {items.length ? (
          items.map((item) => {
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
                  <strong>
                    <small>Preço</small>
                    {item.price.toLocaleString("pt-BR")} WG
                  </strong>
                  <form action={buyItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button disabled={character.gold < item.price}>Comprar item</button>
                  </form>
                </footer>
              </article>
            );
          })
        ) : (
          <div className="portal-empty">
            <span>◆</span>
            <h2>Estoque em preparação</h2>
            <p>Os primeiros itens aparecerão após a atualização do reino.</p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
