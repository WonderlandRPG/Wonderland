import "server-only";

import { notFound } from "next/navigation";

import type { Database, Json } from "@/lib/db/types";
import { parseRacePayload, type RacePayload } from "@/lib/game/races";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ContentRow = Database["public"]["Tables"]["v2_content"]["Row"];
type RevisionRow = Database["public"]["Tables"]["v2_content_revisions"]["Row"];

export interface RaceRecord extends Omit<ContentRow, "payload" | "content_type"> {
  content_type: "race";
  payload: RacePayload;
}

export interface RaceRevision {
  id: number;
  revision: number;
  editedBy: string | null;
  editorName: string;
  createdAt: string;
  snapshotName: string;
  snapshotStatus: string;
}

function toRaceRecord(row: ContentRow): RaceRecord | null {
  if (row.content_type !== "race") return null;

  const parsedPayload = parseRacePayload(row.payload);
  if (!parsedPayload.success) return null;

  return {
    ...row,
    content_type: "race",
    payload: parsedPayload.data,
  };
}

export async function getRaceCatalog() {
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("v2_content")
    .select("*")
    .eq("content_type", "race")
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Não foi possível carregar as raças.");

  return (data ?? []).map(toRaceRecord).filter((race): race is RaceRecord => Boolean(race));
}

export async function getRaceById(id: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("v2_content")
    .select("*")
    .eq("id", id)
    .eq("content_type", "race")
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar esta raça.");
  if (!data) return null;

  return toRaceRecord(data);
}

export async function requireRaceById(id: string) {
  const race = await getRaceById(id);
  if (!race) notFound();
  return race;
}

function getSnapshotValue(snapshot: Json, key: string) {
  if (!snapshot || Array.isArray(snapshot) || typeof snapshot !== "object") return "";
  const value = snapshot[key];
  return typeof value === "string" ? value : "";
}

export async function getRaceHistory(contentId: string): Promise<RaceRevision[]> {
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("v2_content_revisions")
    .select("id, revision, snapshot, edited_by, created_at")
    .eq("content_id", contentId)
    .order("revision", { ascending: false });

  if (error) throw new Error("Não foi possível carregar o histórico desta raça.");

  const revisions = (data ?? []) as RevisionRow[];
  const editorIds = [...new Set(revisions.flatMap((revision) => revision.edited_by ?? []))];
  const editorNames = new Map<string, string>();

  if (editorIds.length > 0) {
    const { data: profiles } = await client
      .from("v2_profiles")
      .select("user_id, display_name")
      .in("user_id", editorIds);

    profiles?.forEach((profile) => {
      editorNames.set(profile.user_id, profile.display_name || "Administrador");
    });
  }

  return revisions.map((revision) => ({
    id: revision.id,
    revision: revision.revision,
    editedBy: revision.edited_by,
    editorName: revision.edited_by
      ? (editorNames.get(revision.edited_by) ?? "Administrador")
      : "Sistema",
    createdAt: revision.created_at,
    snapshotName: getSnapshotValue(revision.snapshot, "name") || "Raça sem nome",
    snapshotStatus: getSnapshotValue(revision.snapshot, "status") || "draft",
  }));
}
