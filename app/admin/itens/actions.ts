"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import type { ItemActionState } from "@/lib/game/item-forms";
import { itemPayloadSchema } from "@/lib/game/schemas";
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

function fail(message: string): ItemActionState {
  return { status: "error", message };
}
function refresh(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/itens");
  if (id) revalidatePath(`/admin/itens/${id}`);
}

export async function saveItemAction(
  _previous: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const account = await requireAdministrativeAccount();
  const submission = submissionSchema.safeParse({
    id: formData.get("id"),
    expectedRevision: formData.get("expectedRevision"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    payload: formData.get("payload"),
    intent: formData.get("intent"),
  });
  if (!submission.success) return fail("Revise os campos do item.");
  let raw: unknown;
  try {
    raw = JSON.parse(submission.data.payload);
  } catch {
    return fail("Os dados do item estão inválidos.");
  }
  const payload = itemPayloadSchema.safeParse(raw);
  if (!payload.success) return fail(payload.error.issues[0]?.message ?? "O item está incompleto.");
  const client = await createServerSupabaseClient();
  if (!client) return fail("A conexão com o banco não está disponível.");
  let itemId = submission.data.id;
  if (itemId) {
    const { data: current } = await client
      .from("v2_content")
      .select("revision, status")
      .eq("id", itemId)
      .eq("content_type", "item")
      .maybeSingle();
    if (!current || current.revision !== submission.data.expectedRevision)
      return fail("O item foi alterado em outra tela. Atualize a página.");
    const { data, error } = await client
      .from("v2_content")
      .update({
        name: submission.data.name,
        slug: submission.data.slug,
        status: current.status === "archived" ? "draft" : current.status,
        payload: payload.data as unknown as Json,
        updated_by: account.id,
      })
      .eq("id", itemId)
      .eq("revision", submission.data.expectedRevision)
      .select("id")
      .maybeSingle();
    if (error?.code === "23505") return fail("Já existe outro item com esse identificador.");
    if (error || !data) return fail("Não foi possível salvar o item.");
  } else {
    const { data, error } = await client
      .from("v2_content")
      .insert({
        content_type: "item",
        name: submission.data.name,
        slug: submission.data.slug,
        payload: payload.data as unknown as Json,
        status: "draft",
        created_by: account.id,
        updated_by: account.id,
      })
      .select("id")
      .single();
    if (error?.code === "23505") return fail("Já existe outro item com esse identificador.");
    if (error || !data) return fail("Não foi possível criar o item.");
    itemId = data.id;
  }
  if (submission.data.intent === "publish") {
    const { error } = await client.rpc("v2_publish_content", { p_content_id: itemId });
    if (error) return fail("O item foi salvo, mas não pôde ser publicado.");
  }
  refresh(itemId);
  redirect(
    `/admin/itens/${itemId}?status=${submission.data.intent === "publish" ? "publicado" : "salvo"}`,
  );
}

export async function archiveItemAction(id: string) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) redirect("/admin/itens?notice=erro");
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/itens?notice=erro");
  const { error } = await client
    .from("v2_content")
    .update({ status: "archived", published_at: null, updated_by: account.id })
    .eq("id", parsed.data)
    .eq("content_type", "item");
  if (error) redirect("/admin/itens?notice=erro");
  refresh(parsed.data);
  redirect("/admin/itens?notice=arquivado");
}

export async function grantItemAction(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = z
    .object({
      characterId: z.uuid(),
      itemId: z.uuid(),
      quantity: z.coerce.number().int().min(1).max(999),
    })
    .safeParse({
      characterId: formData.get("characterId"),
      itemId: formData.get("itemId"),
      quantity: formData.get("quantity"),
    });
  if (!parsed.success) redirect("/admin/itens?notice=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/admin/itens?notice=erro");
  const { error } = await client.rpc("v2_grant_item", {
    p_character_id: parsed.data.characterId,
    p_item_id: parsed.data.itemId,
    p_quantity: parsed.data.quantity,
  });
  if (error) redirect("/admin/itens?notice=erro");
  revalidatePath(`/personagens/${parsed.data.characterId}`);
  revalidatePath(`/personagens/${parsed.data.characterId}/inventario`);
  redirect("/admin/itens?notice=concedido");
}
