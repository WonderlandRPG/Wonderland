import { describe, expect, it } from "vitest";

import { getSignInErrorMessage } from "@/lib/auth/errors";

describe("mensagens seguras de entrada", () => {
  it("explica quando o e-mail ainda não foi confirmado", () => {
    expect(
      getSignInErrorMessage({ code: "email_not_confirmed", message: "", status: 400 }),
    ).toContain("ainda não foi confirmado");
  });

  it("mantém credenciais inválidas sem revelar se a conta existe", () => {
    expect(getSignInErrorMessage({ code: "invalid_credentials", message: "", status: 400 })).toBe(
      "E-mail ou senha incorretos. Confira os dados e tente novamente.",
    );
  });
});
