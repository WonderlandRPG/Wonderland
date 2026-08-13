import { describe, expect, it } from "vitest";
import { parseUpdateBlocks, parseUpdateBlocksJson } from "./update-content";

describe("structured update content", () => {
  it("keeps structured blocks", () => {
    expect(parseUpdateBlocks([{ id: "a", type: "heading", content: "Loja renovada" }])).toEqual([
      { id: "a", type: "heading", content: "Loja renovada" },
    ]);
  });

  it("converts old string notes without exposing markdown", () => {
    expect(parseUpdateBlocks(["### **A Arena voltou**"])).toEqual([
      { id: "legacy-0", type: "paragraph", content: "A Arena voltou" },
    ]);
  });

  it("rejects an empty block document", () => {
    expect(parseUpdateBlocksJson("[]").success).toBe(false);
  });

  it("keeps uploaded image blocks and their captions", () => {
    expect(
      parseUpdateBlocks([
        {
          id: "image-1",
          type: "image",
          content: "https://example.supabase.co/storage/v1/object/public/update-images/news.webp",
          label: "Nova Dungeon",
        },
      ]),
    ).toEqual([
      {
        id: "image-1",
        type: "image",
        content: "https://example.supabase.co/storage/v1/object/public/update-images/news.webp",
        label: "Nova Dungeon",
      },
    ]);
  });
});
