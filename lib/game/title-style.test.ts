import { describe, expect, it } from "vitest";
import { defaultTitleStyle, parseTitleStyle } from "./title-style";

describe("title style", () => {
  it("keeps legacy three-color titles compatible", () => {
    const style = parseTitleStyle({
      primary: "#ffffff",
      secondary: "#123456",
      glow: "#abcdef",
    });

    expect(style.primary).toBe("#ffffff");
    expect(style.secondary).toBe("#123456");
    expect(style.glow).toBe("#abcdef");
    expect(style.frame).toBe(defaultTitleStyle.frame);
    expect(style.category).toBe(defaultTitleStyle.category);
  });

  it("rejects unknown controlled metadata by falling back safely", () => {
    const style = parseTitleStyle({ frame: "broken", category: "unknown", animated: false });

    expect(style.frame).toBe(defaultTitleStyle.frame);
    expect(style.category).toBe(defaultTitleStyle.category);
    expect(style.animated).toBe(false);
  });
});
