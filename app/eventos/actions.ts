"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function registerForEventAction(formData: FormData) {
  await requireActiveCharacter("/eventos");
  const eventId = z.uuid().safeParse(formData.get("eventId"));
  if (!eventId.success) redirect("/eventos?inscricao=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/eventos?inscricao=erro");
  const { error } = await client.rpc("v2_register_for_event", { p_event_id: eventId.data });
  if (error) {
    const status = error.message.toLocaleLowerCase("pt-BR").includes("já inscrito")
      ? "existente"
      : "erro";
    redirect(`/eventos?inscricao=${status}`);
  }
  revalidatePath("/eventos");
  revalidatePath("/perfil");
  redirect("/eventos?inscricao=sucesso");
}
