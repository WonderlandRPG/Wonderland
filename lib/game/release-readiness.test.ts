import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("portão de publicação", () => {
  it("mantém CI, homologação, healthcheck e rollback disponíveis", () => {
    expect(existsSync(".github/workflows/release-gate.yml")).toBe(true);
    expect(existsSync("app/admin/homologacao/page.tsx")).toBe(true);
    expect(readFileSync("app/api/health/route.ts", "utf8")).toContain("checkedAt");
    expect(existsSync("app/admin/migracao-rework/page.tsx")).toBe(true);
  });

  it("executa toda a cadeia de validação antes do build", () => {
    const workflow = readFileSync(".github/workflows/release-gate.yml", "utf8");
    for (const command of [
      "npm run lint",
      "npm run typecheck",
      "npm test -- --run",
      "npm run build",
    ])
      expect(workflow).toContain(command);
  });
});
