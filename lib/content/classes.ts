import "server-only";

import { notFound } from "next/navigation";

import type { Database, Json } from "@/lib/db/types";
import { parseClassPayload, type ClassPayload } from "@/lib/game/classes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ContentRow = Database["public"]["Tables"]["v2_content"]["Row"];
type RevisionRow = Database["public"]["Tables"]["v2_content_revisions"]["Row"];

export interface ClassRecord extends Omit<ContentRow, "payload" | "content_type"> {
  content_type: "class";
  payload: ClassPayload;
}

export interface ClassRevision {
  id: number;
  revision: number;
  editorName: string;
  createdAt: string;
  snapshotStatus: string;
}

function toClassRecord(row: ContentRow): ClassRecord | null {
  if (row.content_type !== "class") return null;
  const payload = parseClassPayload(row.payload);
  return payload.success ? { ...row, content_type: "class", payload: payload.data } : null;
}

export async function getClassCatalog(options: { publishedOnly?: boolean } = {}) {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  let query = client.from("v2_content").select("*").eq("content_type", "class");
  if (options.publishedOnly) query = query.eq("status", "published");
  const { data, error } = await query.order("name");
  if (error) throw new Error("Não foi possível carregar as classes.");
  return (data ?? []).map(toClassRecord).filter((entry): entry is ClassRecord => Boolean(entry));
}

export async function getClassById(id: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("v2_content")
    .select("*")
    .eq("id", id)
    .eq("content_type", "class")
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar esta classe.");
  return data ? toClassRecord(data) : null;
}

export async function requireClassById(id: string) {
  const entry = await getClassById(id);
  if (!entry) notFound();
  return entry;
}

function snapshotStatus(snapshot: Json) {
  if (!snapshot || Array.isArray(snapshot) || typeof snapshot !== "object") return "draft";
  return typeof snapshot.status === "string" ? snapshot.status : "draft";
}

export async function getClassHistory(contentId: string): Promise<ClassRevision[]> {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("v2_content_revisions")
    .select("id, revision, snapshot, edited_by, created_at")
    .eq("content_id", contentId)
    .order("revision", { ascending: false });
  if (error) throw new Error("Não foi possível carregar o histórico desta classe.");
  const revisions = (data ?? []) as RevisionRow[];
  const editorIds = [...new Set(revisions.flatMap((entry) => entry.edited_by ?? []))];
  const names = new Map<string, string>();
  if (editorIds.length > 0) {
    const { data: profiles } = await client
      .from("v2_profiles")
      .select("user_id, display_name")
      .in("user_id", editorIds);
    profiles?.forEach((profile) =>
      names.set(profile.user_id, profile.display_name || "Administrador"),
    );
  }
  return revisions.map((entry) => ({
    id: entry.id,
    revision: entry.revision,
    editorName: entry.edited_by ? (names.get(entry.edited_by) ?? "Administrador") : "Sistema",
    createdAt: entry.created_at,
    snapshotStatus: snapshotStatus(entry.snapshot),
  }));
}
