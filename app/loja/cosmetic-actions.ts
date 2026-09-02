"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveCharacter } from "@/lib/content/active-character";
import { isAdministrativeRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const valid = new Map<string, Set<string>>([
  ["card", new Set(["noite-veu-partido"])],
  ["aura", new Set(["cortejo-fogos-fatuos"])],
  ["border", new Set(["trono-rei-oco", "moldura-fundadores-2026"])],
]);

export async function setAdminCosmeticAction(formData: FormData) {
  const { account, characterId } = await requireActiveCharacter("/loja");
  if (!isAdministrativeRole(account.role)) redirect("/loja");

  const slot = String(formData.get("slot") ?? "");
  const requested = String(formData.get("key") ?? "");
  const remove = String(formData.get("remove") ?? "") === "1";
  const expected = valid.get(slot);

  if (!expected || (!remove && !expected.has(requested))) {
    redirect("/loja?status=cosmetico-invalido");
  }

  const client = await createServerSupabaseClient();
  if (!client) redirect("/loja?status=cosmetico-erro");

  const { error } = await client.rpc("v2_set_character_cosmetic", {
    p_character_id: characterId,
    p_slot: slot,
    p_key: remove ? null : requested,
  });

  if (error) {
    console.error("Falha ao equipar cosmético:", error);
    redirect("/loja?status=cosmetico-erro");
  }

  revalidatePath("/");
  revalidatePath("/loja");
  revalidatePath("/perfil");
  revalidatePath("/personagens");
  revalidatePath(`/personagens/${characterId}`);
  revalidatePath("/ranking");

  redirect("/loja?status=cosmetico-salvo");
}
