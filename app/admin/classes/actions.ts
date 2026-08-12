"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import { classPayloadSchema } from "@/lib/game/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ClassActionState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};
export const initialClassActionState: ClassActionState = { status: "idle", message: "" };

const submissionSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  expectedRevision: z.coerce.number().int().min(0),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  payload: z.string().min(1),
  intent: z.enum(["save", "publish"]),
});

export async function saveClassAction(
  _state: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const account = await requireAdministrativeAccount();
  const submission = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!submission.success)
    return {
      status: "error",
      message: "Revise os campos obrigatórios.",
      fieldErrors: submission.error.flatten().fieldErrors,
    };
  let raw: unknown;
  try {
    raw = JSON.parse(submission.data.payload);
  } catch {
    raw = null;
  }
  const payload = classPayloadSchema.safeParse(raw);
  if (!payload.success)
    return {
      status: "error",
      message: "A classe contém habilidades ou regras incompletas.",
      fieldErrors: {
        payload: payload.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      },
    };
  const client = await createServerSupabaseClient();
  if (!client) return { status: "error", message: "A conexão com o banco não está disponível." };
  const { id, expectedRevision, name, slug, intent } = submission.data;
  let classId = id;
  try {
    if (classId) {
      const { data, error } = await client
        .from("v2_content")
        .update({ name, slug, payload: payload.data as unknown as Json, updated_by: account.id })
        .eq("id", classId)
        .eq("content_type", "class")
        .eq("revision", expectedRevision)
        .select("id")
        .maybeSingle();
      if (error?.code === "23505")
        return { status: "error", message: "Já existe uma classe com esse identificador." };
      if (error || !data)
        return {
          status: "error",
          message: error
            ? `Não foi possível salvar a classe: ${error.message}`
            : "A classe foi alterada em outra tela. Atualize a página.",
        };
    } else {
      const { data, error } = await client
        .from("v2_content")
        .insert({
          content_type: "class",
          name,
          slug,
          status: "draft",
          payload: payload.data as unknown as Json,
          created_by: account.id,
          updated_by: account.id,
        })
        .select("id")
        .single();
      if (error || !data)
        return {
          status: "error",
          message:
            error?.code === "23505"
              ? "Já existe uma classe com esse identificador."
              : `Não foi possível criar a classe${error ? `: ${error.message}` : "."}`,
        };
      classId = data.id;
    }
    if (intent === "publish") {
      const { error } = await client.rpc("v2_publish_content", { p_content_id: classId });
      if (error)
        return {
          status: "error",
          message: `A classe foi salva, mas não pôde ser publicada: ${error.message}`,
        };
    }
  } catch {
    return {
      status: "error",
      message: "A conexão foi interrompida durante o salvamento. Tente novamente.",
    };
  }
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath("/classes");
  redirect(`/admin/classes/${classId}?status=${intent === "publish" ? "publicada" : "salva"}`);
}
