import Link from "next/link";

import { grantItemAction } from "@/app/admin/itens/actions";
import { getAllCharacterOptions } from "@/lib/content/characters";
import { getItemCatalog } from "@/lib/content/items";
import { equipmentSlotLabels } from "@/lib/game/items";

export const metadata = { title: "Gerenciar Itens" };
export const dynamic = "force-dynamic";

const notices: Record<string, { error?: boolean; text: string }> = {
  arquivado: { text: "O item foi arquivado." },
  concedido: { text: "O item foi concedido ao personagem." },
  erro: { error: true, text: "Não foi possível concluir a operação." },
};

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [items, characters, query] = await Promise.all([
    getItemCatalog(),
    getAllCharacterOptions(),
    searchParams,
  ]);
  const published = items.filter((item) => item.status === "published");
  const notice = query.notice ? notices[query.notice] : undefined;
  return (
    <div className="admin-content race-catalog-page">
      <section className="race-catalog-hero">
        <div>
          <span className="eyebrow">Conteúdo do jogo // módulo 03</span>
          <h1>Itens</h1>
          <p>
            Crie equipamentos, conceda-os aos personagens e controle os bônus usados nas fichas.
          </p>
        </div>
        <Link className="button button--primary" href="/admin/itens/novo">
          Criar item ＋
        </Link>
      </section>
      {notice ? (
        <div
          className={`admin-notice ${notice.error ? "admin-notice--error" : ""}`}
          data-sfx-on-mount={notice.error ? "error" : "confirm"}
        >
          <span>{notice.error ? "!" : "✓"}</span>
          {notice.text}
        </div>
      ) : null}
      <section className="admin-section item-grant-panel">
        <div className="admin-section__heading">
          <div>
            <span className="eyebrow">Distribuição segura</span>
            <h2>Conceder item</h2>
          </div>
        </div>
        {published.length > 0 && characters.length > 0 ? (
          <form action={grantItemAction}>
            <label>
              Personagem
              <select name="characterId">
                {characters.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} · {entry.ownerName} · Nível {entry.level}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Item
              <select name="itemId">
                {published.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} · {entry.payload.rarity}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantidade
              <input min={1} name="quantity" type="number" defaultValue={1} />
            </label>
            <button className="button button--primary" type="submit">
              Conceder
            </button>
          </form>
        ) : (
          <p>Publique um item e crie um personagem para ativar a concessão.</p>
        )}
      </section>
      {items.length > 0 ? (
        <section className="race-catalog-grid">
          {items.map((item) => (
            <article className="race-catalog-card" key={item.id}>
              <div className="race-catalog-card__visual">
                <span>{item.name.slice(0, 2).toUpperCase()}</span>
                <small>{item.payload.rarity}</small>
              </div>
              <div className="race-catalog-card__body">
                <div className="race-catalog-card__title">
                  <div>
                    <h2>{item.name}</h2>
                    <code>{item.slug}</code>
                  </div>
                  <span className={`content-status content-status--${item.status}`}>
                    {item.status}
                  </span>
                </div>
                <p>{item.payload.description}</p>
                <div className="race-catalog-card__metrics">
                  <span>
                    Espaço{" "}
                    <strong>
                      {item.payload.equipmentSlot
                        ? equipmentSlotLabels[item.payload.equipmentSlot]
                        : "—"}
                    </strong>
                  </span>
                  <span>
                    Nível <strong>{item.payload.levelRequirement}</strong>
                  </span>
                  <span>
                    WG <strong>{item.payload.priceWg}</strong>
                  </span>
                </div>
              </div>
              <footer>
                <Link
                  className="race-card-action race-card-action--primary"
                  href={`/admin/itens/${item.id}`}
                >
                  Editar
                </Link>
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <section className="race-catalog-empty">
          <span>IT</span>
          <h2>Nenhum item cadastrado</h2>
          <p>Crie o primeiro equipamento do Wonderland.</p>
        </section>
      )}
    </div>
  );
}
