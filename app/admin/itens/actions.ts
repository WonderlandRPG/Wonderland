"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const slotSchema = z.enum([
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
]);
const schema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500),
  category: z.string().trim().min(2).max(50),
  slot: slotSchema,
  price: z.coerce.number().int().min(0).max(999999999),
  imageUrl: z.union([z.literal(""), z.url().refine((value) => /^https?:\/\//.test(value))]),
  sortOrder: z.coerce.number().int().min(0).max(99999),
  FOR: z.coerce.number().int().min(0).max(999),
  DEF: z.coerce.number().int().min(0).max(999),
  RES: z.coerce.number().int().min(0).max(999),
  INI: z.coerce.number().int().min(0).max(999),
  INT: z.coerce.number().int().min(0).max(999),
  ARC: z.coerce.number().int().min(0).max(999),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary", "mythic"]),
  effectName: z.string().trim().max(100),
  effectDescription: z.string().trim().max(500),
  effectFOR: z.coerce.number().int().min(0).max(999),
  effectDEF: z.coerce.number().int().min(0).max(999),
  effectRES: z.coerce.number().int().min(0).max(999),
  effectINI: z.coerce.number().int().min(0).max(999),
  effectINT: z.coerce.number().int().min(0).max(999),
  effectARC: z.coerce.number().int().min(0).max(999),
  effectDuration: z.coerce.number().int().min(0).max(99),
  effectShield: z.coerce.number().int().min(0).max(99999),
  effectMaxHpPercent: z.coerce.number().min(0).max(100),
  effectMana: z.coerce.number().int().min(0).max(9999),
  effectClassResource: z.coerce.number().int().min(0).max(9999),
  effectRaceResource: z.coerce.number().int().min(0).max(9999),
});

export async function updateItemAdminAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const parsed = schema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    slot: formData.get("slot"),
    price: formData.get("price"),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    sortOrder: formData.get("sortOrder"),
    FOR: formData.get("FOR"),
    DEF: formData.get("DEF"),
    RES: formData.get("RES"),
    INI: formData.get("INI"),
    INT: formData.get("INT"),
    ARC: formData.get("ARC"),
    rarity: formData.get("rarity"),
    effectName: formData.get("effectName") ?? "",
    effectDescription: formData.get("effectDescription") ?? "",
    effectFOR: formData.get("effectFOR") ?? 0,
    effectDEF: formData.get("effectDEF") ?? 0,
    effectRES: formData.get("effectRES") ?? 0,
    effectINI: formData.get("effectINI") ?? 0,
    effectINT: formData.get("effectINT") ?? 0,
    effectARC: formData.get("effectARC") ?? 0,
    effectDuration: formData.get("effectDuration") ?? 0,
    effectShield: formData.get("effectShield") ?? 0,
    effectMaxHpPercent: formData.get("effectMaxHpPercent") ?? 0,
    effectMana: formData.get("effectMana") ?? 0,
    effectClassResource: formData.get("effectClassResource") ?? 0,
    effectRaceResource: formData.get("effectRaceResource") ?? 0,
  });
  if (!parsed.success) redirect("/admin/itens?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/itens?status=erro");
  const attributes = Object.fromEntries(
    (["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const)
      .filter((key) => parsed.data[key] > 0)
      .map((key) => [key, parsed.data[key]]),
  );
  const { error } = await client
    .from("v2_shop_items")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      slot: parsed.data.slot,
      price: parsed.data.price,
      image_url: parsed.data.imageUrl || null,
      sort_order: parsed.data.sortOrder,
      attributes,
      rarity: parsed.data.rarity,
      special_effects: parsed.data.effectName ? [{
        key: `${parsed.data.id}-admin-effect`,
        name: parsed.data.effectName,
        description: parsed.data.effectDescription || "Efeito especial configurado pelo Painel ADM.",
        trigger: "BATTLE_START",
        duration: parsed.data.effectDuration,
        shield: parsed.data.effectShield,
        maxHpPercent: parsed.data.effectMaxHpPercent,
        mana: parsed.data.effectMana,
        classResource: parsed.data.effectClassResource,
        raceResource: parsed.data.effectRaceResource,
        modifiers: Object.fromEntries(
          (["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const)
            .filter((attribute) => parsed.data[`effect${attribute}`] > 0)
            .map((attribute) => [attribute, parsed.data[`effect${attribute}`]]),
        ),
      }] : [],
      two_handed: formData.get("twoHanded") === "on",
      active: formData.get("active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error) redirect("/admin/itens?status=erro");
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "shop_item.updated",
    target_type: "shop_item",
    target_id: parsed.data.id,
    details: { name: parsed.data.name, slot: parsed.data.slot, attributes },
  });
  revalidatePath("/admin/itens");
  revalidatePath("/loja");
  redirect("/admin/itens?status=salvo");
}
