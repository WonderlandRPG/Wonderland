"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import { createEmptyClassPayload, createClassSlug, parseClassPayload } from "@/lib/game/classes";
import { createEmptyRacePayload, createRaceSlug, parseRacePayload } from "@/lib/game/races";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  simpleClassDraftSchema, simpleRaceDraftSchema, simpleItemDraftSchema, simpleTitleDraftSchema,
  type SimpleClassDraft, type SimpleRaceDraft, type SimpleItemDraft, type SimpleTitleDraft,
} from "@/lib/admin/simple-content-builder";

export type StudioContentKind = "class" | "race" | "item" | "title";
type StudioDraft = SimpleClassDraft | SimpleRaceDraft | SimpleItemDraft | SimpleTitleDraft;
export type ContentAiState = { status:"idle"|"error"|"success"; message:string; kind?:StudioContentKind; draft?:StudioDraft };
export const initialContentAiState: ContentAiState = { status:"idle", message:"" };

function slugify(value:string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80); }
function attributesWithoutZero(input: Record<string,number>) { return Object.fromEntries(Object.entries(input).filter(([,value])=>value>0)); }
function specialEffects(input: { id?:string; name:string; effectKind:string; effectName:string; effectDescription:string; effectPower:number; effectDuration:number }) {
  if (!input.effectKind || !input.effectName) return [];
  return [{ key:`${input.id || slugify(input.name)}-studio-effect`, kind:input.effectKind, name:input.effectName, description:input.effectDescription || "Efeito configurado pelo Studio de Criação.", trigger:input.effectKind === "COOLDOWN_REDUCTION" ? "ON_SKILL_USE" : "ON_DAMAGE_DEALT", duration:input.effectDuration, power:input.effectPower, modifiers:{} }];
}
async function history(actorId:string, action:string, targetType:string, targetId:string|null, details:Record<string,unknown>) {
  const client = await createServerSupabaseClient();
  if (client) await client.from("v2_admin_history").insert({ actor_id:actorId, action, target_type:targetType, target_id:targetId, details: details as unknown as Json });
}

export async function saveSimpleClassAction(input: unknown) {
  const account = await requireAdministrativeAccount();
  const parsed = simpleClassDraftSchema.safeParse(input); if (!parsed.success) return { ok:false as const, message:"Revise os campos da classe." };
  const client = await createServerSupabaseClient(); if (!client) return { ok:false as const, message:"Banco indisponível." };
  const d = parsed.data; let id = d.id;
  if (id) {
    const { data:row } = await client.from("v2_content").select("id,payload,revision").eq("id",id).eq("content_type","class").maybeSingle();
    if (!row) return { ok:false as const, message:"Classe não encontrada." };
    const current = parseClassPayload(row.payload); if (!current.success) return { ok:false as const, message:"A classe atual possui dados inválidos." };
    const payload = { ...current.data, description:d.description, imageUrl:d.imageUrl, difficulty:d.difficulty, specialization:d.specialization, primaryAttributes:[d.primaryAttribute], resource:{...current.data.resource,name:d.resourceName,maximum:d.resourceMaximum}, passive:{name:d.passiveName,description:d.passiveDescription} };
    const { data:updated,error } = await client.from("v2_content").update({ name:d.name, slug:createClassSlug(d.name), payload:payload as unknown as Json, updated_by:account.id }).eq("id",id).eq("revision",row.revision).select("id").maybeSingle();
    if (error || !updated) return { ok:false as const, message:"Não foi possível salvar. Atualize a tela e tente novamente." };
  } else {
    const payload = createEmptyClassPayload(); payload.description=d.description; payload.imageUrl=d.imageUrl; payload.difficulty=d.difficulty; payload.specialization=d.specialization; payload.primaryAttributes=[d.primaryAttribute]; payload.resource.name=d.resourceName; payload.resource.maximum=d.resourceMaximum; payload.passive={name:d.passiveName,description:d.passiveDescription};
    const { data:created,error } = await client.from("v2_content").insert({ content_type:"class", name:d.name, slug:createClassSlug(d.name), status:"draft", payload:payload as unknown as Json, created_by:account.id, updated_by:account.id }).select("id").single();
    if (error || !created) return { ok:false as const, message:"Não foi possível criar a classe. Verifique se o nome já existe." }; id=created.id;
  }
  await history(account.id,d.id?"class.updated_from_studio":"class.created_from_studio","class",id,{name:d.name}); revalidatePath("/admin/classes"); revalidatePath("/classes"); revalidatePath("/admin/estudio");
  return { ok:true as const, message:`${d.name} foi ${d.id?"atualizada":"criada como rascunho"}.`, id };
}

export async function saveSimpleRaceAction(input: unknown) {
  const account = await requireAdministrativeAccount(); const parsed=simpleRaceDraftSchema.safeParse(input); if(!parsed.success) return {ok:false as const,message:parsed.error.issues[0]?.message || "Revise os campos da raça."};
  const client=await createServerSupabaseClient(); if(!client) return {ok:false as const,message:"Banco indisponível."}; const d=parsed.data; let id=d.id;
  if(id){
    const {data:row}=await client.from("v2_content").select("id,payload,revision").eq("id",id).eq("content_type","race").maybeSingle(); if(!row) return {ok:false as const,message:"Raça não encontrada."};
    const current=parseRacePayload(row.payload); if(!current.success) return {ok:false as const,message:"A raça atual possui dados inválidos."};
    const traits=current.data.traits.length ? current.data.traits.map((t,i)=>i===0?{name:d.traitName,description:d.traitDescription}:t) : [{name:d.traitName,description:d.traitDescription}];
    const payload={...current.data,description:d.description,specialization:d.specialization,difficulty:d.difficulty,baseHp:d.baseHp,baseMana:d.baseMana,imageUrl:d.imageUrl,attributeBonuses:d.bonuses,traits};
    const {data:updated,error}=await client.from("v2_content").update({name:d.name,slug:createRaceSlug(d.name),payload:payload as unknown as Json,updated_by:account.id}).eq("id",id).eq("revision",row.revision).select("id").maybeSingle(); if(error||!updated) return {ok:false as const,message:"Não foi possível salvar a raça."};
  } else {
    const payload=createEmptyRacePayload(); payload.description=d.description; payload.specialization=d.specialization; payload.difficulty=d.difficulty; payload.baseHp=d.baseHp; payload.baseMana=d.baseMana; payload.imageUrl=d.imageUrl; payload.attributeBonuses=d.bonuses; payload.traits=[{name:d.traitName,description:d.traitDescription}];
    const {data:created,error}=await client.from("v2_content").insert({content_type:"race",name:d.name,slug:createRaceSlug(d.name),status:"draft",payload:payload as unknown as Json,created_by:account.id,updated_by:account.id}).select("id").single(); if(error||!created) return {ok:false as const,message:"Não foi possível criar a raça. Verifique se o nome já existe."}; id=created.id;
  }
  await history(account.id,d.id?"race.updated_from_studio":"race.created_from_studio","race",id,{name:d.name}); revalidatePath("/admin/racas"); revalidatePath("/racas"); revalidatePath("/admin/estudio"); return {ok:true as const,message:`${d.name} foi ${d.id?"atualizada":"criada como rascunho"}.`,id};
}

export async function saveSimpleItemAction(input: unknown) {
  const account=await requireAdministrativeAccount(); const parsed=simpleItemDraftSchema.safeParse(input); if(!parsed.success) return {ok:false as const,message:"Revise os campos do item."}; const client=await createServerSupabaseClient(); if(!client)return {ok:false as const,message:"Banco indisponível."}; const d=parsed.data;
  const payload={name:d.name,description:d.description,category:d.category,slot:d.slot,rarity:d.rarity,price:d.price,image_url:d.imageUrl||null,attributes:attributesWithoutZero(d.attributes),special_effects:specialEffects(d),two_handed:d.twoHanded,active:true,updated_at:new Date().toISOString()}; let id=d.id;
  if(id){const {error}=await client.from("v2_shop_items").update(payload).eq("id",id).neq("slot","title"); if(error)return {ok:false as const,message:"Não foi possível atualizar o item."};}
  else {const {data,error}=await client.from("v2_shop_items").insert({...payload,slug:`${slugify(d.name)}-${Date.now().toString(36)}`,sort_order:99999}).select("id").single(); if(error||!data)return {ok:false as const,message:"Não foi possível criar o item."}; id=data.id;}
  await history(account.id,d.id?"shop_item.updated_from_studio":"shop_item.created_from_studio","shop_item",id,{name:d.name,rarity:d.rarity}); revalidatePath("/admin/itens"); revalidatePath("/loja"); revalidatePath("/admin/estudio"); return {ok:true as const,message:`${d.name} foi ${d.id?"atualizado":"criado"}.`,id};
}

export async function saveSimpleTitleAction(input: unknown) {
  const account=await requireAdministrativeAccount(); const parsed=simpleTitleDraftSchema.safeParse(input); if(!parsed.success)return {ok:false as const,message:"Revise os campos do Título."}; const client=await createServerSupabaseClient(); if(!client)return {ok:false as const,message:"Banco indisponível."}; const d=parsed.data;
  const payload={name:d.name,description:d.description,category:"Título",price:0,slot:"title",rarity:"awakened",attributes:d.attributes,title_style:{primary:d.primary,secondary:d.secondary,glow:d.glow},special_effects:specialEffects(d),two_handed:false,active:false,updated_at:new Date().toISOString()}; let id=d.id;
  if(id){const {error}=await client.from("v2_shop_items").update(payload).eq("id",id).eq("slot","title"); if(error)return {ok:false as const,message:"Não foi possível atualizar o Título."};}
  else {const {data,error}=await client.from("v2_shop_items").insert({...payload,slug:`titulo-${slugify(d.name)}-${Date.now().toString(36)}`,sort_order:99999}).select("id").single(); if(error||!data)return {ok:false as const,message:"Não foi possível criar o Título."}; id=data.id;}
  await history(account.id,d.id?"title.updated_from_studio":"title.created_from_studio","title",id,{name:d.name}); revalidatePath("/admin/titulos"); revalidatePath("/arena"); revalidatePath("/admin/estudio"); return {ok:true as const,message:`${d.name} foi ${d.id?"atualizado":"criado"}.`,id};
}

function extractOutputText(payload:unknown){ if(!payload||typeof payload!=="object")return""; const output=(payload as {output?:unknown}).output;if(!Array.isArray(output))return"";for(const item of output){if(!item||typeof item!=="object")continue;const content=(item as {content?:unknown}).content;if(!Array.isArray(content))continue;for(const part of content){if(part&&typeof part==="object"&&"text" in part&&typeof (part as {text?:unknown}).text==="string")return (part as {text:string}).text;}}return""; }
function schemaFor(kind:StudioContentKind){
  const attrs={type:"object",additionalProperties:false,required:["FOR","DEF","RES","INI","INT","ARC"],properties:Object.fromEntries(["FOR","DEF","RES","INI","INT","ARC"].map(k=>[k,{type:"integer",minimum:0,maximum:999}]))};
  if(kind==="class") return {type:"object",additionalProperties:false,required:["id","name","description","specialization","difficulty","primaryAttribute","imageUrl","resourceName","resourceMaximum","passiveName","passiveDescription"],properties:{id:{type:"string"},name:{type:"string"},description:{type:"string"},specialization:{type:"string"},difficulty:{type:"integer",minimum:1,maximum:5},primaryAttribute:{type:"string",enum:["FOR","DEF","RES","INI","INT","ARC"]},imageUrl:{type:"string"},resourceName:{type:"string"},resourceMaximum:{type:"integer",minimum:1,maximum:999},passiveName:{type:"string"},passiveDescription:{type:"string"}}};
  if(kind==="race") return {type:"object",additionalProperties:false,required:["id","name","description","specialization","difficulty","baseHp","baseMana","imageUrl","bonuses","traitName","traitDescription"],properties:{id:{type:"string"},name:{type:"string"},description:{type:"string"},specialization:{type:"string"},difficulty:{type:"integer",minimum:1,maximum:5},baseHp:{type:"integer",minimum:150,maximum:800},baseMana:{type:"integer",minimum:0,maximum:999},imageUrl:{type:"string"},bonuses:attrs,traitName:{type:"string"},traitDescription:{type:"string"}}};
  if(kind==="item") return {type:"object",additionalProperties:false,required:["id","name","description","category","slot","rarity","price","imageUrl","attributes","twoHanded","effectKind","effectName","effectDescription","effectPower","effectDuration"],properties:{id:{type:"string"},name:{type:"string"},description:{type:"string"},category:{type:"string"},slot:{type:"string",enum:["head","torso","hands","legs","feet","main_weapon","off_weapon","necklace","ring","earring","cape"]},rarity:{type:"string",enum:["common","uncommon","rare","epic","legendary","mythic"]},price:{type:"integer",minimum:0},imageUrl:{type:"string"},attributes:attrs,twoHanded:{type:"boolean"},effectKind:{type:"string",enum:["","POISON","BLEED","LIFE_STEAL","COOLDOWN_REDUCTION","FREEZE"]},effectName:{type:"string"},effectDescription:{type:"string"},effectPower:{type:"number",minimum:0},effectDuration:{type:"integer",minimum:0,maximum:20}}};
  return {type:"object",additionalProperties:false,required:["id","name","description","attributes","primary","secondary","glow","effectKind","effectName","effectDescription","effectPower","effectDuration"],properties:{id:{type:"string"},name:{type:"string"},description:{type:"string"},attributes:attrs,primary:{type:"string"},secondary:{type:"string"},glow:{type:"string"},effectKind:{type:"string",enum:["","POISON","BLEED","LIFE_STEAL","COOLDOWN_REDUCTION","FREEZE"]},effectName:{type:"string"},effectDescription:{type:"string"},effectPower:{type:"number",minimum:0},effectDuration:{type:"integer",minimum:0,maximum:20}}};
}
export async function generateStudioContentWithAiAction(_previous:ContentAiState,formData:FormData):Promise<ContentAiState>{
  await requireAdministrativeAccount(); const kind=String(formData.get("kind")||"") as StudioContentKind; if(!["class","race","item","title"].includes(kind))return{status:"error",message:"Escolha o tipo de conteúdo."}; const prompt=String(formData.get("prompt")||"").trim(); if(prompt.length<5)return{status:"error",message:"Descreva melhor o que deseja criar."}; const key=process.env.OPENAI_API_KEY;if(!key)return{status:"error",message:"Configure OPENAI_API_KEY na Vercel para ativar o Assistente."};
  const content:Array<Record<string,unknown>>=[{type:"input_text",text:prompt}]; const image=formData.get("image"); if(image instanceof File&&image.size>0){if(image.size>4_000_000)return{status:"error",message:"A imagem deve ter no máximo 4 MB."};if(!image.type.startsWith("image/"))return{status:"error",message:"Envie uma imagem válida."};content.push({type:"input_image",image_url:`data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`,detail:"auto"});}
  const instructions=`Você é o Assistente de conteúdo do RPG Wonderland. Gere uma proposta de ${kind} pronta para revisão de um ADM. Respeite fantasia medieval/mágica, equilíbrio e clareza. Não invente porcentagens de atributos quando multiplicadores ou valores inteiros forem mais adequados. Para raças, a soma dos bônus deve ser no máximo 25. Para itens, efeitos especiais fortes devem ser raros e coerentes com a raridade. Não publique nada: apenas produza a proposta estruturada.`;
  try{const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_ADMIN_MODEL||"gpt-5",instructions,input:[{role:"user",content}],text:{format:{type:"json_schema",name:`wonderland_${kind}_draft`,strict:true,schema:schemaFor(kind)}}}),cache:"no-store"});if(!response.ok){console.error("Studio content AI",response.status,(await response.text()).slice(0,300));return{status:"error",message:"A IA não conseguiu criar a proposta agora."};}const raw=extractOutputText(await response.json());const json=JSON.parse(raw);const parser=kind==="class"?simpleClassDraftSchema:kind==="race"?simpleRaceDraftSchema:kind==="item"?simpleItemDraftSchema:simpleTitleDraftSchema;const parsed=parser.safeParse(json);if(!parsed.success)return{status:"error",message:"A proposta da IA não passou pela validação do Wonderland."};return{status:"success",message:"Proposta criada. Revise antes de salvar.",kind,draft:parsed.data as StudioDraft};}catch(error){console.error("Studio content AI failure",error);return{status:"error",message:"Não foi possível conectar ao Assistente de Wonderland."};}
}
