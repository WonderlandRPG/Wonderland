"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export async function buyItem(formData: FormData) {
  const { characterId } = await requireActiveCharacter("/loja");
  const id = z.uuid().safeParse(formData.get("itemId"));
  if (!id.success) redirect("/loja?compra=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/loja?compra=erro");
  const { error } = await client.rpc("v2_buy_shop_item", { p_item_id: id.data });
  if (error) {
    const reason = error.message.toLocaleLowerCase("pt-BR").includes("insuficiente")
      ? "saldo"
      : "erro";
    redirect(`/loja?compra=${reason}`);
  }
  revalidatePath("/loja");
  revalidatePath("/perfil");
  revalidatePath(`/personagens/${characterId}`);
  redirect("/loja?compra=sucesso");
}

export async function buyCart(formData: FormData) {
  const { characterId } = await requireActiveCharacter("/loja");
  const ids = z.array(z.uuid()).min(1).max(50).safeParse(formData.getAll("itemId"));
  if (!ids.success) redirect("/loja?compra=erro");
  const client = await createServerSupabaseClient();
  if (!client) redirect("/loja?compra=erro");
  const { error } = await client.rpc("v2_buy_shop_cart", { p_item_ids: ids.data });
  if (error) {
    const reason = error.message.toLocaleLowerCase("pt-BR").includes("insuficiente")
      ? "saldo"
      : "erro";
    redirect(`/loja?compra=${reason}`);
  }
  revalidatePath("/loja");
  revalidatePath(`/personagens/${characterId}`);
  redirect("/loja?compra=carrinho");
}
