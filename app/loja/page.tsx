import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { ItemGlyph } from "@/components/items/item-glyph";
import { ShopBuyButton } from "@/components/shop/shop-buy-button";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { requireCharacterSheet } from "@/lib/content/characters";
import { itemSlotLabel } from "@/lib/game/equipment";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";
import { getShopItems } from "@/lib/game/player-portal";
import { attributesSchema } from "@/lib/game/schemas";
import { buyItem } from "./actions";

const rarities = [
  ["common", "Comum"], ["uncommon", "Incomum"], ["rare", "Raro"],
  ["epic", "Épico"], ["legendary", "Lendário"], ["mythic", "Mítico"],
] as const;
const pageSize = 24;
export const dynamic = "force-dynamic";

type Filters = { busca?: string; slot?: string; raridade?: string; ordem?: string; compra?: string; pagina?: string };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const lore = (description: string, slot: string) => description.replace(/^(?:(?:FOR|DEF|RES|INI|INT|ARC)\s*\+\d+\s*(?:\/\s*)?)+/i, "").trim() || `Equipamento para ${itemSlotLabel(slot).toLowerCase()}, criado para aventureiros de Wonderland.`;

export default async function ShopPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const { characterId } = await requireActiveCharacter("/loja");
  const [items, character, filters] = await Promise.all([getShopItems(), requireCharacterSheet(characterId), searchParams]);
  const search = normalize(filters.busca?.trim() ?? "");
  const slots = [...new Set(items.map((item) => item.slot))].sort((a, b) => itemSlotLabel(a).localeCompare(itemSlotLabel(b), "pt-BR"));
  const filtered = items.filter((item) => (!search || normalize(`${item.name} ${item.category}`).includes(search)) && (!filters.slot || item.slot === filters.slot) && (!filters.raridade || item.rarity === filters.raridade)).sort((a, b) => filters.ordem === "preco_maior" ? b.price - a.price : filters.ordem === "nome" ? a.name.localeCompare(b.name, "pt-BR") : a.price - b.price);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number(filters.pagina) || 1));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hrefForPage = (next: number) => { const params = new URLSearchParams(Object.entries(filters).filter(([key, value]) => key !== "pagina" && key !== "compra" && value) as [string,string][]); params.set("pagina", String(next)); return `/loja?${params}`; };

  return <main className="market-page"><PlayerNav /><div className="page-container market-shell">
    <header className="market-hero"><div><span className="eyebrow">Mercado dos cinco reinos</span><h1>Arsenal de Wonderland</h1><p>Encontre equipamentos pelo slot e raridade. Os atributos aparecem uma única vez, com efeitos especiais destacados separadamente.</p></div><aside><small>Carteira de {character.name}</small><strong>{character.gold.toLocaleString("pt-BR")} WG</strong><span>{filtered.length} itens disponíveis</span></aside></header>
    {filters.compra ? <div className={`shop-purchase-notice ${filters.compra === "sucesso" ? "is-success" : "is-error"}`} role="status"><span>{filters.compra === "sucesso" ? "✓" : "!"}</span><div><strong>{filters.compra === "sucesso" ? "Item enviado ao inventário" : filters.compra === "saldo" ? "WG insuficiente" : "Compra não concluída"}</strong><small>{filters.compra === "sucesso" ? `Abra a ficha de ${character.name} para equipá-lo.` : "Nenhum WG foi descontado."}</small></div></div> : null}
    <nav className="market-rarity-tabs" aria-label="Raridades"><Link className={!filters.raridade ? "is-active" : ""} href="/loja">Todos</Link>{rarities.map(([key,label]) => <Link className={filters.raridade === key ? "is-active" : ""} data-rarity={key} href={`/loja?raridade=${key}`} key={key}>{label}</Link>)}</nav>
    <section className="market-tools"><form action="/loja"><label><span>Pesquisar</span><input name="busca" defaultValue={filters.busca ?? ""} placeholder="Nome do equipamento" /></label><label><span>Slot</span><select name="slot" defaultValue={filters.slot ?? ""}><option value="">Todos os slots</option>{slots.map((slot) => <option key={slot} value={slot}>{itemSlotLabel(slot)}</option>)}</select></label><label><span>Raridade</span><select name="raridade" defaultValue={filters.raridade ?? ""}><option value="">Todas</option>{rarities.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><label><span>Ordem</span><select name="ordem" defaultValue={filters.ordem ?? "preco_menor"}><option value="preco_menor">Menor preço</option><option value="preco_maior">Maior preço</option><option value="nome">Nome A–Z</option></select></label><button className="button button--primary">Buscar</button></form></section>
    <section className="market-grid">{visible.map((item) => { const parsed = attributesSchema.partial().safeParse(item.attributes); const attributes = parsed.success ? parsed.data : {}; const effects = parseItemSpecialEffects(item.special_effects); return <article className="market-item" data-rarity={item.rarity} key={item.id}>
      <div className="market-item__visual"><ItemGlyph slot={item.slot} /><span>{item.two_handed ? "DUAS MÃOS" : itemSlotLabel(item.slot)}</span></div>
      <div className="market-item__content"><small>{rarities.find(([key]) => key === item.rarity)?.[1] ?? item.rarity}</small><h2>{item.name}</h2><p>{lore(item.description, item.slot)}</p><div className="market-item__attributes">{Object.entries(attributes).map(([key,value]) => <span key={key}><b>{key}</b><strong>+{value}</strong></span>)}</div>{item.rarity === "legendary" || item.rarity === "mythic" ? <div className="market-item__season"><span>◆</span><div><small>ITEM DE TEMPORADA</small><b>Temporada inaugural</b></div></div> : null}{effects.map((effect) => <div className="market-item__effect" key={effect.key}><b>{effect.name}</b><span>{effect.description}</span></div>)}</div>
      <footer><div><strong>{item.price.toLocaleString("pt-BR")} WG</strong><small>{character.gold >= item.price ? "Compra disponível" : `Faltam ${(item.price-character.gold).toLocaleString("pt-BR")} WG`}</small></div><form action={buyItem}><input type="hidden" name="itemId" value={item.id}/><ShopBuyButton disabled={character.gold < item.price}/></form></footer>
    </article>; })}</section>
    {!visible.length ? <div className="market-empty"><ItemGlyph slot="necklace"/><h2>Nenhum equipamento encontrado</h2><p>Altere os filtros para consultar outra parte do arsenal.</p></div> : null}
    {pageCount > 1 ? <nav className="market-pagination"><Link aria-disabled={page === 1} href={hrefForPage(Math.max(1,page-1))}>← Anterior</Link><span>Página {page} de {pageCount}</span><Link aria-disabled={page === pageCount} href={hrefForPage(Math.min(pageCount,page+1))}>Próxima →</Link></nav> : null}
  </div></main>;
}
