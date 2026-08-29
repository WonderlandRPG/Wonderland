import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const tokensPath = resolve(root, "app/theme-tokens.css");
const tokensCss = readFileSync(tokensPath, "utf8");

function token(name: string) {
  const match = tokensCss.match(new RegExp("--" + name + "\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;"));
  if (!match) throw new Error("Token --" + name + " não encontrado ou não é hexadecimal.");
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
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function walkCss(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = resolve(directory, entry);
    return statSync(full).isDirectory()
      ? walkCss(full)
      : full.endsWith(".css")
        ? [full]
        : [];
  });
}

const contrastPairs = [
  ["wl-text", "wl-surface"],
  ["wl-text", "wl-surface-raised"],
  ["wl-text-muted", "wl-surface"],
  ["wl-accent", "wl-surface"],
  ["wl-text-inverse", "wl-surface-dark"],
  ["wl-text-inverse-muted", "wl-surface-dark"],
  ["wl-accent-contrast", "wl-accent"],
  ["wl-gold-contrast", "wl-gold"],
  ["wl-gold-strong", "wl-surface"],
  ["wl-success-text", "wl-success-bg"],
  ["wl-warning-text", "wl-warning-bg"],
  ["wl-danger-text", "wl-danger-bg"],
] as const;

/*
 * Arquivos existentes antes da fiscalização automática.
 * São dívida técnica congelada: podem ser migrados e removidos desta lista,
 * mas nenhum CSS novo ganha permissão automática para inventar paleta.
 */
const legacyColorFiles = new Set([
  "app/admin/admin-dashboard-repair.css",
  "app/admin/admin-experience.css",
  "app/admin/admin-shell-fix.css",
  "app/admin/admin.css",
  "app/admin/historias/history-admin.module.css",
  "app/arena/arena-depth.css",
  "app/arena/arena-images.css",
  "app/arena/arena-rework.css",
  "app/arena/arena.css",
  "app/arena/combat-clarity.css",
  "app/arena/combat-immersion.css",
  "app/arena/combat-polish.css",
  "app/arena/combat-result-modal.css",
  "app/arena/entry-hotfix.css",
  "app/arena/jrpg-formation.css",
  "app/arena/jrpg.css",
  "app/arena/pvp-party.css",
  "app/auth-pages.css",
  "app/barebones.css",
  "app/bestiario/bestiario.css",
  "app/community.css",
  "app/contrast-guard.css",
  "app/event-period.css",
  "app/experience-polish.css",
  "app/fantasy-theme.css",
  "app/globals.css",
  "app/historia/history.module.css",
  "app/home.module.css",
  "app/immersive-cleanup.css",
  "app/immersive-rpg.css",
  "app/inventory-rebuild.css",
  "app/loja/loja.css",
  "app/loja/rarity-glow.css",
  "app/loja/shop-rework.css",
  "app/manutencao/maintenance-contrast.module.css",
  "app/manutencao/maintenance.module.css",
  "app/missoes/missoes.css",
  "app/personagens/character-image-upload.css",
  "app/personagens/equipment-layout.css",
  "app/personagens/equipment-modal.css",
  "app/personagens/personagens-route.css",
  "app/personagens/personagens.module.css",
  "app/personagens/sheet-experience.css",
  "app/presence-experience.css",
  "app/rank-visuals.css",
  "app/ranking-experience.css",
  "app/readability-hotfix.css",
  "app/reinos/reinos.css",
  "app/requested-visual-overhaul.css",
  "app/rpg-finishing.css",
  "app/rpg-overhaul.css",
  "app/shop-final.css",
  "app/shop-legibility-fix.css",
  "app/site-experience.css",
  "app/structural-rpg.css",
  "app/wonderland-backgrounds.css",
  "app/wonderland-base.css",
  "app/wonderland-complete.css",
  "app/wonderland-fixes.css",
  "app/wonderland-hotfix.css",
  "app/wonderland-medieval.css",
  "app/wonderland-pages.css",
  "app/wonderland-repair.css",
  "app/wonderland-ui.css",
  "app/world-pages.css",
  "components/admin/admin-creation-studio.module.css",
  "components/admin/history-cover-upload.module.css",
  "components/arena/dungeon-lobby.module.css",
  "components/audio/audio-provider.module.css",
  "components/characters/character-portrait-card.module.css",
  "components/characters/equipped-title.module.css",
  "components/grimoire/grimoire.module.css",
  "components/items/item-visuals.module.css",
  "components/player-nav.module.css",
  "components/portal-shell.module.css",
  "components/world/realm-location-explorer.module.css",
]);

describe("contrato visual do Wonderland", () => {
  it.each(contrastPairs)("%s sobre %s atende WCAG AA", (foreground, background) => {
    expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(4.5);
  });

  it("tokens não estilizam componentes nem usam !important", () => {
    expect(tokensCss).not.toContain("!important");
    expect(tokensCss).not.toMatch(/\.(player-nav|market-page|sheet-page|ranking|arena)/);
  });

  it("nenhuma outra folha redefine tokens canônicos --wl-*", () => {
    const cssFiles = [...walkCss(resolve(root, "app")), ...walkCss(resolve(root, "components"))];

    for (const file of cssFiles) {
      if (file === tokensPath) continue;
      const css = readFileSync(file, "utf8");
      const declarations = css.match(/--wl-[\w-]+\s*:/g) ?? [];
      expect(declarations, relative(root, file) + " redefine tokens canônicos").toHaveLength(0);
    }
  });

  it("CSS novo não pode criar paleta literal nem correção por !important", () => {
    const cssFiles = [...walkCss(resolve(root, "app")), ...walkCss(resolve(root, "components"))];

    for (const file of cssFiles) {
      const path = relative(root, file).replaceAll("\\\\", "/");
      if (
        path === "app/theme-tokens.css" ||
        path === "app/visual-contract.css" ||
        legacyColorFiles.has(path)
      ) {
        continue;
      }

      const css = readFileSync(file, "utf8");
      expect(css, path + " usa cor literal; use --wl-*").not.toMatch(
        /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/,
      );
      expect(css, path + " usa !important; corrija a arquitetura do componente").not.toContain(
        "!important",
      );
      expect(css, path + " cria :root concorrente").not.toMatch(/:root\b/);
    }
  });

  it("tokens e contrato carregam antes das camadas legadas", () => {
    const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
    const tokensIndex = layout.indexOf('import "./theme-tokens.css"');
    const contractIndex = layout.indexOf('import "./visual-contract.css"');
    const baseIndex = layout.indexOf('import "./wonderland-base.css"');

    expect(tokensIndex).toBeGreaterThanOrEqual(0);
    expect(contractIndex).toBeGreaterThan(tokensIndex);
    expect(baseIndex).toBeGreaterThan(contractIndex);
  });
});
