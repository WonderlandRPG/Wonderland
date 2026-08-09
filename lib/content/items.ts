import "server-only";

import { notFound } from "next/navigation";

import type { Database } from "@/lib/db/types";
import { parseItemPayload, type ItemPayload } from "@/lib/game/items";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ContentRow = Database["public"]["Tables"]["v2_content"]["Row"];

export interface ItemRecord extends Omit<ContentRow, "payload" | "content_type"> {
  content_type: "item";
  payload: ItemPayload;
}

function parse(row: ContentRow): ItemRecord | null {
  if (row.content_type !== "item") return null;
  const payload = parseItemPayload(row.payload);
  return payload.success ? { ...row, content_type: "item", payload: payload.data } : null;
}

export async function getItemCatalog(options: { publishedOnly?: boolean } = {}) {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  let query = client.from("v2_content").select("*").eq("content_type", "item");
  if (options.publishedOnly) query = query.eq("status", "published");
  const { data, error } = await query.order("name");
  if (error) throw new Error("Não foi possível carregar os itens.");
  return (data ?? [])
    .map((row) => parse(row as ContentRow))
    .filter((row): row is ItemRecord => Boolean(row));
}

export async function getItemById(id: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("v2_content")
    .select("*")
    .eq("id", id)
    .eq("content_type", "item")
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar este item.");
  return data ? parse(data as ContentRow) : null;
}

export async function requireItemById(id: string) {
  const item = await getItemById(id);
  if (!item) notFound();
  return item;
}
