"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { parseClassPayload } from "@/lib/game/classes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function completePathQuestAction(characterId: string, formData: FormData) {
  const account = await requireCurrentAccount(`/personagens/${characterId}`);
  const input = z
    .object({ characterId: z.uuid(), pathKey: z.string().trim().min(1) })
    .safeParse({ characterId, pathKey: formData.get("pathKey") });
  if (!input.success) redirect(`/personagens/${characterId}?status=caminho-erro`);
  const client = await createServerSupabaseClient();
  if (!client) redirect(`/personagens/${characterId}?status=caminho-erro`);
  const { data: character } = await client
    .from("v2_characters")
    .select("id,user_id,level,class_id,class_path_key")
    .eq("id", characterId)
    .eq("user_id", account.id)
    .maybeSingle();
  if (!character || character.level < 50 || character.class_path_key)
    redirect(`/personagens/${characterId}?status=caminho-bloqueado`);
  const { data: classRow } = await client
    .from("v2_content")
    .select("payload")
    .eq("id", character.class_id)
    .eq("content_type", "class")
    .eq("status", "published")
    .maybeSingle();
  const parsedClass = parseClassPayload(classRow?.payload);
  if (
    !parsedClass.success ||
    !parsedClass.data.paths.some((path) => path.key === input.data.pathKey)
  )
    redirect(`/personagens/${characterId}?status=caminho-erro`);
  const { error } = await client.rpc("v2_choose_class_path", {
    p_character_id: characterId,
    p_path_key: input.data.pathKey,
  });
  if (error) redirect(`/personagens/${characterId}?status=caminho-erro`);
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/arena");
  redirect(`/personagens/${characterId}?status=caminho-escolhido`);
}
