import type { AxisSizing, IrNode } from "../shared/schema";

export type FigmaSizing = "FIXED" | "HUG" | "FILL";
export type PlannedNode = IrNode & {
  layoutSizingHorizontal: FigmaSizing;
  layoutSizingVertical: FigmaSizing;
  children: PlannedNode[];
  synthetic?: "flexible-space" | "centering-wrapper" | "spacing-wrapper";
};

type PlanContext = {
  parentLayout: "none" | "horizontal" | "vertical" | "grid";
  parentFixed: { horizontal: boolean; vertical: boolean };
};

function mapSizing(value: AxisSizing): FigmaSizing {
  return value === "fill" ? "FILL" : value === "hug" ? "HUG" : "FIXED";
}

function flexibleSpace(parent: IrNode): PlannedNode {
  const vertical = parent.layout.mode === "vertical";
  const raw: IrNode = {
    id: `${parent.id}::flexible-space`, name: "Layout / Flexible Space", kind: "frame",
    geometry: { x: 0, y: 0, width: vertical ? Math.max(parent.geometry.width - parent.layout.padding[1] - parent.layout.padding[3], 1) : 1, height: vertical ? 1 : Math.max(parent.geometry.height - parent.layout.padding[0] - parent.layout.padding[2], 1) },
    visibleBounds: { x: 0, y: 0, width: 0, height: 0 },
    layout: { mode: "none", gap: 0, padding: [0, 0, 0, 0], justify: "start", align: "start", wrap: false },
    sizing: { horizontal: vertical ? "fill" : "fill", vertical: vertical ? "fill" : "fill", grow: 1 },
    style: { fills: [], opacity: 1 }, children: []
  };
  return { ...raw, layoutSizingHorizontal: vertical ? "FILL" : "FILL", layoutSizingVertical: vertical ? "FILL" : "FILL", children: [], synthetic: "flexible-space" };
}

function centerWrapper(child: PlannedNode, parent: IrNode): PlannedNode {
  const verticalParent = parent.layout.mode === "vertical";
  const raw: IrNode = {
    id: `${child.id}::center`, name: `Layout / Center ${child.name}`, kind: "frame",
    geometry: { ...child.geometry, width: verticalParent ? Math.max(parent.geometry.width - parent.layout.padding[1] - parent.layout.padding[3], child.geometry.width) : child.geometry.width },
    visibleBounds: child.visibleBounds,
    layout: { mode: verticalParent ? "horizontal" : "vertical", gap: 0, padding: [0, 0, 0, 0], justify: "center", align: "center", wrap: false },
    sizing: { horizontal: verticalParent ? "fill" : "hug", vertical: verticalParent ? "hug" : "fill", grow: 0 },
    style: { fills: [], opacity: 1 }, children: []
  };
  return {
    ...raw,
    layoutSizingHorizontal: verticalParent ? "FILL" : "HUG",
    layoutSizingVertical: verticalParent ? "HUG" : "FILL",
    children: [child],
    synthetic: "centering-wrapper"
  };
}

function spacingWrapper(child: PlannedNode, parent: IrNode, margins: [number, number, number, number]): PlannedNode {
  const verticalParent = parent.layout.mode === "vertical";
  const raw: IrNode = {
    id: `${child.id}::spacing`, name: `Layout / Spacing ${child.name}`, kind: "frame",
    geometry: {
      x: child.geometry.x - margins[3],
      y: child.geometry.y - margins[0],
      width: child.geometry.width + margins[1] + margins[3],
      height: child.geometry.height + margins[0] + margins[2]
    },
    visibleBounds: child.visibleBounds,
    layout: { mode: verticalParent ? "vertical" : "horizontal", gap: 0, padding: margins, justify: "start", align: child.alignSelf === "center" ? "center" : "start", wrap: false },
    sizing: { horizontal: child.sizing.horizontal, vertical: "hug", grow: child.sizing.grow },
    style: { fills: [], opacity: 1 }, children: []
  };
  return {
    ...raw,
    layoutSizingHorizontal: mapSizing(raw.sizing.horizontal),
    layoutSizingVertical: child.sizing.vertical === "fill" ? "FILL" : "HUG",
    children: [child],
    synthetic: "spacing-wrapper"
  };
}

export function planFigmaNode(node: IrNode, context: PlanContext): PlannedNode {
  const sizing = { ...node.sizing };
  const self: PlannedNode = {
    ...node,
    sizing,
    layoutSizingHorizontal: mapSizing(node.sizing.horizontal),
    layoutSizingVertical: mapSizing(node.sizing.vertical),
    children: []
  };
  let insertedFlexibleSpace = false;
  for (const child of node.children) {
    if (child.autoMargin?.top && node.layout.mode === "vertical" && !insertedFlexibleSpace) {
      self.children.push(flexibleSpace(node));
      insertedFlexibleSpace = true;
    }
    const planned = planFigmaNode(child, {
      parentLayout: node.layout.mode,
      parentFixed: {
        horizontal: node.sizing.horizontal === "fixed",
        vertical: node.sizing.vertical === "fixed"
      }
    });
    let finalChild = child.alignSelf === "center" && node.layout.mode !== "none" ? centerWrapper(planned, node) : planned;
    const margin = child.margins || [0, 0, 0, 0];
    if (!child.autoMargin?.top && margin.some((value) => value > 0) && node.layout.mode !== "none") finalChild = spacingWrapper(finalChild, node, margin);
    self.children.push(finalChild);
  }
  // Figma cannot represent a HUG parent axis that contains a Fill/Grow child
  // on that same axis. Keep the browser's measured parent size and make that
  // axis FIXED; the child can then legally continue to Fill.
  for (const axis of ["horizontal", "vertical"] as const) {
    if (self.sizing[axis] !== "hug" || node.layout.mode === "none") continue;
    const conflict = self.children.some((child) => child.position !== "absolute" && (child.sizing[axis] === "fill" || child.sizing.grow > 0));
    if (conflict) {
      self.sizing[axis] = "fixed";
      self[`layoutSizing${axis === "horizontal" ? "Horizontal" : "Vertical"}`] = "FIXED";
    }
  }
  return self;
}
