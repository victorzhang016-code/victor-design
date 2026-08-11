import { describe, expect, it } from "vitest";
import { planFigmaNode } from "../src/planner/plan";
import type { IrNode } from "../src/shared/schema";

function node(overrides: Partial<IrNode> = {}): IrNode {
  return {
    id: "n", name: "Node", kind: "frame",
    geometry: { x: 0, y: 0, width: 342, height: 782 }, visibleBounds: { x: 0, y: 0, width: 342, height: 782 },
    layout: { mode: "vertical", gap: 16, padding: [24, 24, 24, 24], justify: "start", align: "stretch", wrap: false },
    sizing: { horizontal: "fill", vertical: "fill", grow: 1 }, style: { fills: [], opacity: 1 }, children: [], ...overrides
  };
}

describe("Figma layout planner", () => {
  it("keeps quiet-wrap at captured width and maps both axes to FILL", () => {
    const planned = planFigmaNode(node({ name: "Quiet / Content" }), { parentLayout: "vertical", parentFixed: { horizontal: true, vertical: true } });
    expect(planned.geometry.width).toBe(342);
    expect(planned.layoutSizingHorizontal).toBe("FILL");
    expect(planned.layoutSizingVertical).toBe("FILL");
  });

  it("represents margin-top:auto with one semantic grow frame", () => {
    const content = node({ children: [
      node({ id: "a", name: "Message", sizing: { horizontal: "fill", vertical: "hug", grow: 0 } }),
      node({ id: "b", name: "Footer", autoMargin: { top: true, right: false, bottom: false, left: false }, sizing: { horizontal: "fill", vertical: "hug", grow: 0 } })
    ] });
    const planned = planFigmaNode(content, { parentLayout: "none", parentFixed: { horizontal: true, vertical: true } });
    expect(planned.children.filter((c) => c.name === "Layout / Flexible Space")).toHaveLength(1);
    expect(planned.children.some((c) => c.name === "spacer")).toBe(false);
  });

  it("uses a centering wrapper for cross-axis self centering", () => {
    const centered = node({ id: "grabber", name: "Sheet / Grabber", alignSelf: "center", sizing: { horizontal: "fixed", vertical: "fixed", grow: 0 }, geometry: { x: 171, y: 8, width: 48, height: 5 } });
    const planned = planFigmaNode(node({ children: [centered] }), { parentLayout: "none", parentFixed: { horizontal: true, vertical: true } });
    expect(planned.children[0].name).toBe("Layout / Center Sheet / Grabber");
    expect(planned.children[0].children[0].name).toBe("Sheet / Grabber");
  });

  it("fixes a HUG parent axis when a child fills that axis", () => {
    const planned = planFigmaNode(node({
      name: "Field",
      layout: { mode: "vertical", gap: 0, padding: [0, 0, 0, 0], justify: "start", align: "start", wrap: false },
      sizing: { horizontal: "hug", vertical: "hug", grow: 0 },
      children: [node({ name: "Value", kind: "text", sizing: { horizontal: "fill", vertical: "hug", grow: 0 } })]
    }), { parentLayout: "vertical", parentFixed: { horizontal: false, vertical: false } });
    expect(planned.layoutSizingHorizontal).toBe("FIXED");
    expect(planned.sizing.horizontal).toBe("fixed");
    expect(planned.children[0].layoutSizingHorizontal).toBe("FILL");
  });

  it("maps block-like cross-axis width to FILL instead of collapsing it to HUG", () => {
    const planned = planFigmaNode(node({
      geometry: { x: 0, y: 0, width: 390, height: 844 },
      layout: { mode: "vertical", gap: 0, padding: [0, 24, 0, 24], justify: "start", align: "start", wrap: false },
      children: [node({ name: "Primary Button", geometry: { x: 24, y: 0, width: 342, height: 54 }, sizing: { horizontal: "hug", vertical: "fixed", grow: 0 } })]
    }), { parentLayout: "none", parentFixed: { horizontal: true, vertical: true } });
    expect(planned.children[0].layoutSizingHorizontal).toBe("FILL");
  });

  it("uses a centering wrapper when browser text-align is center", () => {
    const planned = planFigmaNode(node({ children: [node({ name: "Centered label", kind: "text", text: { value: "Continue", family: "Inter", weight: 600, style: "Normal", size: 14, lineHeight: null, letterSpacing: 0, align: "center", color: { r: 0, g: 0, b: 0, a: 1 }, singleLine: true }, sizing: { horizontal: "hug", vertical: "hug", grow: 0 } })] }), { parentLayout: "none", parentFixed: { horizontal: true, vertical: true } });
    expect(planned.children[0].name).toBe("Layout / Center Centered label");
  });
});
