"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdministrativeAccount } from "@/lib/auth/account";
import { sanitizeLoreHtml, slugifyLoreStory, type LoreStoryTone } from "@/lib/game/lore-stories";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const tones = new Set<LoreStoryTone>(["forest", "wine", "midnight", "royal", "ember", "ocean"]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function resultPath(formData: FormData, status: "salvo" | "erro") {
  return text(formData, "returnTo") === "/historia"
    ? `/historia?status=${status}#biblioteca`
    : `/admin/historias?status=${status}`;
}

function deleteResultPath(formData: FormData, status: "apagado" | "erro") {
  return text(formData, "returnTo") === "/historia"
    ? `/historia?status=${status}#biblioteca`
    : `/admin/historias?status=${status}`;
}

export async function saveLoreStoryAction(formData: FormData) {
  const account = await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  if (!client) redirect(resultPath(formData, "erro"));

  const id = text(formData, "id");
  const title = text(formData, "title");
  const requestedSlug = text(formData, "slug");
  const slug = slugifyLoreStory(requestedSlug || title);
  const excerpt = text(formData, "excerpt").slice(0, 320);
  const authorName = text(formData, "authorName").slice(0, 80) || account.displayName;
  const publishedOn = /^\d{4}-\d{2}-\d{2}$/.test(text(formData, "publishedOn"))
    ? text(formData, "publishedOn")
    : new Date().toISOString().slice(0, 10);
  const rawTone = text(formData, "coverTone") as LoreStoryTone;
  const coverTone = tones.has(rawTone) ? rawTone : "forest";
  const bodyHtml = sanitizeLoreHtml(text(formData, "bodyHtml"));
  const published = formData.get("published") === "on";

  if (!title || !slug || !bodyHtml) redirect(resultPath(formData, "erro"));

  const payload = { excerpt, bodyHtml, authorName, publishedOn, coverTone };
  const status = published ? "published" : "draft";
  const publishedAt = published ? `${publishedOn}T12:00:00.000Z` : null;

  const result = id
    ? await client
        .from("v2_content")
        .update({ name: title, slug, payload, status, published_at: publishedAt })
        .eq("id", id)
        .eq("content_type", "lore_story")
    : await client.from("v2_content").insert({
        content_type: "lore_story",
        slug,
        name: title,
        payload,
        status,
        published_at: publishedAt,
        created_by: account.id,
        updated_by: account.id,
      });

  if (result.error) redirect(resultPath(formData, "erro"));
  revalidatePath("/historia");
  revalidatePath(`/historia/${slug}`);
  revalidatePath("/admin/historias");
  redirect(resultPath(formData, "salvo"));
}

export async function deleteLoreStoryAction(formData: FormData) {
  await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  const id = text(formData, "id");
  if (!client || !id) redirect(deleteResultPath(formData, "erro"));

  const { data: story } = await client
    .from("v2_content")
    .select("slug")
    .eq("id", id)
    .eq("content_type", "lore_story")
    .maybeSingle();
  const { error } = await client.from("v2_content").delete().eq("id", id).eq("content_type", "lore_story");
  if (error) redirect(deleteResultPath(formData, "erro"));

  revalidatePath("/historia");
  if (story?.slug) revalidatePath(`/historia/${story.slug}`);
  revalidatePath("/admin/historias");
  redirect(deleteResultPath(formData, "apagado"));
}
