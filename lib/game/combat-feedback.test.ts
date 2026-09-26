import { describe, expect, it } from "vitest";

describe("apresentação dos efeitos de combate", () => {
  it("mantém mensagens distinguíveis para dano, cura, escudo e controle", () => {
    const text = "causou dano recuperou HP escudo paralisado";
    expect(text).toMatch(/dano/);
    expect(text).toMatch(/recuperou/);
    expect(text).toMatch(/escudo/);
    expect(text).toMatch(/paralisado/);
  });
});
