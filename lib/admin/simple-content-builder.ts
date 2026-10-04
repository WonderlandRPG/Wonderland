import { z } from "zod";
import { itemCatalogSlots, itemRarities } from "@/lib/game/equipment";

export const reworkItemAttributeDraftSchema = z.object({
  FOR: z.number().int().min(0).max(999), DEF: z.number().int().min(0).max(999), RES: z.number().int().min(0).max(999),
  INI: z.number().int().min(0).max(999), INT: z.number().int().min(0).max(999), HP: z.number().int().min(0).max(999),
});
export type ReworkItemAttributeDraft = z.infer<typeof reworkItemAttributeDraftSchema>;
export const emptyReworkItemAttributes = (): ReworkItemAttributeDraft => ({ FOR:0, DEF:0, RES:0, INI:0, INT:0, HP:0 });

export const itemSlots = itemCatalogSlots;
export const rarities = itemRarities;
export const effectKinds = ["","POISON","BLEED","LIFE_STEAL","COOLDOWN_REDUCTION","FREEZE"] as const;
export const simpleItemDraftSchema = z.object({
  id:z.string().optional().default(""), name:z.string().trim().min(2).max(100), description:z.string().trim().min(5).max(500), category:z.string().trim().min(2).max(50),
  slot:z.enum(itemSlots), rarity:z.enum(rarities), price:z.number().int().min(0).max(999999999), imageUrl:z.string().trim().max(1000), attributes:reworkItemAttributeDraftSchema,
  twoHanded:z.boolean(), effectKind:z.enum(effectKinds), effectName:z.string().trim().max(100), effectDescription:z.string().trim().max(500), effectPower:z.number().min(0).max(1000), effectDuration:z.number().int().min(0).max(20),
}).superRefine((item, context) => {
  if (item.twoHanded && !["main_weapon", "off_weapon"].includes(item.slot)) {
    context.addIssue({ code:"custom", path:["twoHanded"], message:"Somente armas podem ocupar as duas mãos." });
  }
  if (item.effectKind && !item.effectName) {
    context.addIssue({ code:"custom", path:["effectName"], message:"Informe o nome do efeito especial." });
  }
});
export type SimpleItemDraft = z.infer<typeof simpleItemDraftSchema>;
export const simpleItemDefaults = (): SimpleItemDraft => ({ id:"", name:"Novo item", description:"Descreva o equipamento e sua função.", category:"Equipamento", slot:"main_weapon", rarity:"common", price:0, imageUrl:"", attributes:emptyReworkItemAttributes(), twoHanded:false, effectKind:"", effectName:"", effectDescription:"", effectPower:0, effectDuration:0 });

export const simpleTitleDraftSchema = z.object({
  id:z.string().optional().default(""), name:z.string().trim().min(3).max(100), description:z.string().trim().min(10).max(500), attributes:reworkItemAttributeDraftSchema,
  primary:z.string().regex(/^#[0-9a-fA-F]{6}$/), secondary:z.string().regex(/^#[0-9a-fA-F]{6}$/), glow:z.string().regex(/^#[0-9a-fA-F]{6}$/),
  effectKind:z.enum(effectKinds), effectName:z.string().trim().max(100), effectDescription:z.string().trim().max(500), effectPower:z.number().min(0).max(1000), effectDuration:z.number().int().min(0).max(20),
});
export type SimpleTitleDraft = z.infer<typeof simpleTitleDraftSchema>;
export const simpleTitleDefaults = (): SimpleTitleDraft => ({ id:"", name:"Novo Título", description:"Descreva por que este Título é concedido.", attributes:emptyReworkItemAttributes(), primary:"#fff1b5", secondary:"#1f7a4c", glow:"#d7ad45", effectKind:"", effectName:"", effectDescription:"", effectPower:0, effectDuration:0 });
