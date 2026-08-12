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

  it("reports a missing family fallback instead of silently using Regular", () => {
    const result = resolveFontRequirements([{ family: "Missing Sans", weight: 400, style: "Normal", nodes: ["n"] }], available);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings[0].code).toBe("FONT_FAMILY_FALLBACK");
    expect(result.map.get("Missing Sans|400|Normal")).toEqual({ family: "Inter", style: "Regular" });
  });

  it("aliases a missing CSS weight to a close native face in the same family", () => {
    const result = resolveFontRequirements([{ family: "PingFang SC", weight: 800, style: "Normal", nodes: ["n"] }], [
      { fontName: { family: "PingFang SC", style: "Regular" } },
      { fontName: { family: "PingFang SC", style: "Bold" } }
    ]);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings[0].code).toBe("FONT_WEIGHT_FALLBACK");
    expect(result.map.get("PingFang SC|800|Normal")).toEqual({ family: "PingFang SC", style: "Bold" });
  });

  it("falls back to an available font instead of blocking when the family is absent", () => {
    const result = resolveFontRequirements([{ family: "PingFang SC", weight: 800, style: "Normal", nodes: ["n"] }], [
      { fontName: { family: "Inter", style: "Regular" } }
    ]);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings[0].code).toBe("FONT_FAMILY_FALLBACK");
    expect(result.map.get("PingFang SC|800|Normal")).toEqual({ family: "Inter", style: "Regular" });
  });
});
