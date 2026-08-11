import type { DomMigratePackageV3, IrNode } from "../shared/schema";

export type PackageRoute = "v3" | "ui-v2" | "flat" | "unknown";

export function detectPackageRoute(input: any): PackageRoute {
  if (input?.schemaVersion === 3) return "v3";
  if (Array.isArray(input?.pages) && input.pages.some((page: any) => page?.tree)) return "ui-v2";
  if (Array.isArray(input?.pages) && input.pages.every((page: any) => Array.isArray(page?.nodes))) return "flat";
  return "unknown";
}

function rgba(color: any, opacity = 1) {
  if (!Array.isArray(color)) return undefined;
  return { r: color[0] || 0, g: color[1] || 0, b: color[2] || 0, a: opacity };
}

function legacyNode(node: any, index: number): IrNode {
  const size = node.size || { w: node.w || 1, h: node.h || 1 };
  const position = node.absolute ? "absolute" : "flow";
  const kind: IrNode["kind"] = node.kind === "text" || node.type === "text" ? "text" : node.kind === "image" || node.type === "image" ? "image" : node.kind === "svg" ? "vector" : node.kind === "shape" || node.type === "shape" ? "shape" : "frame";
  const fillColor = node.fill ? rgba(node.fill.color, node.fill.opacity ?? 1) : undefined;
  const layoutMode = node.layout?.mode === "HORIZONTAL" ? "horizontal" : node.layout?.mode === "VERTICAL" ? "vertical" : "none";
  const result: IrNode = {
    id: node.id || `legacy-${index}-${String(node.name || kind).replace(/\W+/g, "-")}`,
    name: node.name || `Legacy / ${kind}`,
    kind,
    geometry: { x: node.pos?.x || node.x || 0, y: node.pos?.y || node.y || 0, width: size.w || 1, height: size.h || 1 },
    visibleBounds: { x: node.pos?.x || node.x || 0, y: node.pos?.y || node.y || 0, width: size.w || 1, height: size.h || 1 },
    layout: {
      mode: layoutMode,
      gap: node.layout?.gap || 0,
      padding: node.layout?.pad || [0, 0, 0, 0],
      justify: node.layout?.primary === "CENTER" ? "center" : node.layout?.primary === "MAX" ? "end" : node.layout?.primary === "SPACE_BETWEEN" ? "space-between" : "start",
      align: node.layout?.counter === "CENTER" ? "center" : node.layout?.counter === "MAX" ? "end" : node.layout?.counter === "STRETCH" ? "stretch" : "start",
      wrap: false
    },
    sizing: {
      horizontal: node.layoutGrow && layoutMode === "horizontal" ? "fill" : node.fixW ? "fixed" : kind === "text" && node.hug ? "hug" : "fixed",
      vertical: node.layoutGrow && layoutMode === "vertical" ? "fill" : node.fixH ? "fixed" : kind === "text" ? "hug" : "fixed",
      grow: node.layoutGrow || 0
    },
    position,
    absolute: node.absolute ? { x: node.absolute.x, y: node.absolute.y } : undefined,
    autoMargin: { top: Boolean(node.marginTopAuto), right: false, bottom: false, left: false },
    alignSelf: node.centerSelf ? "center" : "auto",
    style: { fills: fillColor ? [{ type: "solid", color: fillColor }] : [], opacity: node.opacity ?? 1, radius: node.radius ? [node.radius, node.radius, node.radius, node.radius] : undefined, clipsContent: Boolean(node.clips) },
    children: (node.children || []).map((child: any, childIndex: number) => legacyNode(child, childIndex))
  };
  if (kind === "text") result.text = {
    value: node.text || "",
    family: node.fontFamily || "Inter",
    weight: /black/i.test(node.fontStyle) ? 900 : /bold/i.test(node.fontStyle) ? 700 : /light/i.test(node.fontStyle) ? 300 : 400,
    style: /italic/i.test(node.fontStyle) ? "Italic" : "Normal",
    size: node.fontSize || 16,
    lineHeight: node.lineHeight || null,
    letterSpacing: node.letterSpacing || 0,
    align: node.align === "center" ? "center" : node.align === "right" ? "right" : "left",
    color: rgba(node.color || [0, 0, 0], node.opacity ?? 1)!,
    singleLine: Boolean(node.hug)
  };
  if (kind === "image") result.image = { assetKey: node.imageKey, fit: node.fitMode === "fit" ? "fit" : node.fitMode === "tile" ? "tile" : "crop" };
  if (kind === "vector") result.vector = { svg: node.svg || "<svg/>" };
  return result;
}

export function convertLegacyPackage(input: any): DomMigratePackageV3 {
  const route = detectPackageRoute(input);
  if (route === "unknown" || route === "v3") throw new Error(`Cannot convert package route ${route}`);
  const pages = input.pages.map((page: any, pageIndex: number) => {
    const children = route === "ui-v2" ? (page.tree?.children || []).map((node: any, index: number) => legacyNode(node, index)) : page.nodes.map((node: any, index: number) => legacyNode({ ...node, absolute: { x: node.x, y: node.y } }, index));
    const root: IrNode = {
      id: `legacy-page-${pageIndex}`, name: page.name || `Legacy Page ${pageIndex + 1}`, kind: "frame",
      geometry: { x: 0, y: 0, width: page.width, height: page.height }, visibleBounds: { x: 0, y: 0, width: page.width, height: page.height },
      layout: { mode: "none", gap: 0, padding: [0, 0, 0, 0], justify: "start", align: "start", wrap: false },
      sizing: { horizontal: "fixed", vertical: "fixed", grow: 0 },
      style: { fills: page.bgColor ? [{ type: "solid", color: rgba(page.bgColor)! }] : [], opacity: 1, clipsContent: true },
      children
    };
    return { id: `legacy-${pageIndex}`, name: page.name || `Legacy ${pageIndex + 1}`, viewport: { width: page.width, height: page.height }, root };
  });
  const fonts = new Map<string, { family: string; weight: number; style: string; nodes: string[] }>();
  const visit = (node: IrNode) => {
    if (node.text) {
      const key = `${node.text.family}|${node.text.weight}|${node.text.style}`;
      const item = fonts.get(key) || { family: node.text.family, weight: node.text.weight, style: node.text.style, nodes: [] };
      item.nodes.push(node.id); fonts.set(key, item);
    }
    node.children.forEach(visit);
  };
  pages.forEach((page: any) => visit(page.root));
  return {
    schemaVersion: 3,
    generator: { name: "DOM Migrate legacy adapter", version: "3.0.0" },
    capturedAt: new Date().toISOString(),
    pages,
    images: input.images || {},
    compatibility: {
      warnings: [{ code: route === "ui-v2" ? "UI_V2_DEPRECATED" : "FLAT_LEGACY_ROUTE", message: route === "ui-v2" ? "UI v2 package imported through the deprecated compatibility adapter" : "Flat/poster package imported through the visual legacy route" }],
      errors: [],
      fonts: Array.from(fonts.values()),
      rasterLayers: []
    }
  };
}
