import { describe, expect, it } from "vitest";
import { resolveFontRequirements } from "../src/plugin/fonts";

describe("strict font mapping", () => {
  const available = [
    { fontName: { family: "Inter", style: "Regular" } },
    { fontName: { family: "Inter", style: "Semi Bold" } },
    { fontName: { family: "Inter", style: "Bold" } }
  ];

  it("maps CSS numeric weights to actual installed style names", () => {
    const result = resolveFontRequirements([{ family: "Inter", weight: 600, style: "Normal", nodes: ["n"] }], available);
    expect(result.errors).toHaveLength(0);
    expect(result.map.get("Inter|600|Normal")).toEqual({ family: "Inter", style: "Semi Bold" });
  });

  it("hard-fails a missing family instead of silently using Regular", () => {
    const result = resolveFontRequirements([{ family: "Missing Sans", weight: 400, style: "Normal", nodes: ["n"] }], available);
    expect(result.errors[0].code).toBe("FONT_FAMILY_MISSING");
  });
});
