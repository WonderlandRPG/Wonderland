import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "app/design-tokens.css"), "utf8");

function token(name: string) {
  const pattern = new RegExp("\\" + name + "\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;");
  const match = css.match(pattern);
  if (!match) throw new Error("Token obrigatório ausente ou sem cor hexadecimal: " + name);
  return match[1];
}

function luminance(hex: string) {
  const rgb = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(a: string, b: string) {
  const first = luminance(a);
  const second = luminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

const requiredTokens = [
  "--wx-color-canvas",
  "--wx-color-surface",
  "--wx-color-surface-raised",
  "--wx-color-text",
  "--wx-color-text-muted",
  "--wx-color-surface-inverse",
  "--wx-color-on-inverse",
  "--wx-color-on-inverse-muted",
  "--wx-color-primary",
  "--wx-color-on-primary",
  "--wx-color-accent",
  "--wx-color-on-accent",
  "--wx-color-success",
  "--wx-color-on-success",
  "--wx-color-danger",
  "--wx-color-on-danger",
  "--wx-color-input",
  "--wx-color-input-text",
] as const;

const contrastPairs = [
  ["--wx-color-text", "--wx-color-surface"],
  ["--wx-color-text", "--wx-color-surface-raised"],
  ["--wx-color-text-muted", "--wx-color-surface"],
  ["--wx-color-on-inverse", "--wx-color-surface-inverse"],
  ["--wx-color-on-inverse-muted", "--wx-color-surface-inverse"],
  ["--wx-color-on-primary", "--wx-color-primary"],
  ["--wx-color-on-accent", "--wx-color-accent"],
  ["--wx-color-on-success", "--wx-color-success"],
  ["--wx-color-on-danger", "--wx-color-danger"],
  ["--wx-color-input-text", "--wx-color-input"],
] as const;

describe("Wonderland visual theme contract", () => {
  it("declares every semantic token required by the UI", () => {
    for (const name of requiredTokens) expect(() => token(name)).not.toThrow();
  });

  it.each(contrastPairs)("%s over %s reaches WCAG AA", (foreground, background) => {
    expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps canonical semantic colors in one source of truth", () => {
    const files = [
      "app/wonderland-base.css",
      "app/wonderland-repair.css",
      "app/wonderland-medieval.css",
      "app/contrast-guard.css",
    ];

    for (const file of files) {
      const contents = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(contents.match(/--wx-color-[\w-]+\s*:/g) ?? []).toHaveLength(0);
    }
  });
});
