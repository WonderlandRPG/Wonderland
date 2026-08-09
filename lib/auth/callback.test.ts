import { describe, expect, it } from "vitest";

import { getAuthCallbackPath } from "@/lib/auth/callback";

describe("ponte de retorno do Supabase", () => {
  it("recupera um código PKCE que caiu na página inicial", () => {
    expect(getAuthCallbackPath({ code: "codigo-seguro" })).toBe(
      "/auth/callback?code=codigo-seguro",
    );
  });

  it("encaminha recuperação por token para a criação da nova senha", () => {
    expect(getAuthCallbackPath({ token_hash: "hash-seguro", type: "recovery" })).toBe(
      "/auth/callback?token_hash=hash-seguro&type=recovery&next=%2Fnova-senha",
    );
  });

  it("ignora uma visita comum sem credencial de autenticação", () => {
    expect(getAuthCallbackPath({})).toBeNull();
  });
});
