import { describe, expect, it } from "vitest";

import { musicTrackForPath } from "./sources";

describe("música dinâmica", () => {
  it("troca a trilha conforme a área do jogo", () => {
    expect(musicTrackForPath("/arena")).toBe("pvp");
    expect(musicTrackForPath("/mapas")).toBe("mapa");
    expect(musicTrackForPath("/loja")).toBe("biblioteca");
    expect(musicTrackForPath("/personagens")).toBe("tema");
  });
});
