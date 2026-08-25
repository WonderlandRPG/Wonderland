"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActiveCharacter } from "@/lib/content/active-character";
import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase/server";

export async function registerForEventAction(formData: FormData) {
  await requireActiveCharacter("/eventos");
  const eventId = z.uuid().safeParse(formData.get("eventId"));
  if (!eventId.success) redirect("/eventos?inscricao=erro");
  const client = await createAuthenticatedServerSupabaseClient();
  if (!client) redirect("/eventos?inscricao=erro");
  const { data, error } = await client.rpc("v2_register_for_event", { p_event_id: eventId.data });
  if (error) {
    console.error("[event-registration] rpc failed", {
      code: error.code,
      details: error.details,
      message: error.message,
      eventId: eventId.data,
    });
    const status = error.message.toLocaleLowerCase("pt-BR").includes("já inscrito")
      ? "existente"
      : "erro";
    redirect(`/eventos?inscricao=${status}`);
  }
  if (data && typeof data === "object" && "already_registered" in data && data.already_registered) {
    revalidatePath("/eventos");
    redirect("/eventos?inscricao=existente");
  }
  revalidatePath("/eventos");
  revalidatePath("/perfil");
  redirect("/eventos?inscricao=sucesso");
}
