import { withAlpha } from "./color";

describe("withAlpha", () => {
  it("converts a hex color and alpha into an rgba() string", () => {
    expect(withAlpha("#F0913D", 0.16)).toBe("rgba(240, 145, 61, 0.16)");
  });

  it("works without a leading #", () => {
    expect(withAlpha("F0913D", 0.5)).toBe("rgba(240, 145, 61, 0.5)");
  });

  it("supports alpha 0 and 1", () => {
    expect(withAlpha("#000000", 0)).toBe("rgba(0, 0, 0, 0)");
    expect(withAlpha("#FFFFFF", 1)).toBe("rgba(255, 255, 255, 1)");
  });
});
