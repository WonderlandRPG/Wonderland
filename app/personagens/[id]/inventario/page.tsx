import Link from "next/link";

import { equipItemAction, unequipItemAction } from "@/app/personagens/[id]/inventario/actions";
import { BrandMark } from "@/components/brand-mark";
import { requireCurrentAccount } from "@/lib/auth/account";
import { requireCharacterSheet } from "@/lib/content/characters";
import { getCharacterInventory } from "@/lib/content/inventory";
import { equipmentSlotLabels } from "@/lib/game/items";
import { attributeKeys } from "@/lib/game/schemas";

export const metadata = { title: "Inventário" };
export const dynamic = "force-dynamic";
const notices: Record<string, { error?: boolean; text: string }> = {
  equipado: { text: "Item equipado. Os atributos da ficha foram recalculados." },
  desequipado: { text: "Item desequipado." },
  erro: { error: true, text: "Não foi possível alterar o equipamento." },
};

export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireCurrentAccount("/personagens");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [character, inventory] = await Promise.all([
    requireCharacterSheet(id),
    getCharacterInventory(id),
  ]);
  const notice = query.notice ? notices[query.notice] : undefined;
  return (
    <main className="character-page inventory-page">
      <header className="account-header">
        <BrandMark inverse />
        <nav>
          <Link href={`/personagens/${id}`}>Ficha</Link>
          <Link href="/personagens">Personagens</Link>
        </nav>
      </header>
      <div className="page-container character-page__inner">
        <header className="character-page__header">
          <div>
            <Link className="race-back-link" href={`/personagens/${id}`}>
              ← Voltar à ficha
            </Link>
            <span className="eyebrow">Inventário de {character.name}</span>
            <h1>Equipamentos</h1>
            <p>Itens equipados alteram os cálculos da ficha e da Arena imediatamente.</p>
          </div>
          <span>{inventory.length} itens</span>
        </header>
        {notice ? (
          <div
            className={`account-notice ${notice.error ? "is-warning" : ""}`}
            data-sfx-on-mount={notice.error ? "error" : "confirm"}
          >
            <span>{notice.error ? "!" : "✓"}</span>
            {notice.text}
          </div>
        ) : null}
        <section className="inventory-equipped">
          <h2>Equipado agora</h2>
          <div>
            {Object.entries(equipmentSlotLabels).map(([slot, label]) => {
              const entry = inventory.find((item) => item.equippedSlot === slot);
              return (
                <article key={slot}>
                  <span>{label}</span>
                  {entry ? (
                    <>
                      <strong>{entry.item.name}</strong>
                      <small>{entry.item.payload.rarity}</small>
                      <form action={unequipItemAction.bind(null, id, entry.id)}>
                        <button type="submit">Desequipar</button>
                      </form>
                    </>
                  ) : (
                    <>
                      <strong>Espaço vazio</strong>
                      <small>Nenhum bônus ativo</small>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        {inventory.length > 0 ? (
          <section className="inventory-grid">
            {inventory.map((entry) => (
              <article
                className={`inventory-card ${entry.equippedSlot ? "is-equipped" : ""}`}
                key={entry.id}
              >
                <div className="inventory-card__icon">
                  <span>{entry.item.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <span className="eyebrow">
                    {entry.item.payload.rarity} · {entry.item.payload.category}
                  </span>
                  <h2>{entry.item.name}</h2>
                  <p>{entry.item.payload.description}</p>
                  <div className="inventory-bonuses">
                    {attributeKeys
                      .filter((key) => (entry.item.payload.attributeBonuses[key] ?? 0) > 0)
                      .map((key) => (
                        <span key={key}>
                          +{entry.item.payload.attributeBonuses[key]} {key}
                        </span>
                      ))}
                  </div>
                  <small>
                    Quantidade: {entry.quantity} · Nível {entry.item.payload.levelRequirement}
                  </small>
                </div>
                <footer>
                  {entry.equippedSlot ? (
                    <form action={unequipItemAction.bind(null, id, entry.id)}>
                      <button className="button button--dark" type="submit">
                        Desequipar
                      </button>
                    </form>
                  ) : entry.item.payload.equipmentSlot ? (
                    <form
                      action={equipItemAction.bind(
                        null,
                        id,
                        entry.id,
                        entry.item.payload.equipmentSlot,
                      )}
                    >
                      <button className="button button--primary" type="submit">
                        Equipar em {equipmentSlotLabels[entry.item.payload.equipmentSlot]}
                      </button>
                    </form>
                  ) : (
                    <span>Item não equipável</span>
                  )}
                </footer>
              </article>
            ))}
          </section>
        ) : (
          <section className="character-empty">
            <span>0 ITENS</span>
            <h2>O inventário está vazio</h2>
            <p>
              Itens serão recebidos em recompensas e podem ser concedidos pelo Painel ADM durante os
              testes.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
