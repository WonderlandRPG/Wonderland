"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export async function buyItem(formData: FormData) {
  await requireCurrentAccount("/loja");
  const id = z.uuid().safeParse(formData.get("itemId"));
  if (!id.success) return;
  const client = await createServerSupabaseClient();
  if (client) await client.rpc("v2_buy_shop_item", { p_item_id: id.data });
  revalidatePath("/loja");
  revalidatePath("/perfil");
}
