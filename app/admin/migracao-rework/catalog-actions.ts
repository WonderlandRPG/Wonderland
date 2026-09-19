"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import type { Json } from "@/lib/db/types";
import { reworkCatalogCategory } from "@/lib/content/rework-catalog";
import { reworkClassSchema, reworkRaceSchema } from "@/lib/game/rework-catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ReworkCatalogActionState = { status: "idle" | "success" | "error"; message: string };
export const initialReworkCatalogActionState: ReworkCatalogActionState = { status: "idle", message: "" };

const submission = z.object({ type: z.enum(["class", "race"]), payload: z.string().min(2) });

export async function saveReworkCatalogEntry(
  _previous: ReworkCatalogActionState,
  formData: FormData,
): Promise<ReworkCatalogActionState> {
  const account = await requireAdministrativeAccount();
  const parsed = submission.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Dados incompletos." };
  let raw: unknown;
  try { raw = JSON.parse(parsed.data.payload); } catch { return { status: "error", message: "O conteúdo não é JSON válido." }; }
  const checked = parsed.data.type === "class" ? reworkClassSchema.safeParse(raw) : reworkRaceSchema.safeParse(raw);
  if (!checked.success) return { status: "error", message: checked.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" · ") };
  const value = checked.data;
  const client = await createServerSupabaseClient();
  if (!client) return { status: "error", message: "Banco indisponível." };
  const key = `rework.${parsed.data.type}.${value.id}`;
  const { error } = await client.from("v2_game_settings").upsert({
    key,
    category: reworkCatalogCategory,
    label: value.name,
    description: parsed.data.type === "class" ? "Classe canônica do Rework" : "Raça canônica do Rework",
    value: value as unknown as Json,
    status: "published",
    published_at: new Date().toISOString(),
    updated_by: account.id,
  }, { onConflict: "key" });
  if (error) return { status: "error", message: `Não foi possível salvar: ${error.message}` };
  revalidatePath("/classes"); revalidatePath("/racas"); revalidatePath("/admin/migracao-rework");
  return { status: "success", message: `${value.name} atualizado e publicado.` };
}
