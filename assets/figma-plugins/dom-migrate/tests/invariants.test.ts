import { describe, expect, it } from "vitest";
import { validateIr } from "../src/shared/invariants";
import type { DomMigratePackageV3 } from "../src/shared/schema";

const base: DomMigratePackageV3 = {
  schemaVersion: 3,
  generator: { name: "test", version: "3.0.0" },
  capturedAt: "2026-08-11T00:00:00.000Z",
  images: {},
  pages: [{ id: "p", name: "quiet", viewport: { width: 390, height: 844 }, root: {
    id: "root", name: "Screen", kind: "frame", geometry: { x: 0, y: 0, width: 390, height: 844 },
    visibleBounds: { x: 0, y: 0, width: 390, height: 844 },
    layout: { mode: "vertical", gap: 0, padding: [0, 0, 0, 0], justify: "start", align: "stretch", wrap: false },
    sizing: { horizontal: "fixed", vertical: "fixed", grow: 0 }, style: { fills: [], opacity: 1 }, children: []
  }}],
  compatibility: { warnings: [], errors: [], fonts: [], rasterLayers: [] }
};

describe("IR invariants", () => {
  it("rejects a hug parent axis that contains fill/grow children", () => {
    const pkg = structuredClone(base);
    pkg.pages[0].root.sizing.vertical = "hug";
    pkg.pages[0].root.children.push({
      id: "quiet-wrap", name: "Quiet / Content", kind: "frame",
      geometry: { x: 24, y: 14, width: 342, height: 782 }, visibleBounds: { x: 24, y: 14, width: 342, height: 782 },
      layout: { mode: "vertical", gap: 0, padding: [0, 0, 0, 0], justify: "start", align: "stretch", wrap: false },
      sizing: { horizontal: "fill", vertical: "fill", grow: 1 }, style: { fills: [], opacity: 1 }, children: []
    });
    expect(validateIr(pkg).errors.some((e) => e.code === "HUG_FILL_CONFLICT")).toBe(true);
  });

  it("forbids anonymous pixel spacers", () => {
    const pkg = structuredClone(base);
    pkg.pages[0].root.children.push({
      id: "spacer", name: "spacer", kind: "shape",
      geometry: { x: 0, y: 0, width: 1, height: 18 }, visibleBounds: { x: 0, y: 0, width: 1, height: 18 },
      layout: { mode: "none", gap: 0, padding: [0, 0, 0, 0], justify: "start", align: "start", wrap: false },
      sizing: { horizontal: "fixed", vertical: "fixed", grow: 0 }, style: { fills: [], opacity: 1 }, children: []
    });
    expect(validateIr(pkg).errors.some((e) => e.code === "PIXEL_SPACER")).toBe(true);
  });
});
