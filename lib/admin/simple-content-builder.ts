import { z } from "zod";

export const attributeDraftSchema = z.object({
  FOR: z.number().int().min(0).max(999), DEF: z.number().int().min(0).max(999), RES: z.number().int().min(0).max(999),
  INI: z.number().int().min(0).max(999), INT: z.number().int().min(0).max(999), ARC: z.number().int().min(0).max(999),
});
export type AttributeDraft = z.infer<typeof attributeDraftSchema>;
export const emptyAttributes = (): AttributeDraft => ({ FOR:0, DEF:0, RES:0, INI:0, INT:0, ARC:0 });

export const simpleClassDraftSchema = z.object({
  id: z.string().optional().default(""), name: z.string().trim().min(2).max(80), description: z.string().trim().min(10).max(1200),
  specialization: z.string().trim().min(2).max(80), difficulty: z.number().int().min(1).max(5), primaryAttribute: z.enum(["FOR","DEF","RES","INI","INT","ARC"]),
  imageUrl: z.string().trim().max(1000), resourceName: z.string().trim().min(2).max(60), resourceMaximum: z.number().int().min(1).max(999),
  passiveName: z.string().trim().min(2).max(100), passiveDescription: z.string().trim().min(5).max(700),
});
export type SimpleClassDraft = z.infer<typeof simpleClassDraftSchema>;
export const simpleClassDefaults = (): SimpleClassDraft => ({ id:"", name:"Nova classe", description:"Descreva a identidade, função e estilo de combate da classe.", specialization:"DPS Físico", difficulty:2, primaryAttribute:"FOR", imageUrl:"", resourceName:"Recurso", resourceMaximum:100, passiveName:"Passiva da classe", passiveDescription:"Descreva a característica permanente desta classe." });

export const simpleRaceDraftSchema = z.object({
  id: z.string().optional().default(""), name: z.string().trim().min(2).max(80), description: z.string().trim().min(10).max(1200), specialization: z.string().trim().min(2).max(80),
  difficulty: z.number().int().min(1).max(5), baseHp: z.number().int().min(150).max(800), baseMana: z.number().int().min(0).max(999), imageUrl: z.string().trim().max(1000),
  bonuses: attributeDraftSchema.refine((value) => Object.values(value).reduce((sum,n)=>sum+n,0) <= 25, "Bônus raciais não podem ultrapassar 25 pontos."),
  traitName: z.string().trim().min(2).max(100), traitDescription: z.string().trim().min(5).max(700),
});
export type SimpleRaceDraft = z.infer<typeof simpleRaceDraftSchema>;
export const simpleRaceDefaults = (): SimpleRaceDraft => ({ id:"", name:"Nova raça", description:"Descreva origem, aparência, cultura e papel desta raça em Wonderland.", specialization:"Versátil", difficulty:2, baseHp:300, baseMana:0, imageUrl:"", bonuses:emptyAttributes(), traitName:"Traço racial", traitDescription:"Descreva uma característica permanente desta raça." });

export const itemSlots = ["head","torso","hands","legs","feet","main_weapon","off_weapon","necklace","ring","earring","cape"] as const;
export const rarities = ["common","uncommon","rare","epic","legendary","mythic"] as const;
export const effectKinds = ["","POISON","BLEED","LIFE_STEAL","COOLDOWN_REDUCTION","FREEZE"] as const;
export const simpleItemDraftSchema = z.object({
  id:z.string().optional().default(""), name:z.string().trim().min(2).max(100), description:z.string().trim().min(5).max(500), category:z.string().trim().min(2).max(50),
  slot:z.enum(itemSlots), rarity:z.enum(rarities), price:z.number().int().min(0).max(999999999), imageUrl:z.string().trim().max(1000), attributes:attributeDraftSchema,
  twoHanded:z.boolean(), effectKind:z.enum(effectKinds), effectName:z.string().trim().max(100), effectDescription:z.string().trim().max(500), effectPower:z.number().min(0).max(1000), effectDuration:z.number().int().min(0).max(20),
});
export type SimpleItemDraft = z.infer<typeof simpleItemDraftSchema>;
export const simpleItemDefaults = (): SimpleItemDraft => ({ id:"", name:"Novo item", description:"Descreva o equipamento e sua função.", category:"Equipamento", slot:"main_weapon", rarity:"common", price:0, imageUrl:"", attributes:emptyAttributes(), twoHanded:false, effectKind:"", effectName:"", effectDescription:"", effectPower:0, effectDuration:0 });

export const simpleTitleDraftSchema = z.object({
  id:z.string().optional().default(""), name:z.string().trim().min(3).max(100), description:z.string().trim().min(10).max(500), attributes:attributeDraftSchema,
  primary:z.string().regex(/^#[0-9a-fA-F]{6}$/), secondary:z.string().regex(/^#[0-9a-fA-F]{6}$/), glow:z.string().regex(/^#[0-9a-fA-F]{6}$/),
  effectKind:z.enum(effectKinds), effectName:z.string().trim().max(100), effectDescription:z.string().trim().max(500), effectPower:z.number().min(0).max(1000), effectDuration:z.number().int().min(0).max(20),
});
export type SimpleTitleDraft = z.infer<typeof simpleTitleDraftSchema>;
export const simpleTitleDefaults = (): SimpleTitleDraft => ({ id:"", name:"Novo Título", description:"Descreva por que este Título é concedido.", attributes:emptyAttributes(), primary:"#fff1b5", secondary:"#1f7a4c", glow:"#d7ad45", effectKind:"", effectName:"", effectDescription:"", effectPower:0, effectDuration:0 });
