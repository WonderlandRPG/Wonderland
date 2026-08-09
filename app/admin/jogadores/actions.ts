"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
const input = z.object({
  userId: z.uuid(),
  role: z.enum(["player", "moderator", "admin", "founder"]),
});
export async function updatePlayerRole(formData: FormData) {
  await requireAdministrativeAccount();
  const parsed = input.safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!parsed.success) return;
  const client = await createServerSupabaseClient();
  if (!client) return;
  await client.rpc("v2_set_player_role", {
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
  });
  revalidatePath("/admin/jogadores");
}
