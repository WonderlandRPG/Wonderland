import { PortalShell } from "@/components/portal-shell";
import { getShopItems } from "@/lib/game/player-portal";
import { getCurrentAccount } from "@/lib/auth/account";
import { buyItem } from "./actions";
export const dynamic = "force-dynamic";
export default async function ShopPage() {
  const items = await getShopItems();
  const account = await getCurrentAccount();
  return (
    <PortalShell
      eyebrow="Mercado real"
      title="Loja de Wonderland"
      description="Use as moedas conquistadas em sua jornada para personalizar a sua história."
    >
      <div className="portal-card-grid">
        {items.length ? (
          items.map((item) => (
            <article className="shop-card" key={item.id}>
              <span className="shop-card__icon">◆</span>
              <small>{item.category}</small>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <footer>
                <strong>{item.price.toLocaleString("pt-BR")} moedas</strong>
                {account ? (
                  <form action={buyItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button className="button button--primary">Comprar</button>
                  </form>
                ) : (
                  <a className="button button--primary" href="/entrar?next=%2Floja">
                    Entrar para comprar
                  </a>
                )}
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
