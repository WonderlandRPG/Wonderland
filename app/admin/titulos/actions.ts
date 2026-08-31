"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  titleAvailabilities,
  titleCategories,
  titleFrames,
  titleRarities,
} from "@/lib/game/title-style";

const schema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(500),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  glow: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sigil: z.string().trim().min(1).max(4),
  frame: z.enum(titleFrames),
  titleCategory: z.enum(titleCategories),
  availability: z.enum(titleAvailabilities),
  acquisition: z.string().trim().min(5).max(300),
  rarity: z.enum(titleRarities),
  animated: z.enum(["yes", "no"]),
  FOR: z.coerce.number().int().min(0).max(999),
  DEF: z.coerce.number().int().min(0).max(999),
  RES: z.coerce.number().int().min(0).max(999),
  INI: z.coerce.number().int().min(0).max(999),
  INT: z.coerce.number().int().min(0).max(999),
  ARC: z.coerce.number().int().min(0).max(999),
  effectKind: z.enum(["", "POISON", "BLEED", "LIFE_STEAL", "COOLDOWN_REDUCTION", "FREEZE"]),
  effectName: z.string().trim().max(100),
  effectDescription: z.string().trim().max(500),
  effectPower: z.coerce.number().min(0).max(1000),
  effectDuration: z.coerce.number().int().min(0).max(20),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveTitleAdminAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/titulos?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/titulos?status=erro");
  const data = parsed.data;
  const attributes = Object.fromEntries(
    (["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const).map((key) => [key, data[key]]),
  );
  const specialEffects =
    data.effectKind && data.effectName
      ? [
          {
            key: `${data.id || slugify(data.name)}-title-effect`,
            kind: data.effectKind,
            name: data.effectName,
            description: data.effectDescription || "Efeito concedido pelo Título equipado.",
            trigger: data.effectKind === "COOLDOWN_REDUCTION" ? "ON_SKILL_USE" : "ON_DAMAGE_DEALT",
            duration: data.effectDuration,
            power: data.effectPower,
            modifiers: {},
          },
        ]
      : [];
  const payload = {
    name: data.name,
    description: data.description,
    category: "Título",
    price: 0,
    slot: "title",
    rarity: data.rarity,
    attributes,
    title_style: {
      primary: data.primary,
      secondary: data.secondary,
      glow: data.glow,
      accent: data.accent,
      sigil: data.sigil,
      frame: data.frame,
      category: data.titleCategory,
      availability: data.availability,
      acquisition: data.acquisition,
      animated: data.animated === "yes",
    },
    special_effects: specialEffects,
    two_handed: false,
    active: false,
    updated_at: new Date().toISOString(),
  };
  const result = data.id
    ? await client.from("v2_shop_items").update(payload).eq("id", data.id).eq("slot", "title")
    : await client.from("v2_shop_items").insert({
        ...payload,
        slug: `titulo-${slugify(data.name)}-${Date.now().toString(36)}`,
        sort_order: 99999,
      });
  if (result.error) redirect("/admin/titulos?status=erro");
  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: data.id ? "title.updated" : "title.created",
    target_type: "title",
    target_id: data.id || null,
    details: {
      name: data.name,
      rarity: data.rarity,
      category: data.titleCategory,
      availability: data.availability,
      attributes,
      style: payload.title_style,
    },
  });
  revalidatePath("/admin/titulos");
  revalidatePath("/admin/console");
  revalidatePath("/admin/eventos");
  revalidatePath("/presenca");
  revalidatePath("/personagens/[id]", "page");
  revalidatePath("/jogadores/[id]", "page");
  revalidatePath("/perfil");
  revalidatePath("/ranking");
  revalidatePath("/arena");
  redirect("/admin/titulos?status=salvo");
}

export async function deleteTitleAdminAction(formData: FormData) {
  await requireAdministrativeAccount();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/titulos?status=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/titulos?status=erro");
  const { error } = await client.rpc("v2_admin_delete_title", { p_title_id: id.data });
  if (error) redirect(`/admin/titulos?status=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/titulos");
  revalidatePath("/admin/console");
  revalidatePath("/admin/eventos");
  revalidatePath("/personagens", "layout");
  revalidatePath("/arena");
  redirect("/admin/titulos?status=excluido");
}
