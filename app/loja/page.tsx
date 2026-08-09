import { PortalShell } from "@/components/portal-shell";
import { getShopItems } from "@/lib/game/player-portal";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { buyItem } from "./actions";

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
          items.map((item) => (
            <article className={`shop-card shop-card--${item.rarity}`} key={item.id}>
              <span className="shop-card__icon" aria-hidden="true">
                ◆
              </span>
              <small className={`rarity rarity--${item.rarity}`}>
                {rarityLabels[item.rarity] ?? item.rarity} · {item.category}
              </small>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <footer>
                <strong>{item.price.toLocaleString("pt-BR")} WG</strong>
                <form action={buyItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <button className="button button--primary" disabled={character.gold < item.price}>
                    Comprar
                  </button>
                </form>
              </footer>
            </article>
          ))
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
