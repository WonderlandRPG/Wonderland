"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const entrySchema = z.object({
  title: z.string().trim().min(2).max(100),
  body: z.string().trim().min(2).max(4000),
  category: z.enum(["scene", "relationship", "journey"]),
  occurredOn: z.iso.date(),
});

export async function createDiaryEntryAction(formData: FormData) {
  const { account, characterId } = await requireActiveCharacter("/diario");
  const parsed = entrySchema.safeParse({
    title: formData.get("title"), body: formData.get("body"),
    category: formData.get("category"), occurredOn: formData.get("occurredOn"),
  });
  if (!parsed.success) redirect("/diario?status=invalido");
  const client = await createServerSupabaseClient();
  const { error } = client
    ? await client.from("v2_character_diary").insert({
        character_id: characterId, user_id: account.id, title: parsed.data.title,
        body: parsed.data.body, category: parsed.data.category, occurred_on: parsed.data.occurredOn,
      })
    : { error: new Error("Banco indisponível") };
  revalidatePath("/diario");
  redirect(error ? "/diario?status=erro" : "/diario?status=criado");
}

export async function deleteDiaryEntryAction(formData: FormData) {
  await requireActiveCharacter("/diario");
  const parsed = z.uuid().safeParse(formData.get("entryId"));
  if (!parsed.success) redirect("/diario?status=invalido");
  const client = await createServerSupabaseClient();
  const { error } = client ? await client.from("v2_character_diary").delete().eq("id", parsed.data) : { error: new Error("Banco indisponível") };
  revalidatePath("/diario");
  redirect(error ? "/diario?status=erro" : "/diario?status=removido");
}
