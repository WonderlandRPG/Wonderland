import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "app/theme-tokens.css"), "utf8");

function token(name: string) {
  const match = css.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match) throw new Error(`Token --${name} não encontrado ou não é uma cor hexadecimal.`);
  return match[1];
}

function rgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(hex: string) {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const pairs = [
  ["wl-text", "wl-surface"],
  ["wl-text", "wl-surface-raised"],
  ["wl-text-muted", "wl-surface"],
  ["wl-accent", "wl-surface"],
  ["wl-text-inverse", "wl-surface-dark"],
  ["wl-text-inverse-muted", "wl-surface-dark"],
  ["wl-gold-strong", "wl-surface"],
  ["wl-success-text", "wl-success-bg"],
  ["wl-warning-text", "wl-warning-bg"],
  ["wl-danger-text", "wl-danger-bg"],
] as const;

describe("contrato de contraste do tema Wonderland", () => {
  for (const [foreground, background] of pairs) {
    it(`--${foreground} sobre --${background} atende WCAG AA`, () => {
      const ratio = contrast(token(foreground), token(background));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("a folha de tokens não usa !important", () => {
    expect(css).not.toContain("!important");
  });

  it("a folha de tokens não estiliza componentes", () => {
    expect(css).not.toMatch(/\.(player-nav|market-page|sheet-page|ranking|arena)/);
  });
});
