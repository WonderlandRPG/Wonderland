"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  generateStudioContentWithAiAction,
  initialContentAiState,
  saveSimpleClassAction,
  saveSimpleItemAction,
  saveSimpleRaceAction,
  saveSimpleTitleAction,
  type StudioContentKind,
} from "@/app/admin/estudio/content-actions";
import {
  effectKinds, itemSlots, rarities,
  simpleClassDefaults, simpleItemDefaults, simpleRaceDefaults, simpleTitleDefaults,
  type AttributeDraft, type SimpleClassDraft, type SimpleItemDraft, type SimpleRaceDraft, type SimpleTitleDraft,
} from "@/lib/admin/simple-content-builder";
import styles from "./admin-creation-studio.module.css";

const attributes = ["FOR","DEF","RES","INI","INT","ARC"] as const;
const rarityLabels: Record<(typeof rarities)[number],string> = { common:"Comum", uncommon:"Incomum", rare:"Raro", epic:"Épico", legendary:"Lendário", mythic:"Mítico" };
const slotLabels: Record<(typeof itemSlots)[number],string> = { head:"Cabeça",torso:"Torso",hands:"Mãos",legs:"Pernas",feet:"Pés",main_weapon:"Arma principal",off_weapon:"Arma secundária",necklace:"Colar",ring:"Anel",earring:"Brinco",cape:"Capa" };
const effectLabels: Record<(typeof effectKinds)[number],string> = { "":"Sem efeito", POISON:"Envenenamento", BLEED:"Sangramento", LIFE_STEAL:"Roubo de vida", COOLDOWN_REDUCTION:"Redução de recarga", FREEZE:"Congelamento" };

type Existing = { classes:SimpleClassDraft[]; races:SimpleRaceDraft[]; items:SimpleItemDraft[]; titles:SimpleTitleDraft[] };
export function AdminContentStudio({ existing, aiConfigured }: { existing:Existing; aiConfigured:boolean }) {
  const [kind,setKind]=useState<StudioContentKind>("class");
  const [classDraft,setClassDraft]=useState(simpleClassDefaults());
  const [raceDraft,setRaceDraft]=useState(simpleRaceDefaults());
  const [itemDraft,setItemDraft]=useState(simpleItemDefaults());
  const [titleDraft,setTitleDraft]=useState(simpleTitleDefaults());
  const [aiState,aiAction,aiPending]=useActionState(generateStudioContentWithAiAction,initialContentAiState);
  const [saving,startSaving]=useTransition(); const [message,setMessage]=useState("");
  useEffect(()=>{if(aiState.status!=="success"||!aiState.kind||!aiState.draft)return;setKind(aiState.kind);if(aiState.kind==="class")setClassDraft(aiState.draft as SimpleClassDraft);if(aiState.kind==="race")setRaceDraft(aiState.draft as SimpleRaceDraft);if(aiState.kind==="item")setItemDraft(aiState.draft as SimpleItemDraft);if(aiState.kind==="title")setTitleDraft(aiState.draft as SimpleTitleDraft);},[aiState]);
  const currentList = kind==="class"?existing.classes:kind==="race"?existing.races:kind==="item"?existing.items:existing.titles;
  function newDraft(){setMessage("");if(kind==="class")setClassDraft(simpleClassDefaults());if(kind==="race")setRaceDraft(simpleRaceDefaults());if(kind==="item")setItemDraft(simpleItemDefaults());if(kind==="title")setTitleDraft(simpleTitleDefaults());}
  function loadExisting(id:string){setMessage("");const list=currentList as Array<{id?:string}>;const found=list.find((entry)=>entry.id===id);if(!found){newDraft();return;}if(kind==="class")setClassDraft(found as SimpleClassDraft);if(kind==="race")setRaceDraft(found as SimpleRaceDraft);if(kind==="item")setItemDraft(found as SimpleItemDraft);if(kind==="title")setTitleDraft(found as SimpleTitleDraft);}
  function save(){setMessage("");startSaving(async()=>{const result=kind==="class"?await saveSimpleClassAction(classDraft):kind==="race"?await saveSimpleRaceAction(raceDraft):kind==="item"?await saveSimpleItemAction(itemDraft):await saveSimpleTitleAction(titleDraft);setMessage(result.message);});}
  const draftName=kind==="class"?classDraft.name:kind==="race"?raceDraft.name:kind==="item"?itemDraft.name:titleDraft.name;
  return <section className={styles.builder}>
    <div className={styles.sectionHeading}><div><span>05</span><h2>Central de conteúdo</h2></div><p>Crie ou edite sem abrir contratos técnicos.</p></div>
    <div className={styles.contentTabs}>{(["class","race","item","title"] as StudioContentKind[]).map((value)=><button key={value} className={kind===value?styles.activeTab:""} onClick={()=>{setKind(value);setMessage("");}} type="button">{value==="class"?"Classe":value==="race"?"Raça":value==="item"?"Item":"Título"}</button>)}</div>
    <div className={styles.contentToolbar}>
      <label><span>Editar existente</span><select value={(kind==="class"?classDraft:kind==="race"?raceDraft:kind==="item"?itemDraft:titleDraft).id || ""} onChange={(e)=>loadExisting(e.target.value)}><option value="">Criar novo</option>{currentList.map((entry)=><option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <button type="button" onClick={newDraft}>＋ Criar novo {kind==="class"?"classe":kind==="race"?"raça":kind==="item"?"item":"Título"}</button>
    </div>

    <div className={styles.aiSubPanel}>
      <div><strong>✦ Pedir este conteúdo para a IA</strong><small>A IA preenche o formulário; você revisa e só depois salva.</small></div>
      <form action={aiAction} className={styles.aiContentForm}>
        <input name="kind" type="hidden" value={kind}/><textarea name="prompt" rows={3} required placeholder={`Ex.: Crie ${kind==="class"?"uma classe de cavaleiro rúnico":kind==="race"?"uma raça de gigantes de gelo":kind==="item"?"uma espada lendária focada em FOR e sangramento":"um título para fundadores"}.`}/>
        <label><span>Imagem opcional</span><input accept="image/*" name="image" type="file"/></label>
        <button disabled={!aiConfigured||aiPending}>{aiPending?"Gerando…":"Gerar proposta"}</button>
      </form>
      {aiState.status!=="idle"?<p className={aiState.status==="error"?styles.error:styles.success}>{aiState.message}</p>:null}
    </div>

    <div className={styles.editorLayout}>
      <div className={styles.formCard}>
        {kind==="class"?<ClassForm value={classDraft} onChange={setClassDraft}/>:null}
        {kind==="race"?<RaceForm value={raceDraft} onChange={setRaceDraft}/>:null}
        {kind==="item"?<ItemForm value={itemDraft} onChange={setItemDraft}/>:null}
        {kind==="title"?<TitleForm value={titleDraft} onChange={setTitleDraft}/>:null}
      </div>
      <aside className={styles.preview}><span>PRÉVIA DO CONTEÚDO</span><h3>{draftName}</h3><p>{kind==="class"?classDraft.description:kind==="race"?raceDraft.description:kind==="item"?itemDraft.description:titleDraft.description}</p><dl><div><dt>Tipo</dt><dd>{kind==="class"?"Classe":kind==="race"?"Raça":kind==="item"?rarityLabels[itemDraft.rarity]:"Título"}</dd></div>{kind==="class"?<><div><dt>Função</dt><dd>{classDraft.specialization}</dd></div><div><dt>Atributo</dt><dd>{classDraft.primaryAttribute}</dd></div></>:null}{kind==="race"?<><div><dt>HP</dt><dd>{raceDraft.baseHp}</dd></div><div><dt>Bônus</dt><dd>{Object.values(raceDraft.bonuses).reduce((a,b)=>a+b,0)}/25</dd></div></>:null}{kind==="item"?<><div><dt>Slot</dt><dd>{slotLabels[itemDraft.slot]}</dd></div><div><dt>Preço</dt><dd>{itemDraft.price} WG</dd></div></>:null}{kind==="title"?<div><dt>Atributos</dt><dd>{Object.values(titleDraft.attributes).reduce((a,b)=>a+b,0)} pts</dd></div>:null}</dl><div className={styles.valid}>✓ Alterações avançadas não exibidas aqui são preservadas</div></aside>
    </div>
    <div className={styles.contentSave}><div><strong>{(kind==="class"?classDraft:kind==="race"?raceDraft:kind==="item"?itemDraft:titleDraft).id?"Salvar edição":"Criar como novo conteúdo"}</strong><small>Classes e raças novas entram como rascunho para revisão.</small></div><button disabled={saving} onClick={save} type="button">{saving?"Salvando…":"Confirmar e salvar"}</button>{message?<p>{message}</p>:null}</div>
  </section>;
}

function ClassForm({value,onChange}:{value:SimpleClassDraft;onChange:(v:SimpleClassDraft)=>void}){return <><Text label="Nome" value={value.name} onChange={(name)=>onChange({...value,name})}/><TextArea label="Descrição para jogadores" value={value.description} onChange={(description)=>onChange({...value,description})}/><div className={styles.grid}><Text label="Especialização" value={value.specialization} onChange={(specialization)=>onChange({...value,specialization})}/><Select label="Atributo principal" value={value.primaryAttribute} options={attributes.map(a=>[a,a])} onChange={(v)=>onChange({...value,primaryAttribute:v as SimpleClassDraft["primaryAttribute"]})}/><NumberField label="Dificuldade (1–5)" value={value.difficulty} min={1} max={5} onChange={(difficulty)=>onChange({...value,difficulty})}/><Text label="Nome do recurso" value={value.resourceName} onChange={(resourceName)=>onChange({...value,resourceName})}/><NumberField label="Máximo do recurso" value={value.resourceMaximum} min={1} max={999} onChange={(resourceMaximum)=>onChange({...value,resourceMaximum})}/><Text label="Imagem (URL)" value={value.imageUrl} onChange={(imageUrl)=>onChange({...value,imageUrl})}/><Text label="Nome da passiva" value={value.passiveName} onChange={(passiveName)=>onChange({...value,passiveName})}/></div><TextArea label="Descrição da passiva" value={value.passiveDescription} onChange={(passiveDescription)=>onChange({...value,passiveDescription})}/></>}
function RaceForm({value,onChange}:{value:SimpleRaceDraft;onChange:(v:SimpleRaceDraft)=>void}){return <><Text label="Nome" value={value.name} onChange={(name)=>onChange({...value,name})}/><TextArea label="Descrição da raça" value={value.description} onChange={(description)=>onChange({...value,description})}/><div className={styles.grid}><Text label="Especialização" value={value.specialization} onChange={(specialization)=>onChange({...value,specialization})}/><NumberField label="Dificuldade" value={value.difficulty} min={1} max={5} onChange={(difficulty)=>onChange({...value,difficulty})}/><NumberField label="HP inicial" value={value.baseHp} min={150} max={800} onChange={(baseHp)=>onChange({...value,baseHp})}/><NumberField label="Mana inicial" value={value.baseMana} min={0} max={999} onChange={(baseMana)=>onChange({...value,baseMana})}/><Text label="Imagem (URL)" value={value.imageUrl} onChange={(imageUrl)=>onChange({...value,imageUrl})}/><Text label="Nome do traço" value={value.traitName} onChange={(traitName)=>onChange({...value,traitName})}/></div><TextArea label="Descrição do traço racial" value={value.traitDescription} onChange={(traitDescription)=>onChange({...value,traitDescription})}/><Attributes label="Bônus raciais · máximo 25" value={value.bonuses} onChange={(bonuses)=>onChange({...value,bonuses})}/></>}
function ItemForm({value,onChange}:{value:SimpleItemDraft;onChange:(v:SimpleItemDraft)=>void}){return <><Text label="Nome" value={value.name} onChange={(name)=>onChange({...value,name})}/><TextArea label="Descrição" value={value.description} onChange={(description)=>onChange({...value,description})}/><div className={styles.grid}><Text label="Categoria" value={value.category} onChange={(category)=>onChange({...value,category})}/><Select label="Slot" value={value.slot} options={itemSlots.map(v=>[v,slotLabels[v]])} onChange={(v)=>onChange({...value,slot:v as SimpleItemDraft["slot"]})}/><Select label="Raridade" value={value.rarity} options={rarities.map(v=>[v,rarityLabels[v]])} onChange={(v)=>onChange({...value,rarity:v as SimpleItemDraft["rarity"]})}/><NumberField label="Preço WG" value={value.price} min={0} max={999999999} onChange={(price)=>onChange({...value,price})}/><Text label="Imagem (URL)" value={value.imageUrl} onChange={(imageUrl)=>onChange({...value,imageUrl})}/><label><span>Arma de duas mãos?</span><select value={value.twoHanded?"yes":"no"} onChange={(e)=>onChange({...value,twoHanded:e.target.value==="yes"})}><option value="no">Não</option><option value="yes">Sim</option></select></label></div><Attributes label="Atributos concedidos" value={value.attributes} onChange={(attributes)=>onChange({...value,attributes})}/><EffectFields value={value} onChange={onChange}/></>}
function TitleForm({value,onChange}:{value:SimpleTitleDraft;onChange:(v:SimpleTitleDraft)=>void}){return <><Text label="Nome" value={value.name} onChange={(name)=>onChange({...value,name})}/><TextArea label="Descrição" value={value.description} onChange={(description)=>onChange({...value,description})}/><Attributes label="Atributos concedidos" value={value.attributes} onChange={(attributes)=>onChange({...value,attributes})}/><div className={styles.grid}><Color label="Texto" value={value.primary} onChange={(primary)=>onChange({...value,primary})}/><Color label="Fundo" value={value.secondary} onChange={(secondary)=>onChange({...value,secondary})}/><Color label="Brilho" value={value.glow} onChange={(glow)=>onChange({...value,glow})}/></div><EffectFields value={value} onChange={onChange}/></>}
function EffectFields<T extends SimpleItemDraft|SimpleTitleDraft>({value,onChange}:{value:T;onChange:(v:T)=>void}){return <><div className={styles.grid}><Select label="Efeito especial" value={value.effectKind} options={effectKinds.map(v=>[v,effectLabels[v]])} onChange={(v)=>onChange({...value,effectKind:v as T["effectKind"]})}/><Text label="Nome do efeito" value={value.effectName} onChange={(effectName)=>onChange({...value,effectName})}/><NumberField label="Potência" value={value.effectPower} min={0} max={1000} onChange={(effectPower)=>onChange({...value,effectPower})}/><NumberField label="Duração" value={value.effectDuration} min={0} max={20} onChange={(effectDuration)=>onChange({...value,effectDuration})}/></div><TextArea label="Descrição do efeito" value={value.effectDescription} onChange={(effectDescription)=>onChange({...value,effectDescription})}/></>}
function Attributes({label,value,onChange}:{label:string;value:AttributeDraft;onChange:(v:AttributeDraft)=>void}){return <fieldset className={styles.attributeBox}><legend>{label}</legend><div className={styles.attributeGrid}>{attributes.map((key)=><NumberField key={key} label={key} value={value[key]} min={0} max={999} onChange={(n)=>onChange({...value,[key]:n})}/>)}</div></fieldset>}
function Text({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><span>{label}</span><input value={value} onChange={(e)=>onChange(e.target.value)}/></label>}
function TextArea({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className={styles.full}><span>{label}</span><textarea rows={4} value={value} onChange={(e)=>onChange(e.target.value)}/></label>}
function NumberField({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(v:number)=>void}){return <label><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={(e)=>onChange(globalThis.Number(e.target.value))}/></label>}
function Select({label,value,options,onChange}:{label:string;value:string;options:readonly (readonly [string,string])[];onChange:(v:string)=>void}){return <label><span>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
function Color({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><span>{label}</span><input type="color" value={value} onChange={(e)=>onChange(e.target.value)}/></label>}
