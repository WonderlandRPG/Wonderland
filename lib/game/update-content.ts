import { z } from "zod";

export const updateBlockTypes = [
  "heading",
  "subheading",
  "paragraph",
  "highlight",
  "list",
  "stat",
  "image",
] as const;

export const updateBlockSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(updateBlockTypes),
  content: z.string().trim().min(1).max(2000),
  label: z.string().trim().max(80).optional(),
});

export type UpdateBlock = z.infer<typeof updateBlockSchema>;

function stripLegacyMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
}

export function parseUpdateBlocks(value: unknown): UpdateBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    if (typeof entry === "string" && stripLegacyMarkdown(entry)) {
      return [
        {
          id: `legacy-${index}`,
          type: "paragraph" as const,
          content: stripLegacyMarkdown(entry),
        },
      ];
    }
    const parsed = updateBlockSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

export function parseUpdateBlocksJson(value: string) {
  try {
    const blocks = parseUpdateBlocks(JSON.parse(value));
    return blocks.length ? { success: true as const, data: blocks } : { success: false as const };
  } catch {
    return { success: false as const };
  }
}
