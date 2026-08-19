"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseClassPayload } from "@/lib/game/classes";
import type { Json } from "@/lib/db/types";
import { buildClassSkillFromSimpleDraft, simpleSkillDraftSchema } from "@/lib/admin/simple-skill-builder";

const schema = z.object({ classId: z.uuid(), existingKey: z.string().min(1), draft: simpleSkillDraftSchema });

export async function replaceSkillInClassAction(input: unknown) {
  const account = await requireAdministrativeAccount();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Revise os campos da habilidade." };
  const client = await createServerSupabaseClient();
  if (!client) return { ok: false as const, message: "Banco indisponível." };
  const { data: row, error } = await client.from("v2_content").select("id,name,payload,revision").eq("id", parsed.data.classId).eq("content_type", "class").maybeSingle();
  if (error || !row) return { ok: false as const, message: "Classe não encontrada." };
  const classPayload = parseClassPayload(row.payload);
  if (!classPayload.success) return { ok: false as const, message: "A classe possui dados inválidos." };
  const index = classPayload.data.progression.findIndex((entry) => entry.key === parsed.data.existingKey);
  if (index < 0) return { ok: false as const, message: "A habilidade original não existe mais." };
  const skill = buildClassSkillFromSimpleDraft(parsed.data.draft);
  const duplicate = classPayload.data.progression.some((entry, current) => current !== index && entry.key === skill.key);
  if (duplicate) return { ok: false as const, message: "Outra habilidade desta classe já usa esse nome/chave." };
  const progression = classPayload.data.progression.map((entry, current) => current === index ? skill : entry).sort((a,b) => a.level - b.level || a.name.localeCompare(b.name));
  const nextPayload = { ...classPayload.data, progression };
  const { data: updated, error: updateError } = await client.from("v2_content").update({ payload: nextPayload as unknown as Json, updated_by: account.id }).eq("id", row.id).eq("revision", row.revision).select("id").maybeSingle();
  if (updateError || !updated) return { ok: false as const, message: "A classe mudou em outra tela. Atualize e tente novamente." };
  await client.from("v2_admin_history").insert({ actor_id: account.id, action: "class.skill.updated_from_studio", target_type: "class", target_id: row.id, details: { className: row.name, oldKey: parsed.data.existingKey, skillName: skill.name, skillKey: skill.key } });
  revalidatePath("/admin/estudio");
  revalidatePath(`/admin/classes/${row.id}`);
  revalidatePath("/classes");
  return { ok: true as const, message: `${skill.name} foi atualizada em ${row.name}.` };
}
