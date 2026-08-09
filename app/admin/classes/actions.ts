"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import type { ClassActionState } from "@/lib/game/class-forms";
import { createClassSlug } from "@/lib/game/classes";
import { officialClasses } from "@/lib/game/official-classes";
import { classPayloadSchema } from "@/lib/game/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const submissionSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  expectedRevision: z.coerce.number().int().min(0),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  payload: z.string().min(1),
  intent: z.enum(["save", "publish"]),
});

function fail(message: string, fieldErrors?: Record<string, string[]>): ClassActionState {
  return { status: "error", message, fieldErrors };
}

function refresh(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/classes");
  revalidatePath("/personagens");
  if (id) {
    revalidatePath(`/admin/classes/${id}`);
    revalidatePath(`/admin/classes/${id}/preview`);
  }
}

export async function importOfficialClassesAction() {
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/classes?notice=erro");
  const publishedAt = new Date().toISOString();
  const { data, error } = await client
    .from("v2_content")
    .upsert(
      officialClasses.map((entry) => ({
        content_type: "class" as const,
        name: entry.name,
        slug: entry.slug,
        status: "published" as const,
        payload: entry.payload as unknown as Json,
        published_at: publishedAt,
        updated_by: account.id,
      })),
      { onConflict: "content_type,slug" },
    )
    .select("id");
  if (error || data?.length !== officialClasses.length) redirect("/admin/classes?notice=erro");
  refresh();
  data.forEach((entry) => refresh(entry.id));
  redirect("/admin/classes?notice=oficiais-importadas");
}

export async function saveClassAction(
  _previousState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const account = await requireAdministrativeAccount();
  const submission = submissionSchema.safeParse({
    id: formData.get("id"),
    expectedRevision: formData.get("expectedRevision"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    payload: formData.get("payload"),
    intent: formData.get("intent"),
  });
  if (!submission.success) {
    return fail(
      "Revise os campos destacados antes de continuar.",
      submission.error.flatten().fieldErrors,
    );
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(submission.data.payload);
  } catch {
    return fail("Os dados estruturados da classe estão inválidos.");
  }
  const payload = classPayloadSchema.safeParse(decoded);
  if (!payload.success) {
    return fail("Existem informações incompletas ou inválidas na classe.", {
      payload: payload.error.issues.map((issue) => issue.message),
    });
  }
  const client = await createServerSupabaseClient();
  if (!client) return fail("A conexão com o banco não está disponível.");
  const { id, expectedRevision, name, slug, intent } = submission.data;
  let classId = id;
  if (classId) {
    const { data: existing } = await client
      .from("v2_content")
      .select("id, revision, status")
      .eq("id", classId)
      .eq("content_type", "class")
      .maybeSingle();
    if (!existing) return fail("Esta classe não existe mais.");
    if (existing.revision !== expectedRevision) {
      return fail("Outra alteração foi salva. Atualize a página antes de continuar.");
    }
    const { data: updated, error } = await client
      .from("v2_content")
      .update({
        name,
        slug,
        status: existing.status === "archived" ? "draft" : existing.status,
        payload: payload.data as unknown as Json,
        updated_by: account.id,
      })
      .eq("id", classId)
      .eq("content_type", "class")
      .eq("revision", expectedRevision)
      .select("id")
      .maybeSingle();
    if (error?.code === "23505") return fail("Já existe outra classe com esse identificador.");
    if (error || !updated)
      return fail("A classe foi alterada em outra tela. Atualize e tente novamente.");
  } else {
    const { data: created, error } = await client
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
    if (error?.code === "23505") return fail("Já existe outra classe com esse identificador.");
    if (error || !created) return fail("Não foi possível criar a classe.");
    classId = created.id;
  }
  if (intent === "publish") {
    const { error } = await client.rpc("v2_publish_content", { p_content_id: classId });
    if (error) return fail("A classe foi salva, mas não pôde ser publicada.");
  }
  refresh(classId);
  redirect(`/admin/classes/${classId}?status=${intent === "publish" ? "publicada" : "salva"}`);
}

async function uniqueCopySlug(baseSlug: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const base = createClassSlug(`${baseSlug}-copia`) || "classe-copia";
  const { data } = await client
    .from("v2_content")
    .select("slug")
    .eq("content_type", "class")
    .like("slug", `${base}%`);
  const used = new Set(data?.map((entry) => entry.slug) ?? []);
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function duplicateClassAction(id: string) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) redirect("/admin/classes?notice=erro");
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/classes?notice=erro");
  const { data: source } = await client
    .from("v2_content")
    .select("name, slug, payload")
    .eq("id", parsed.data)
    .eq("content_type", "class")
    .maybeSingle();
  if (!source) redirect("/admin/classes?notice=nao-encontrada");
  const slug = await uniqueCopySlug(source.slug);
  if (!slug) redirect("/admin/classes?notice=erro");
  const { data, error } = await client
    .from("v2_content")
    .insert({
      content_type: "class",
      name: `${source.name} (Cópia)`,
      slug,
      status: "draft",
      payload: source.payload,
      created_by: account.id,
      updated_by: account.id,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/admin/classes?notice=erro");
  refresh(data.id);
  redirect(`/admin/classes/${data.id}?status=duplicada`);
}

export async function archiveClassAction(id: string) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) redirect("/admin/classes?notice=erro");
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/classes?notice=erro");
  const { error } = await client
    .from("v2_content")
    .update({ status: "archived", published_at: null, updated_by: account.id })
    .eq("id", parsed.data)
    .eq("content_type", "class");
  if (error) redirect("/admin/classes?notice=erro");
  refresh(parsed.data);
  redirect("/admin/classes?notice=arquivada");
}

export async function restoreClassAction(id: string) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) redirect("/admin/classes?notice=erro");
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/classes?notice=erro");
  const { error } = await client
    .from("v2_content")
    .update({ status: "draft", updated_by: account.id })
    .eq("id", parsed.data)
    .eq("content_type", "class")
    .eq("status", "archived");
  if (error) redirect("/admin/classes?notice=erro");
  refresh(parsed.data);
  redirect(`/admin/classes/${parsed.data}?status=restaurada`);
}
