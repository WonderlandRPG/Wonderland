"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import type { RaceActionState } from "@/lib/game/race-forms";
import { officialRaces } from "@/lib/game/official-races";
import { createRaceSlug } from "@/lib/game/races";
import { racePayloadSchema } from "@/lib/game/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const raceSubmissionSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  expectedRevision: z.coerce.number().int().min(0),
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Informe o identificador da raça.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  payload: z.string().min(1),
  intent: z.enum(["save", "publish"]),
});

function configurationError(): RaceActionState {
  return {
    status: "error",
    message: "A conexão com o banco não está disponível. Tente novamente em instantes.",
  };
}

function actionError(message: string, fieldErrors?: Record<string, string[]>): RaceActionState {
  return { status: "error", message, fieldErrors };
}

function getRacePayload(rawPayload: string) {
  try {
    return racePayloadSchema.safeParse(JSON.parse(rawPayload));
  } catch {
    return racePayloadSchema.safeParse(null);
  }
}

function refreshRaceRoutes(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/racas");
  if (id) {
    revalidatePath(`/admin/racas/${id}`);
    revalidatePath(`/admin/racas/${id}/preview`);
  }
}

export async function importOfficialRacesAction() {
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/racas?notice=erro");

  const publishedAt = new Date().toISOString();
  const { data, error } = await client
    .from("v2_content")
    .upsert(
      officialRaces.map((race) => ({
        content_type: "race",
        name: race.name,
        slug: race.slug,
        status: "published" as const,
        payload: race.payload as unknown as Json,
        published_at: publishedAt,
        updated_by: account.id,
      })),
      { onConflict: "content_type,slug" },
    )
    .select("id");

  if (error || data?.length !== officialRaces.length) {
    redirect("/admin/racas?notice=erro");
  }

  refreshRaceRoutes();
  data.forEach((race) => refreshRaceRoutes(race.id));
  redirect("/admin/racas?notice=oficiais-importadas");
}

export async function saveRaceAction(
  _previousState: RaceActionState,
  formData: FormData,
): Promise<RaceActionState> {
  const account = await requireAdministrativeAccount();
  const submission = raceSubmissionSchema.safeParse({
    id: formData.get("id"),
    expectedRevision: formData.get("expectedRevision"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    payload: formData.get("payload"),
    intent: formData.get("intent"),
  });

  if (!submission.success) {
    return actionError(
      "Revise os campos destacados antes de continuar.",
      submission.error.flatten().fieldErrors,
    );
  }

  const parsedPayload = getRacePayload(submission.data.payload);
  if (!parsedPayload.success) {
    const bonusIssue = parsedPayload.error.issues.find(
      (issue) => issue.path[0] === "attributeBonuses",
    );

    return actionError(
      bonusIssue?.message ?? "Existem informações incompletas ou inválidas na raça.",
      { payload: parsedPayload.error.issues.map((issue) => issue.message) },
    );
  }

  const client = await createServerSupabaseClient();
  if (!client) return configurationError();

  const { id, expectedRevision, intent, name, slug } = submission.data;
  let raceId = id;

  if (raceId) {
    const { data: existing, error: existingError } = await client
      .from("v2_content")
      .select("id, status, revision")
      .eq("id", raceId)
      .eq("content_type", "race")
      .maybeSingle();

    if (existingError || !existing) {
      return actionError("Esta raça não existe mais ou não pôde ser carregada.");
    }

    if (existing.revision !== expectedRevision) {
      return actionError(
        "Outra alteração foi salva enquanto esta tela estava aberta. Atualize a página antes de continuar.",
      );
    }

    const status = existing.status === "archived" ? "draft" : existing.status;
    const { data: updated, error } = await client
      .from("v2_content")
      .update({
        name,
        slug,
        status,
        payload: parsedPayload.data as unknown as Json,
        updated_by: account.id,
      })
      .eq("id", raceId)
      .eq("content_type", "race")
      .eq("revision", expectedRevision)
      .select("id")
      .maybeSingle();

    if (error?.code === "23505") {
      return actionError("Já existe outra raça usando esse identificador.", {
        slug: ["Escolha um identificador diferente."],
      });
    }

    if (error || !updated) {
      return actionError(
        "Não foi possível salvar porque a raça foi alterada em outra tela. Atualize a página e tente novamente.",
      );
    }
  } else {
    const { data: created, error } = await client
      .from("v2_content")
      .insert({
        content_type: "race",
        name,
        slug,
        status: "draft",
        payload: parsedPayload.data as unknown as Json,
        created_by: account.id,
        updated_by: account.id,
      })
      .select("id")
      .single();

    if (error?.code === "23505") {
      return actionError("Já existe outra raça usando esse identificador.", {
        slug: ["Escolha um identificador diferente."],
      });
    }

    if (error || !created) {
      return actionError("Não foi possível criar a raça agora. Tente novamente em instantes.");
    }

    raceId = created.id;
  }

  if (intent === "publish") {
    const { error } = await client.rpc("v2_publish_content", { p_content_id: raceId });

    if (error) {
      return actionError("A raça foi salva como rascunho, mas não foi possível publicá-la agora.");
    }
  }

  refreshRaceRoutes(raceId);
  redirect(`/admin/racas/${raceId}?status=${intent === "publish" ? "publicada" : "salva"}`);
}

async function getUniqueCopySlug(baseSlug: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const normalizedBase = createRaceSlug(`${baseSlug}-copia`) || "raca-copia";
  const { data } = await client
    .from("v2_content")
    .select("slug")
    .eq("content_type", "race")
    .like("slug", `${normalizedBase}%`);
  const existing = new Set(data?.map((entry) => entry.slug) ?? []);

  if (!existing.has(normalizedBase)) return normalizedBase;

  let suffix = 2;
  while (existing.has(`${normalizedBase}-${suffix}`)) suffix += 1;
  return `${normalizedBase}-${suffix}`;
}

export async function duplicateRaceAction(id: string) {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) redirect("/admin/racas?notice=erro");

  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/racas?notice=erro");

  const { data: source } = await client
    .from("v2_content")
    .select("name, slug, payload")
    .eq("id", parsedId.data)
    .eq("content_type", "race")
    .maybeSingle();

  if (!source) redirect("/admin/racas?notice=nao-encontrada");

  const slug = await getUniqueCopySlug(source.slug);
  if (!slug) redirect("/admin/racas?notice=erro");

  const { data: copy, error } = await client
    .from("v2_content")
    .insert({
      content_type: "race",
      name: `${source.name} (Cópia)`,
      slug,
      status: "draft",
      payload: source.payload,
      created_by: account.id,
      updated_by: account.id,
    })
    .select("id")
    .single();

  if (error || !copy) redirect("/admin/racas?notice=erro");

  refreshRaceRoutes(copy.id);
  redirect(`/admin/racas/${copy.id}?status=duplicada`);
}

export async function archiveRaceAction(id: string) {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) redirect("/admin/racas?notice=erro");

  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/racas?notice=erro");

  const { error } = await client
    .from("v2_content")
    .update({ status: "archived", published_at: null, updated_by: account.id })
    .eq("id", parsedId.data)
    .eq("content_type", "race");

  if (error) redirect("/admin/racas?notice=erro");

  refreshRaceRoutes(parsedId.data);
  redirect("/admin/racas?notice=arquivada");
}

export async function restoreRaceAction(id: string) {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) redirect("/admin/racas?notice=erro");

  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/racas?notice=erro");

  const { error } = await client
    .from("v2_content")
    .update({ status: "draft", updated_by: account.id })
    .eq("id", parsedId.data)
    .eq("content_type", "race")
    .eq("status", "archived");

  if (error) redirect("/admin/racas?notice=erro");

  refreshRaceRoutes(parsedId.data);
  redirect(`/admin/racas/${parsedId.data}?status=restaurada`);
}
