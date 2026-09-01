"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Database, Json } from "@/lib/db/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const skillDamageTypeSchema = z.enum(["physical", "magic", "true"]);
const basicDamageTypeSchema = z.enum(["physical", "magic"]);
const effectSchema = z.enum(["none", "root", "stun", "push"]);
const aiProfileSchema = z.enum(["aggressive", "ranged", "controller"]);

const schema = z.object({
  id: z.uuid(),
  hp: z.coerce.number().int().min(1).max(999999),
  movement: z.coerce.number().int().min(0).max(20),
  basicAttackRange: z.coerce.number().int().min(1).max(20),
  basicAttackDamageType: basicDamageTypeSchema,
  aiProfile: aiProfileSchema,
  FOR: z.coerce.number().int().min(0).max(9999),
  DEF: z.coerce.number().int().min(0).max(9999),
  RES: z.coerce.number().int().min(0).max(9999),
  INI: z.coerce.number().int().min(0).max(9999),
  INT: z.coerce.number().int().min(0).max(9999),
  ARC: z.coerce.number().int().min(0).max(9999),
  resistances: z.string().max(1000),
});

const skillSchema = z.object({
  name: z.string().trim().max(100),
  damageType: skillDamageTypeSchema,
  base: z.coerce.number().min(0).max(99999),
  range: z.coerce.number().int().min(1).max(20),
  cooldown: z.coerce.number().int().min(0).max(20),
  effect: effectSchema,
  duration: z.coerce.number().int().min(0).max(20),
  distance: z.coerce.number().int().min(0).max(20),
});

function splitList(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "habilidade";
}

function parseSkill(formData: FormData, index: number, creatureId: string) {
  const parsed = skillSchema.safeParse({
    name: formData.get(`skill${index}Name`) ?? "",
    damageType: formData.get(`skill${index}DamageType`) ?? "physical",
    base: formData.get(`skill${index}Base`) ?? 0,
    range: formData.get(`skill${index}Range`) ?? 1,
    cooldown: formData.get(`skill${index}Cooldown`) ?? 0,
    effect: formData.get(`skill${index}Effect`) ?? "none",
    duration: formData.get(`skill${index}Duration`) ?? 0,
    distance: formData.get(`skill${index}Distance`) ?? 0,
  });
  if (!parsed.success || !parsed.data.name) return null;

  const data = parsed.data;
  const operations: Array<Record<string, unknown>> = [
    {
      operation: "DAMAGE",
      target: "enemy",
      base: data.base,
      scaling: [],
      damageType: data.damageType,
      status: "",
      duration: 0,
      chance: 100,
      stacks: 0,
      maxStacks: 0,
      distance: 0,
      modifiers: [],
    },
  ];

  if (data.effect === "root" || data.effect === "stun") {
    operations.push({
      operation: data.effect === "root" ? "ROOT" : "STUN",
      target: "enemy",
      base: 0,
      scaling: [],
      damageType: "none",
      status: `${data.effect}-${slugify(data.name)}`,
      duration: Math.max(1, data.duration),
      chance: 100,
      stacks: 1,
      maxStacks: 1,
      distance: 0,
      modifiers: [],
    });
  }

  if (data.effect === "push") {
    operations.push({
      operation: "PUSH",
      target: "enemy",
      base: 0,
      scaling: [],
      damageType: "none",
      status: "",
      duration: 0,
      chance: 100,
      stacks: 0,
      maxStacks: 0,
      distance: Math.max(1, data.distance),
      modifiers: [],
    });
  }

  return {
    key: `criatura-${creatureId.slice(0, 8)}-${index}-${slugify(data.name)}`,
    name: data.name,
    level: 1,
    category: "Criatura",
    type: "Ativa",
    effect: `${data.name} é uma habilidade tática configurada pelo Painel ADM.`,
    kind: "damage" as const,
    damageType: data.damageType,
    target: "enemy" as const,
    resource: "none" as const,
    resourceKey: "class" as const,
    cost: 0,
    cooldown: data.cooldown,
    range: data.range,
    area: 0,
    duration: data.effect === "root" || data.effect === "stun" ? Math.max(1, data.duration) : 0,
    scaling: [],
    reachText: `${data.range} casa(s)`,
    conditions: [],
    systemRule:
      data.effect === "none"
        ? "Causa dano ao alvo."
        : data.effect === "push"
          ? `Causa dano e empurra ${Math.max(1, data.distance)} casa(s).`
          : `Causa dano e aplica ${data.effect.toUpperCase()} por ${Math.max(1, data.duration)} turno(s).`,
    playerDescription: `${data.name}: ${data.base} de dano base, alcance ${data.range}.`,
    chance: 100,
    maxStacks: 1,
    operations,
  };
}

export async function updateCreatureCombatProfileAdminAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const parsed = schema.safeParse({
    id: formData.get("id"),
    hp: formData.get("hp"),
    movement: formData.get("movement"),
    basicAttackRange: formData.get("basicAttackRange"),
    basicAttackDamageType: formData.get("basicAttackDamageType"),
    aiProfile: formData.get("aiProfile"),
    FOR: formData.get("FOR"),
    DEF: formData.get("DEF"),
    RES: formData.get("RES"),
    INI: formData.get("INI"),
    INT: formData.get("INT"),
    ARC: formData.get("ARC"),
    resistances: formData.get("resistances") ?? "",
  });
  if (!parsed.success) redirect("/admin/bestiario?status=erro");

  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/bestiario?status=erro");

  const skills = [1, 2, 3]
    .map((index) => parseSkill(formData, index, parsed.data.id))
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill));

  const combatProfile = {
    version: 2,
    hp: parsed.data.hp,
    attributes: {
      FOR: parsed.data.FOR,
      DEF: parsed.data.DEF,
      RES: parsed.data.RES,
      INI: parsed.data.INI,
      INT: parsed.data.INT,
      ARC: parsed.data.ARC,
    },
    movement: parsed.data.movement,
    basicAttackRange: parsed.data.basicAttackRange,
    basicAttackDamageType: parsed.data.basicAttackDamageType,
    aiProfile: parsed.data.aiProfile,
    resistances: splitList(parsed.data.resistances),
    skills,
  };

  const updatePayload = {
    combat_profile: combatProfile as unknown as Json,
    updated_at: new Date().toISOString(),
  } as Database["public"]["Tables"]["v2_creatures"]["Update"] & { combat_profile: Json };

  const { data: creature, error } = await client
    .from("v2_creatures")
    .update(updatePayload)
    .eq("id", parsed.data.id)
    .select("name, rank")
    .single();

  if (error || !creature) redirect("/admin/bestiario?status=erro");

  await client.from("v2_admin_history").insert({
    actor_id: account.id,
    action: "bestiary.combat_profile.updated",
    target_type: "creature",
    target_id: parsed.data.id,
    details: {
      name: creature.name,
      rank: creature.rank,
      aiProfile: parsed.data.aiProfile,
      hp: parsed.data.hp,
      skills: skills.map((skill) => skill.name),
    },
  });

  revalidatePath("/admin/bestiario");
  revalidatePath("/bestiario");
  revalidatePath("/arena/mapa-tatico");
  redirect("/admin/bestiario?status=salvo");
}
