import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { loginSchema, newPasswordSchema, signUpSchema } from "@/lib/auth/validation";

describe("validação das contas", () => {
  it("aceita um cadastro completo e normaliza o e-mail", () => {
    const result = signUpSchema.parse({
      displayName: "  Colten  ",
      email: "  COLTEN@EXAMPLE.COM ",
      password: "Wonderland2026",
      confirmPassword: "Wonderland2026",
      acceptedTerms: "on",
    });

    expect(result.displayName).toBe("Colten");
    expect(result.email).toBe("colten@example.com");
  });

  it("recusa senhas diferentes", () => {
    const result = newPasswordSchema.safeParse({
      password: "Wonderland2026",
      confirmPassword: "Wonderland2027",
    });

    expect(result.success).toBe(false);
  });

  it("não altera espaços que façam parte da senha", () => {
    const result = loginSchema.parse({
      email: "colten@example.com",
      password: " Wonderland2026 ",
    });

    expect(result.password).toBe(" Wonderland2026 ");
  });
});

describe("redirecionamentos internos", () => {
  it("mantém caminhos internos", () => {
    expect(getSafeRedirectPath("/admin?aba=usuarios")).toBe("/admin?aba=usuarios");
  });

  it("bloqueia destinos externos", () => {
    expect(getSafeRedirectPath("//site-malicioso.example")).toBe("/perfil");
    expect(getSafeRedirectPath("https://site-malicioso.example")).toBe("/perfil");
  });
});
