import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { effectSources, themeSource } from "@/lib/audio/sources";

const publicDirectory = join(process.cwd(), "public");

describe("arquivos de áudio", () => {
  it("usa caminhos seguros para navegador e CDN", () => {
    for (const source of [themeSource, ...Object.values(effectSources)]) {
      expect(source).not.toMatch(/[ %]/);
    }
  });

  it("mantém a música e todos os efeitos publicados", () => {
    for (const source of [themeSource, ...Object.values(effectSources)]) {
      const filePath = join(publicDirectory, source.replace(/^\//, ""));
      expect(existsSync(filePath), source).toBe(true);
      expect(statSync(filePath).size, source).toBeGreaterThan(1_000);
    }
  });
});
