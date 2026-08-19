"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseClassPayload } from "@/lib/game/classes";
import type { Json } from "@/lib/db/types";
import {
  buildClassSkillFromSimpleDraft,
  simpleSkillDraftSchema,
  type SimpleSkillDraft,
} from "@/lib/admin/simple-skill-builder";

const targetSchema = z.object({
  classId: z.uuid(),
  draft: simpleSkillDraftSchema,
});

export type StudioAiState =
  | { status: "idle"; message: ""; draft?: undefined }
  | { status: "error"; message: string; draft?: undefined }
  | { status: "success"; message: string; draft: SimpleSkillDraft };

export const initialStudioAiState: StudioAiState = { status: "idle", message: "" };

function draftJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "name","description","level","effectType","targetSide","targetCount","attribute","multiplier","baseValue","damageType","resource","resourceKey","cost","cooldown","duration","chance","modifierAttribute","modifierValue","statusName"
    ],
    properties: {
      name: { type: "string" }, description: { type: "string" }, level: { type: "integer", minimum: 1, maximum: 100 },
      effectType: { type: "string", enum: ["damage","heal","shield","buff","debuff","stun"] },
      targetSide: { type: "string", enum: ["self","ally","enemy"] }, targetCount: { type: "integer", minimum: 1, maximum: 4 },
      attribute: { type: "string", enum: ["FOR","DEF","RES","INI","INT","ARC"] }, multiplier: { type: "number", minimum: 0, maximum: 10 },
      baseValue: { type: "number", minimum: 0 }, damageType: { type: "string", enum: ["physical","magic","true","none"] },
      resource: { type: "string", enum: ["mana","life","special","none"] }, resourceKey: { type: "string", enum: ["class","race"] },
      cost: { type: "number", minimum: 0 }, cooldown: { type: "integer", minimum: 0, maximum: 20 }, duration: { type: "integer", minimum: 0, maximum: 20 },
      chance: { type: "number", minimum: 1, maximum: 100 }, modifierAttribute: { type: "string", enum: ["FOR","DEF","RES","INI","INT","ARC"] },
      modifierValue: { type: "number", minimum: 0 }, statusName: { type: "string" }
    }
  } as const;
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return "";
}

export async function generateSkillWithAiAction(
  _previousState: StudioAiState,
  formData: FormData,
): Promise<StudioAiState> {
  await requireAdministrativeAccount();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (prompt.length < 5) return { status: "error", message: "Descreva melhor a habilidade que deseja criar." };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { status: "error", message: "A IA está instalada, mas falta configurar OPENAI_API_KEY na Vercel." };

  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    if (image.size > 4_000_000) return { status: "error", message: "A imagem deve ter no máximo 4 MB." };
    if (!image.type.startsWith("image/")) return { status: "error", message: "Envie um arquivo de imagem válido." };
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    content.push({ type: "input_image", image_url: `data:${image.type};base64,${base64}`, detail: "auto" });
  }

  const instruction = [
    "Você é o designer de habilidades do RPG Wonderland.",
    "Transforme o pedido do ADM em uma habilidade JRPG por turnos.",
    "Não use casas, alcance espacial, movimento em grid ou porcentagens de atributo.",
    "Use multiplicadores como 1x, 1.5x, 2x, 3x.",
    "Dano em área pode atingir entre 2 e 4 alvos.",
    "Curas, buffs e debuffs devem escolher alvo coerente.",
    "FOR é físico, INT é mágico, ARC fortalece cura/escudo/buff/debuff, INI controla velocidade/ordem.",
    "Escreva uma descrição clara, temática e boa para o jogador.",
    "Se o pedido for ambíguo, faça uma escolha equilibrada e conservadora."
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_ADMIN_MODEL || "gpt-5",
        instructions: instruction,
        input: [{ role: "user", content }],
        text: { format: { type: "json_schema", name: "wonderland_skill_draft", strict: true, schema: draftJsonSchema() } },
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI admin studio error", response.status, detail.slice(0, 400));
      return { status: "error", message: "A IA não conseguiu gerar a habilidade agora." };
    }
    const raw = extractOutputText(await response.json());
    const parsed = simpleSkillDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { status: "error", message: "A IA respondeu, mas a proposta não passou pela validação do Wonderland." };
    return { status: "success", message: "Proposta criada. Revise os campos antes de adicionar à classe.", draft: parsed.data };
  } catch (error) {
    console.error("OpenAI admin studio failure", error);
    return { status: "error", message: "Não foi possível conectar ao Assistente de Wonderland." };
  }
}

export async function addSkillToClassAction(input: unknown) {
  const account = await requireAdministrativeAccount();
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Revise os campos da habilidade." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data: row, error } = await client.from("v2_content").select("id,name,payload,revision,status").eq("id", parsed.data.classId).eq("content_type", "class").maybeSingle();
  if (error || !row) return { ok: false as const, message: "Classe não encontrada." };
  const classPayload = parseClassPayload(row.payload);
  if (!classPayload.success) return { ok: false as const, message: "A classe possui dados inválidos e precisa ser revisada antes." };
  const skill = buildClassSkillFromSimpleDraft(parsed.data.draft);
  if (classPayload.data.progression.some((entry) => entry.key === skill.key)) return { ok: false as const, message: "Já existe uma habilidade com essa chave na classe." };
  const nextPayload = { ...classPayload.data, progression: [...classPayload.data.progression, skill].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)) };
  const { data: updated, error: updateError } = await client.from("v2_content").update({ payload: nextPayload as unknown as Json, updated_by: account.id }).eq("id", row.id).eq("revision", row.revision).select("id").maybeSingle();
  if (updateError || !updated) return { ok: false as const, message: "A classe foi alterada em outra tela. Atualize e tente novamente." };
  await client.from("v2_admin_history").insert({ actor_id: account.id, action: "class.skill.created_from_studio", target_type: "class", target_id: row.id, details: { className: row.name, skillName: skill.name, skillKey: skill.key } });
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${row.id}`);
  revalidatePath("/classes");
  return { ok: true as const, message: `${skill.name} foi adicionada a ${row.name}.` };
}
