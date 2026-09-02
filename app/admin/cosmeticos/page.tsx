import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { getVisibleCosmetics } from "@/lib/content/cosmetics";
import { getAllCharacterOptions } from "@/lib/content/characters";
import { grantCosmeticAction, updateCosmeticAction } from "./actions";

export const dynamic="force-dynamic";
export const metadata={title:"Cosméticos | Painel ADM"};
export default async function AdminCosmeticsPage({searchParams}:{searchParams:Promise<{status?:string}>}) {
 const [cosmetics,characters,query]=await Promise.all([getVisibleCosmetics(),getAllCharacterOptions(),searchParams]);
 return <div className="admin-content admin-editor-page"><header className="admin-page-title"><div><span className="eyebrow">Ateliê e distribuição</span><h2>Cosméticos</h2><p>Controle a vitrine, o preço externo e entregue peças a um personagem ou a toda Wonderland.</p></div></header>
 {query.status?<div className={`account-notice ${query.status==="erro"?"is-warning":""}`}>{query.status==="salvo"?"✓ Vitrine atualizada.":query.status==="entregue"?"✓ Cosmético colocado no inventário.":"! Não foi possível concluir."}</div>:null}
 <section className="admin-editor-list">{cosmetics.map((item)=><article className="admin-editor-card admin-cosmetic-card" key={item.id}><header><div><small>{item.collectionName} · {item.slot}</small><h3>{item.name}</h3><p>{item.description}</p></div><span>{item.active?"À venda":"Fora da loja"}</span></header>
 <div className="admin-cosmetic-preview"><CharacterPortraitCard imageUrl={null} level={18} name="Prévia" rank="E" title={null} variant="compact" cosmetics={{card:item.slot==="card"?item.key:null,aura:item.slot==="aura"?item.key:null,border:item.slot==="border"?item.key:null}} /></div>
 <form action={updateCosmeticAction} className="admin-form"><input name="id" type="hidden" value={item.id}/><label><span>Preço em reais</span><input name="price" type="number" min="0" step="0.01" defaultValue={(item.priceCents??0)/100}/></label><label><span>Mostrar na loja</span><input name="active" type="checkbox" defaultChecked={item.active}/></label><button className="button button--primary">Salvar vitrine</button></form>
 <form action={grantCosmeticAction} className="admin-form"><input name="cosmeticId" type="hidden" value={item.id}/><label className="is-wide"><span>Colocar no inventário de</span><select name="characterId" defaultValue=""><option value="" disabled>Escolha o personagem</option><option value="all">Todos os personagens</option>{characters.map((character)=><option key={character.id} value={character.id}>{character.name}</option>)}</select></label><button className="button button--dark">Entregar cosmético</button></form></article>)}</section></div>;
}
