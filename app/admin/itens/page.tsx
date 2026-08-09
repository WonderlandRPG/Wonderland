import { attributesSchema } from "@/lib/game/schemas";
import { itemSlotLabel } from "@/lib/game/equipment";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateItemAdminAction } from "./actions";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";

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
  searchParams: Promise<{ status?: string; busca?: string; raridade?: string; pagina?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const query = await searchParams;
  const page = Math.max(1, Number(query.pagina) || 1);
  let itemQuery = client?.from("v2_shop_items").select("*", { count: "exact" });
  if (query.busca) itemQuery = itemQuery?.ilike("name", `%${query.busca}%`);
  if (query.raridade) itemQuery = itemQuery?.eq("rarity", query.raridade);
  const { data, count } = itemQuery
    ? await itemQuery.order("category").order("sort_order").range((page - 1) * 50, page * 50 - 1)
    : { data: [], count: 0 };
  return (
    <div className="admin-content admin-editor-page">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Economia do reino</span>
          <h2>Editar itens</h2>
          <p>
            Altere nome, raridade, atributos, preço, slot e o efeito especial aplicado na Arena.
          </p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Item atualizado." : "! Revise os dados do item."}
        </div>
      ) : null}
      <form className="admin-catalog-filter">
        <input name="busca" defaultValue={query.busca ?? ""} placeholder="Buscar pelo nome" />
        <select name="raridade" defaultValue={query.raridade ?? ""}><option value="">Todas as raridades</option><option value="common">Comum</option><option value="uncommon">Incomum</option><option value="rare">Raro</option><option value="epic">Épico</option><option value="legendary">Lendário</option><option value="mythic">Mítico</option></select>
        <button className="button button--primary">Filtrar itens</button>
        <span>{count ?? 0} resultados</span>
      </form>
      <section className="admin-editor-list">
        {(data ?? []).map((item) => {
          const parsed = attributesSchema.partial().safeParse(item.attributes);
          const attributes = parsed.success ? parsed.data : {};
          const effect = parseItemSpecialEffects(item.special_effects)[0];
          return (
            <details className="admin-editor-card" key={item.id}>
              <summary>
                <span>
                  <small>
                    {item.rarity} · {itemSlotLabel(item.slot)} · {item.price.toLocaleString("pt-BR")} WG
                  </small>
                  <strong>{item.name}</strong>
                </span>
                <b>{item.active ? "Na loja" : "Oculto"}</b>
              </summary>
              <form action={updateItemAdminAction} className="admin-form admin-item-form">
                <input name="id" type="hidden" value={item.id} />
                <label>
                  <span>Raridade</span>
                  <select name="rarity" defaultValue={item.rarity}>
                    <option value="common">Comum</option><option value="uncommon">Incomum</option><option value="rare">Raro</option><option value="epic">Épico</option><option value="legendary">Lendário</option><option value="mythic">Mítico</option>
                  </select>
                </label>
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
                <fieldset>
                  <legend>Efeito especial de combate</legend>
                  <label><span>Nome do efeito</span><input name="effectName" defaultValue={effect?.name ?? ""} placeholder="Sem efeito especial" /></label>
                  <label><span>Descrição</span><input name="effectDescription" defaultValue={effect?.description ?? ""} /></label>
                  {(["FOR","DEF","RES","INI","INT","ARC"] as const).map((attribute) => <label key={attribute}><span>Bônus de {attribute}</span><input name={`effect${attribute}`} type="number" min="0" defaultValue={effect?.modifiers[attribute] ?? 0} /></label>)}
                  <label><span>Duração (0 = combate inteiro)</span><input name="effectDuration" type="number" min="0" defaultValue={effect?.duration ?? 0} /></label>
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
      {(count ?? 0) > 50 ? <nav className="admin-pagination"><a href={`/admin/itens?raridade=${query.raridade ?? ""}&busca=${query.busca ?? ""}&pagina=${Math.max(1,page-1)}`}>← Anterior</a><span>Página {page}</span><a href={`/admin/itens?raridade=${query.raridade ?? ""}&busca=${query.busca ?? ""}&pagina=${page+1}`}>Próxima →</a></nav> : null}
    </div>
  );
}
