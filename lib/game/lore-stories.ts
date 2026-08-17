import type { Json } from "@/lib/db/types";

export type LoreStoryTone = "forest" | "wine" | "midnight" | "royal" | "ember" | "ocean";

export type LoreStoryPayload = {
  excerpt: string;
  bodyHtml: string;
  authorName: string;
  publishedOn: string;
  coverTone: LoreStoryTone;
};

const toneSet = new Set<LoreStoryTone>(["forest", "wine", "midnight", "royal", "ember", "ocean"]);
const allowedTags = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h2",
  "h3",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "div",
  "span",
]);

export function sanitizeLoreHtml(input: string) {
  const withoutDangerousBlocks = input
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*\/?\s*>/gi, "");

  return withoutDangerousBlocks.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!allowedTags.has(tag)) return "";
    const closing = /^<\s*\//.test(full);
    if (closing) return `</${tag}>`;
    if (tag === "br") return "<br>";

    let attrs = "";
    if (tag === "a") {
      const href = rawAttrs.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]?.trim() ?? "";
      if (/^https?:\/\//i.test(href)) {
        const safeHref = href.replace(/"/g, "&quot;");
        attrs += ` href="${safeHref}" target="_blank" rel="noreferrer noopener"`;
      }
    }
    const align = rawAttrs.match(/text-align\s*:\s*(left|center|right|justify)/i)?.[1]?.toLowerCase();
    if (align) attrs += ` style="text-align:${align}"`;
    return `<${tag}${attrs}>`;
  });
}

export function plainTextFromLoreHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseLoreStoryPayload(payload: Json | null | undefined): LoreStoryPayload {
  const source = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const get = (key: string) => (key in source ? source[key] : undefined);
  const bodyHtml = typeof get("bodyHtml") === "string" ? sanitizeLoreHtml(get("bodyHtml") as string) : "";
  const excerptSource = typeof get("excerpt") === "string" ? (get("excerpt") as string).trim() : "";
  const coverToneRaw = typeof get("coverTone") === "string" ? (get("coverTone") as string) : "forest";
  return {
    excerpt: excerptSource || plainTextFromLoreHtml(bodyHtml).slice(0, 180),
    bodyHtml,
    authorName: typeof get("authorName") === "string" ? (get("authorName") as string).trim() : "Arquivo Real",
    publishedOn:
      typeof get("publishedOn") === "string" && /^\d{4}-\d{2}-\d{2}$/.test(get("publishedOn") as string)
        ? (get("publishedOn") as string)
        : new Date().toISOString().slice(0, 10),
    coverTone: toneSet.has(coverToneRaw as LoreStoryTone) ? (coverToneRaw as LoreStoryTone) : "forest",
  };
}

export function slugifyLoreStory(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}
