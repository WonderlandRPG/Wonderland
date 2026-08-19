"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import { kingdomMissionNames, officialMissionRewards } from "@/lib/game/missions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  balanceUpdateSchema,
  parseBalanceValue,
  simpleMissionDraftSchema,
  type SimpleMissionDraft,
} from "@/lib/admin/simple-operations-builder";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}
async function logHistory(actorId: string, action: string, targetType: string, targetId: string | null, details: Record<string, unknown>) {
  const client = await createServerSupabaseClient();
  if (client) await client.from("v2_admin_history").insert({ actor_id: actorId, action, target_type: targetType, target_id: targetId, details: details as unknown as Json });
}

export async function saveMissionFromStudioAction(input: unknown) {
  const account = await requireAdministrativeAccount();
  const parsed = simpleMissionDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Revise os campos da missão." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const draft = parsed.data;
  const reward = officialMissionRewards[draft.rank];
  const promotionRank = draft.isRankTrial ? draft.promotionRank : null;
  if (draft.isRankTrial && !promotionRank) return { ok: false as const, message: "Escolha o Rank promovido pela prova." };
  let id = draft.id;
  if (id) {
    const { error } = await client.from("v2_missions").update({
      name: draft.name,
      description: draft.description,
      objective: draft.objective,
      kingdom: draft.kingdom,
      rank: draft.rank,
      min_level: draft.minLevel,
      reward_xp: reward.xp,
      reward_gold: reward.wg,
      is_rank_trial: draft.isRankTrial,
      promotion_rank: promotionRank,
      active: draft.active,
    }).eq("id", id);
    if (error) return { ok: false as const, message: "Não foi possível atualizar a missão." };
  } else {
    const slug = `${slugify(draft.name) || "missao"}-${Date.now().toString(36)}`;
    const { data, error } = await client.from("v2_missions").insert({
      slug,
      name: draft.name,
      description: draft.description,
      objective: draft.objective,
      kingdom: draft.kingdom,
      rank: draft.rank,
      min_level: draft.minLevel,
      reward_xp: reward.xp,
      reward_gold: reward.wg,
      is_rank_trial: draft.isRankTrial,
      promotion_rank: promotionRank,
      active: draft.active,
      created_by: account.id,
    }).select("id").single();
    if (error || !data) return { ok: false as const, message: "Não foi possível criar a missão." };
    id = data.id;
  }
  await logHistory(account.id, draft.id ? "mission.updated_from_studio" : "mission.created_from_studio", "mission", id, {
    name: draft.name, rank: draft.rank, kingdom: kingdomMissionNames[draft.kingdom], rewardXp: reward.xp, rewardWg: reward.wg, rankTrial: draft.isRankTrial, active: draft.active,
  });
  revalidatePath("/admin/missoes"); revalidatePath("/missoes"); revalidatePath("/admin/estudio");
  return { ok: true as const, message: `${draft.name} foi ${draft.id ? "atualizada" : "criada"} com a recompensa oficial do Rank ${draft.rank}.`, id };
}

export async function updateBalanceSettingFromStudioAction(input: unknown) {
  const account = await requireAdministrativeAccount();
  const parsed = balanceUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Revise o valor de balanceamento." };
  const decoded = parseBalanceValue(parsed.data.valueText);
  if (!decoded.success) return { ok: false as const, message: decoded.message };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data: current, error: readError } = await client.from("v2_game_settings").select("key,label,value,revision,status").eq("key", parsed.data.key).maybeSingle();
  if (readError || !current) return { ok: false as const, message: "Configuração não encontrada." };
  if (current.revision !== parsed.data.revision) return { ok: false as const, message: "Este valor foi alterado em outra tela. Atualize o Studio antes de salvar." };
  const { data: updated, error } = await client.from("v2_game_settings").update({ value: decoded.value as Json, updated_by: account.id }).eq("key", parsed.data.key).eq("revision", parsed.data.revision).select("key,revision").maybeSingle();
  if (error || !updated) return { ok: false as const, message: "Não foi possível salvar; o valor pode ter mudado em outra tela." };
  await logHistory(account.id, "game_setting.updated_from_studio", "game_setting", null, { key: current.key, label: current.label, before: current.value, after: decoded.value, previousRevision: current.revision });
  revalidatePath("/admin/balanceamento"); revalidatePath("/admin/estudio"); revalidatePath("/personagens", "layout"); revalidatePath("/arena");
  return { ok: true as const, message: `${current.label} foi atualizado.`, nextRevision: updated.revision };
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") return (part as { text: string }).text;
  }
  return "";
}

export type MissionAiState = { status: "idle"; message: ""; draft?: undefined } | { status: "error"; message: string; draft?: undefined } | { status: "success"; message: string; draft: SimpleMissionDraft };
export const initialMissionAiState: MissionAiState = { status: "idle", message: "" };

export async function generateMissionWithAiAction(_previous: MissionAiState, formData: FormData): Promise<MissionAiState> {
  await requireAdministrativeAccount();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (prompt.length < 5) return { status: "error", message: "Descreva melhor a missão." };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { status: "error", message: "Configure OPENAI_API_KEY na Vercel para ativar o Assistente." };
  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    if (image.size > 4_000_000 || !image.type.startsWith("image/")) return { status: "error", message: "Envie uma imagem válida de até 4 MB." };
    content.push({ type: "input_image", image_url: `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`, detail: "auto" });
  }
  const schema = {
    type: "object", additionalProperties: false,
    required: ["id","name","description","objective","kingdom","rank","minLevel","isRankTrial","promotionRank","active"],
    properties: {
      id: { type: "string" }, name: { type: "string" }, description: { type: "string" }, objective: { type: "string" },
      kingdom: { type: "string", enum: ["aokigahara","darkya","oymyakon","lesedi","namida","skypiece"] },
      rank: { type: "string", enum: ["E","D","C","B"] }, minLevel: { type: "integer", minimum: 1, maximum: 100 },
      isRankTrial: { type: "boolean" }, promotionRank: { anyOf: [{ type: "string", enum: ["D","C","B","A"] }, { type: "null" }] }, active: { type: "boolean" },
    },
  } as const;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_ADMIN_MODEL || "gpt-5",
        instructions: "Você cria missões de fantasia para Wonderland. Produza objetivo claro, texto atmosférico e Rank coerente. Não altere recompensas: Wonderland aplica a recompensa oficial. Provas de Rank devem ter promotionRank coerente; missões normais usam null. Para conteúdo novo use id vazio e active true.",
        input: [{ role: "user", content }], text: { format: { type: "json_schema", name: "wonderland_mission_draft", strict: true, schema } },
      }), cache: "no-store",
    });
    if (!response.ok) return { status: "error", message: "A IA não conseguiu gerar a missão agora." };
    const parsed = simpleMissionDraftSchema.safeParse(JSON.parse(extractOutputText(await response.json())));
    if (!parsed.success) return { status: "error", message: "A proposta não passou pela validação de Wonderland." };
    return { status: "success", message: "Missão proposta. Revise e confirme para salvar.", draft: parsed.data };
  } catch {
    return { status: "error", message: "Não foi possível conectar ao Assistente de Wonderland." };
  }
}
