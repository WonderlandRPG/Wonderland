import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(path, "utf8");

describe("editores administrativos de atributos Rework", () => {
  it("exibe e envia HP em itens e títulos sem pedir ARC legado", () => {
    for (const section of ["itens", "titulos"] as const) {
      const page = source(`app/admin/${section}/page.tsx`);
      const actions = source(`app/admin/${section}/actions.ts`);
      expect(page).toContain('"HP"] as const');
      expect(actions).toContain("HP: z.coerce.number()");
      if (section === "itens") expect(actions).toContain('HP: formData.get("HP")');
      expect(actions).not.toContain('formData.get("ARC")');
      expect(actions).toContain("oldAttributes.data.ARC");
    }
  });

  it("mantém o atributo histórico de criaturas sem exigir campo oculto no formulário", () => {
    const actions = source("app/admin/bestiario/actions.ts");
    expect(actions).not.toContain('formData.get("ARC")');
    expect(actions).toContain("oldProfile.data.attributes.ARC");
  });
});
