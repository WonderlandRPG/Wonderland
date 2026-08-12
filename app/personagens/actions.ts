"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterRules } from "@/lib/content/character-settings";
import type { Json } from "@/lib/db/types";
import type { CharacterActionState } from "@/lib/game/character-forms";
import { allocatedAttributesSchema, getAllocatedTotal } from "@/lib/game/characters";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { kingdoms } from "@/lib/game/kingdoms";

const creationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe pelo menos 2 caracteres.")
    .max(32, "Use no máximo 32 caracteres."),
  raceId: z.uuid("Escolha uma raça."),
  classId: z.uuid("Escolha uma classe."),
  kingdom: z.enum(kingdoms.map((entry) => entry.key) as [string, ...string[]], {
    error: "Escolha um reino.",
  }),
  imageUrl: z.union([
    z.literal(""),
    z
      .url("Informe um link de imagem válido.")
      .refine((value) => /^https?:\/\//.test(value), "Use um link http ou https."),
  ]),
  allocation: z.string().min(1),
});

function fail(message: string, fieldErrors?: Record<string, string[]>): CharacterActionState {
  return { status: "error", message, fieldErrors };
}

export async function createCharacterAction(
  _previous: CharacterActionState,
  formData: FormData,
): Promise<CharacterActionState> {
  const account = await requireCurrentAccount("/personagens/novo");
  const submission = creationSchema.safeParse({
    name: formData.get("name"),
    raceId: formData.get("raceId"),
    classId: formData.get("classId"),
    kingdom: formData.get("kingdom"),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    allocation: formData.get("allocation"),
  });
  if (!submission.success)
    return fail("Revise as informações da ficha.", submission.error.flatten().fieldErrors);
  let raw: unknown;
  try {
    raw = JSON.parse(submission.data.allocation);
  } catch {
    return fail("A distribuição de atributos está inválida.");
  }
  const allocation = allocatedAttributesSchema.safeParse(raw);
  if (!allocation.success)
    return fail("Todos os atributos devem conter números inteiros positivos.");
  const rules = await getCharacterRules();
  if (getAllocatedTotal(allocation.data) !== rules.distributablePoints) {
    return fail(`Distribua exatamente ${rules.distributablePoints} pontos antes de criar a ficha.`);
  }
  const client = await createServerSupabaseClient();
  if (!client) return fail("A conexão com o banco não está disponível.");
  const { count } = await client
    .from("v2_characters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", account.id);
  if ((count ?? 0) >= rules.maximumSlots)
    return fail(`Sua conta já possui o limite de ${rules.maximumSlots} personagens.`);
  const { data: content } = await client
    .from("v2_content")
    .select("id, content_type, status, payload")
    .in("id", [submission.data.raceId, submission.data.classId]);
  const validRace = content?.some(
    (entry) =>
      entry.id === submission.data.raceId &&
      entry.content_type === "race" &&
      entry.status === "published",
  );
  const validClass = content?.some(
    (entry) =>
      entry.id === submission.data.classId &&
      entry.content_type === "class" &&
      entry.status === "published",
  );
  if (!validRace || !validClass) return fail("A raça ou classe escolhida não está publicada.");
  const { data, error } = await client
    .from("v2_characters")
    .insert({
      user_id: account.id,
      name: submission.data.name,
      race_id: submission.data.raceId,
      class_id: submission.data.classId,
      class_path_key: null,
      kingdom: submission.data.kingdom,
      image_url: submission.data.imageUrl || null,
      allocated_attributes: allocation.data as unknown as Json,
    })
    .select("id")
    .single();
  if (error?.code === "42P01")
    return fail("A atualização do banco de personagens ainda precisa ser aplicada no Supabase.");
  if (error || !data) return fail(error?.message || "Não foi possível criar o personagem.");
  revalidatePath("/perfil");
  revalidatePath("/personagens");
  redirect("/personagens?selecionar=1&notice=criado");
}

export async function deleteCharacterAction(id: string) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) redirect("/personagens?notice=erro");
  await requireCurrentAccount("/personagens");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/personagens?notice=erro");
  const { error } = await client.from("v2_characters").delete().eq("id", parsed.data);
  if (error) redirect("/personagens?notice=erro");
  revalidatePath("/perfil");
  revalidatePath("/personagens");
  redirect("/personagens?notice=excluido");
}
