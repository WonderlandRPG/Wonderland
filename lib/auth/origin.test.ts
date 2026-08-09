import { describe, expect, it } from "vitest";

import { resolveRequestOrigin } from "@/lib/auth/origin";

describe("origem dos links de autenticação", () => {
  it("mantém o link no mesmo domínio da preview", () => {
    expect(
      resolveRequestOrigin({
        forwardedHost: "wonderland-preview.vercel.app",
        forwardedProtocol: "https",
        configuredUrl: "https://wonderland-six.vercel.app",
      }),
    ).toBe("https://wonderland-preview.vercel.app");
  });

  it("usa a URL configurada apenas quando a requisição não informa domínio", () => {
    expect(resolveRequestOrigin({ configuredUrl: "https://wonderland-six.vercel.app/app" })).toBe(
      "https://wonderland-six.vercel.app",
    );
  });

  it("recusa um cabeçalho de host malformado", () => {
    expect(
      resolveRequestOrigin({
        forwardedHost: "site.example/caminho",
        configuredUrl: "https://wonderland-six.vercel.app",
      }),
    ).toBe("https://wonderland-six.vercel.app");
  });
});
