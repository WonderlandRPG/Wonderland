"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import { classPayloadSchema, racePayloadSchema } from "@/lib/game/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ImportState = { status: "idle" | "error"; message: string; errors?: string[] };
export const initialImportState: ImportState = { status: "idle", message: "" };

const envelopeSchema = z.object({
  type: z.enum(["class", "race"]),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  payload: z.record(z.string(), z.unknown()),
});

function cleanDocument(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

export async function importGameContentAction(
  _state: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const account = await requireAdministrativeAccount();
  let document: unknown;
  try {
    document = JSON.parse(cleanDocument(String(formData.get("document") ?? "")));
  } catch {
    return {
      status: "error",
      message: "O bloco não é um JSON válido.",
      errors: ["Copie desde a primeira { até a última }. Blocos ```json também são aceitos."],
    };
  }

  const envelope = envelopeSchema.safeParse(document);
  if (!envelope.success)
    return {
      status: "error",
      message: "Faltam dados na abertura do documento.",
      errors: envelope.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  const schema = envelope.data.type === "class" ? classPayloadSchema : racePayloadSchema;
  const payload = schema.safeParse(envelope.data.payload);
  if (!payload.success)
    return {
      status: "error",
      message: "O conteúdo não respeita o contrato da Arena.",
      errors: payload.error.issues
        .slice(0, 20)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };

  const client = await createServerSupabaseClient();
  if (!client) return { status: "error", message: "Banco indisponível." };
  const { data: existing } = await client
    .from("v2_content")
    .select("id")
    .eq("content_type", envelope.data.type)
    .eq("slug", envelope.data.slug)
    .maybeSingle();
  const write = existing
    ? client
        .from("v2_content")
        .update({
          name: envelope.data.name,
          status: "draft",
          payload: payload.data as unknown as Json,
          updated_by: account.id,
        })
        .eq("id", existing.id)
    : client.from("v2_content").insert({
        content_type: envelope.data.type,
        name: envelope.data.name,
        slug: envelope.data.slug,
        status: "draft",
        payload: payload.data as unknown as Json,
        updated_by: account.id,
        created_by: account.id,
      });
  const { data, error } = await write.select("id").single();
  if (error || !data)
    return {
      status: "error",
      message: "Não foi possível criar o conteúdo.",
      errors: error ? [error.message] : undefined,
    };
  revalidatePath(`/admin/${envelope.data.type === "class" ? "classes" : "racas"}`);
  redirect(
    `/admin/${envelope.data.type === "class" ? "classes" : "racas"}/${data.id}?status=importada`,
  );
}
