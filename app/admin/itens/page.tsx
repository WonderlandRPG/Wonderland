import { attributesSchema } from "@/lib/game/schemas";
import { itemSlotLabel } from "@/lib/game/equipment";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateItemAdminAction } from "./actions";

export const metadata = { title: "Itens | Painel ADM" };
export const dynamic = "force-dynamic";

const slots = [
  "head",
  "torso",
  "hands",
  "legs",
  "feet",
  "main_weapon",
  "off_weapon",
  "necklace",
  "ring",
  "earring",
  "cape",
];

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [{ data }, query] = await Promise.all([
    client
      ? client.from("v2_shop_items").select("*").order("category").order("sort_order")
      : Promise.resolve({ data: [] }),
    searchParams,
  ]);
  return (
    <div className="admin-content admin-editor-page">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Economia do reino</span>
          <h2>Editar itens</h2>
          <p>
            Altere nome, atributos, preço, imagem e o espaço ocupado. Todos os itens permanecem
            Comuns.
          </p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Item atualizado." : "! Revise os dados do item."}
        </div>
      ) : null}
      <section className="admin-editor-list">
        {(data ?? []).map((item) => {
          const parsed = attributesSchema.partial().safeParse(item.attributes);
          const attributes = parsed.success ? parsed.data : {};
          return (
            <details className="admin-editor-card" key={item.id}>
              <summary>
                <span>
                  <small>
                    Comum · {itemSlotLabel(item.slot)} · {item.price.toLocaleString("pt-BR")} WG
                  </small>
                  <strong>{item.name}</strong>
                </span>
                <b>{item.active ? "Na loja" : "Oculto"}</b>
              </summary>
              <form action={updateItemAdminAction} className="admin-form admin-item-form">
                <input name="id" type="hidden" value={item.id} />
                <label>
                  <span>Nome</span>
                  <input name="name" defaultValue={item.name} required />
                </label>
                <label>
                  <span>Categoria</span>
                  <input name="category" defaultValue={item.category} required />
                </label>
                <label>
                  <span>Slot</span>
                  <select name="slot" defaultValue={item.slot}>
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {itemSlotLabel(slot)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Preço em WG</span>
                  <input name="price" type="number" min="0" defaultValue={item.price} required />
                </label>
                <label>
                  <span>Ordem na loja</span>
                  <input
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue={item.sort_order}
                    required
                  />
                </label>
                <label>
                  <span>Imagem por link</span>
                  <input name="imageUrl" type="url" defaultValue={item.image_url ?? ""} />
                </label>
                <label>
                  <span>Descrição</span>
                  <textarea name="description" defaultValue={item.description} rows={3} />
                </label>
                <fieldset>
                  <legend>Atributos</legend>
                  {(["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const).map((attribute) => (
                    <label key={attribute}>
                      <span>{attribute}</span>
                      <input
                        name={attribute}
                        type="number"
                        min="0"
                        defaultValue={attributes[attribute] ?? 0}
                      />
                    </label>
                  ))}
                </fieldset>
                <label>
                  <input name="twoHanded" type="checkbox" defaultChecked={item.two_handed} /> Ocupa
                  as duas mãos (bloqueia a arma secundária)
                </label>
                <label>
                  <input name="active" type="checkbox" defaultChecked={item.active} /> Disponível na
                  loja
                </label>
                <button className="button button--primary">Salvar item</button>
              </form>
            </details>
          );
        })}
      </section>
    </div>
  );
}
