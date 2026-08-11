import { inferAxisSizing, inferVisibility, intersectRect } from "./inference";
import type { AxisSizing, CompatibilityItem, IrColor, IrLayout, IrNode, Rect } from "../shared/schema";

type BrowserCaptureOptions = {
  pageName?: string;
  rootSelector?: string;
  strict?: boolean;
};

type BrowserCaptureResult = {
  page: { id: string; name: string; viewport: { width: number; height: number }; golden?: string; root: IrNode };
  variables: { colors: Record<string, IrColor>; spacing: Record<string, number>; radius: Record<string, number> };
  compatibility: { warnings: CompatibilityItem[]; errors: CompatibilityItem[]; fonts: Array<{ family: string; weight: number; style: string; nodes: string[] }>; rasterLayers: Array<{ nodeId: string; reason: string; assetKey: string }> };
};

type Declarations = Record<string, string>;

const round = (value: number) => Math.round(value * 1000) / 1000;
const number = (value: string, fallback = 0) => Number.isFinite(Number.parseFloat(value)) ? Number.parseFloat(value) : fallback;

function rectOf(rect: DOMRect | ClientRect): Rect {
  return { x: round(rect.left), y: round(rect.top), width: round(rect.width), height: round(rect.height) };
}

function parseColor(value: string): IrColor {
  const match = value.match(/rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
  if (!match) return { r: 0, g: 0, b: 0, a: 0 };
  return { r: number(match[1]) / 255, g: number(match[2]) / 255, b: number(match[3]) / 255, a: match[4] === undefined ? 1 : number(match[4], 1) };
}

function textStyleName(el: Element): string | undefined {
  return el.getAttribute("data-figma-text-style") || undefined;
}

function resolveFontFamily(fontFamily: string): string {
  const candidates = fontFamily.split(",").map((value) => value.trim().replace(/["']/g, "")).filter((value) => value && !/^(sans-serif|serif|monospace|system-ui)$/i.test(value));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return candidates[0] || "Inter";
  const sample = "mmmmmmmmmmWWWW汉字设计0123456789";
  context.font = '32px "__DOM_MIGRATE_MISSING_FONT__"';
  const baseline = context.measureText(sample).width;
  for (const candidate of candidates) {
    context.font = `32px "${candidate}", "__DOM_MIGRATE_MISSING_FONT__"`;
    if (Math.abs(context.measureText(sample).width - baseline) > 0.1) return candidate;
  }
  return candidates[candidates.length - 1] || "Inter";
}

function semanticName(el: Element, fallback?: string): string {
  const explicit = el.getAttribute("data-figma-name");
  if (explicit) return explicit;
  if (el.id) return el.id.replace(/^s-/, "Screen / ").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const className = Array.from(el.classList)[0];
  if (className) return className.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return fallback || el.tagName.toLowerCase();
}

function cssPath(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.documentElement) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part += `#${current.id}`;
      parts.unshift(part);
      break;
    }
    const classes = Array.from(current.classList).slice(0, 2);
    if (classes.length) part += `.${classes.join(".")}`;
    const parentElement: Element | null = current.parentElement;
    if (parentElement) {
      const siblings = Array.from(parentElement.children).filter((child: Element) => child.tagName === current!.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    }
    parts.unshift(part);
    current = parentElement;
  }
  return parts.join(" > ");
}

function stableId(el: Element, prefix = "node"): string {
  const existing = el.getAttribute("data-dom-migrate-id");
  if (existing) return existing;
  let hash = 2166136261;
  const input = `${location.pathname}|${cssPath(el)}`;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const value = `${prefix}-${(hash >>> 0).toString(36)}`;
  el.setAttribute("data-dom-migrate-id", value);
  return value;
}

function collectAuthoredDeclarations(el: Element): Declarations {
  const result: Declarations = {};
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        try {
          if (!el.matches(rule.selectorText)) continue;
        } catch {
          continue;
        }
        for (const property of Array.from(rule.style)) result[property] = rule.style.getPropertyValue(property).trim();
      } else if (rule instanceof CSSMediaRule) {
        if (matchMedia(rule.conditionText).matches) visit(rule.cssRules);
      } else if ("cssRules" in rule) {
        try { visit((rule as CSSGroupingRule).cssRules); } catch { /* cross-origin or unsupported grouping */ }
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try { visit(sheet.cssRules); } catch { /* cross-origin stylesheet: computed style remains authoritative */ }
  }
  for (const property of Array.from((el as HTMLElement).style || [])) result[property] = (el as HTMLElement).style.getPropertyValue(property).trim();
  return result;
}

function clipFor(el: Element, viewport: Rect): Rect {
  let clip = viewport;
  let current = el.parentElement;
  while (current && current !== document.documentElement) {
    const cs = getComputedStyle(current);
    if ([cs.overflow, cs.overflowX, cs.overflowY].some((value) => value === "hidden" || value === "clip" || value === "scroll" || value === "auto")) {
      clip = intersectRect(clip, rectOf(current.getBoundingClientRect()));
    }
    current = current.parentElement;
  }
  return clip;
}

function padding(cs: CSSStyleDeclaration): [number, number, number, number] {
  return [number(cs.paddingTop), number(cs.paddingRight), number(cs.paddingBottom), number(cs.paddingLeft)];
}

function margins(cs: CSSStyleDeclaration): [number, number, number, number] {
  return [number(cs.marginTop), number(cs.marginRight), number(cs.marginBottom), number(cs.marginLeft)];
}

function axisAnnotation(el: Element, axis: "width" | "height"): AxisSizing | undefined {
  const value = el.getAttribute(`data-figma-${axis}`);
  return value === "fixed" || value === "hug" || value === "fill" ? value : undefined;
}

function justify(value: string): IrLayout["justify"] {
  if (value === "center") return "center";
  if (value === "flex-end" || value === "end") return "end";
  if (value === "space-between") return "space-between";
  return "start";
}

function align(value: string): IrLayout["align"] {
  if (value === "center") return "center";
  if (value === "flex-end" || value === "end") return "end";
  if (value === "stretch") return "stretch";
  if (value === "baseline") return "baseline";
  return "start";
}

function parseGridTrackList(value: string): Array<{ kind: "fixed" | "fraction" | "auto"; value?: number }> {
  if (!value || value === "none") return [];
  const tokens = value.match(/minmax\([^)]*\)|repeat\([^)]*\)|[^\s]+/g) || [];
  return tokens.map((token) => {
    if (token.endsWith("fr")) return { kind: "fraction" as const, value: number(token, 1) };
    if (token === "auto" || /minmax|max-content|min-content/.test(token)) return { kind: "auto" as const };
    return { kind: "fixed" as const, value: Math.max(number(token, 1), 0.1) };
  });
}

function hasSingleInlineFlowLine(el: Element, children: IrNode[]): boolean {
  if (children.length < 2) return false;
  const meaningful = Array.from(el.childNodes).filter((child) => child.nodeType === Node.TEXT_NODE ? Boolean(child.textContent?.trim()) : child.nodeType === Node.ELEMENT_NODE);
  if (meaningful.length < 2) return false;
  const everyChildIsInline = meaningful.every((child) => child.nodeType === Node.TEXT_NODE || getComputedStyle(child as Element).display.startsWith("inline"));
  if (!everyChildIsInline) return false;
  const firstY = children[0].geometry.y;
  // Browser inline flow is only safely modelled as one horizontal Auto Layout
  // line when every captured item shares the same baseline band. Multi-line
  // prose remains a normal block/vertical container.
  return children.every((child) => Math.abs(child.geometry.y - firstY) <= 2);
}

function layoutFor(el: Element, cs: CSSStyleDeclaration, children: IrNode[]): IrLayout {
  let mode: IrLayout["mode"] = "none";
  if (cs.display === "flex" || cs.display === "inline-flex") mode = cs.flexDirection.startsWith("row") ? "horizontal" : "vertical";
  else if (cs.display === "grid" || cs.display === "inline-grid") mode = "grid";
  else if (hasSingleInlineFlowLine(el, children)) mode = "horizontal";
  else if (children.length > 0 && cs.display !== "inline") mode = "vertical";
  const value: IrLayout = {
    mode,
    gap: number(mode === "horizontal" ? cs.columnGap : cs.rowGap),
    rowGap: number(cs.rowGap),
    columnGap: number(cs.columnGap),
    padding: padding(cs),
    justify: justify(cs.justifyContent),
    align: align(cs.alignItems),
    wrap: cs.flexWrap !== "nowrap"
  };
  if (mode === "grid") value.grid = { columns: parseGridTrackList(cs.gridTemplateColumns), rows: parseGridTrackList(cs.gridTemplateRows) };
  return value;
}

function hasVisibleFill(cs: CSSStyleDeclaration): boolean {
  const color = parseColor(cs.backgroundColor);
  return color.a > 0 || Boolean(cs.backgroundImage && cs.backgroundImage !== "none");
}

function nodeStyle(cs: CSSStyleDeclaration): IrNode["style"] {
  const fill = parseColor(cs.backgroundColor);
  const borderWidths: [number, number, number, number] = [number(cs.borderTopWidth), number(cs.borderRightWidth), number(cs.borderBottomWidth), number(cs.borderLeftWidth)];
  const style: IrNode["style"] = {
    fills: fill.a > 0 ? [{ type: "solid", color: fill }] : [],
    opacity: number(cs.opacity, 1),
    radius: [number(cs.borderTopLeftRadius), number(cs.borderTopRightRadius), number(cs.borderBottomRightRadius), number(cs.borderBottomLeftRadius)],
    clipsContent: [cs.overflow, cs.overflowX, cs.overflowY].some((value) => value === "hidden" || value === "clip")
  };
  if (borderWidths.some((width) => width > 0)) style.border = { color: parseColor(cs.borderTopColor), widths: borderWidths };
  const shadow = cs.boxShadow.match(/rgba?\([^)]+\)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+(-?[\d.]+)px)?/);
  if (shadow) style.shadow = { x: number(shadow[1]), y: number(shadow[2]), blur: number(shadow[3]), spread: number(shadow[4]), color: parseColor(shadow[0].match(/rgba?\([^)]+\)/)![0]) };
  return style;
}

function textNode(parent: Element, text: Text, index: number, viewport: Rect): IrNode | null {
  if (!text.data.trim()) return null;
  const range = document.createRange();
  range.selectNodeContents(text);
  const rect = rectOf(range.getBoundingClientRect());
  const cs = getComputedStyle(parent);
  const clip = clipFor(parent, viewport);
  if (!inferVisibility({ display: cs.display, visibility: cs.visibility, opacity: cs.opacity }, rect, clip)) return null;
  const parentId = stableId(parent);
  const value = text.data.replace(/\s+/g, " ").trim();
  const lineHeight = cs.lineHeight === "normal" ? null : number(cs.lineHeight);
  const singleLine = rect.height <= (lineHeight || number(cs.fontSize) * 1.25) * 1.25 && !value.includes("\n");
  return {
    id: `${parentId}::text-${index}`,
    name: `${semanticName(parent)} / Label`,
    kind: "text",
    geometry: rect,
    visibleBounds: intersectRect(rect, clip),
    layout: { mode: "none", gap: 0, padding: [0, 0, 0, 0], justify: "start", align: "start", wrap: false },
    sizing: { horizontal: singleLine ? "hug" : "fill", vertical: "hug", grow: 0 },
    style: { fills: [], opacity: number(cs.opacity, 1) },
    text: {
      value,
      family: resolveFontFamily(cs.fontFamily),
      weight: Number.parseInt(cs.fontWeight, 10) || 400,
      style: cs.fontStyle === "italic" ? "Italic" : "Normal",
      size: number(cs.fontSize, 16),
      lineHeight,
      letterSpacing: cs.letterSpacing === "normal" ? 0 : number(cs.letterSpacing),
      align: cs.textAlign === "center" ? "center" : cs.textAlign === "right" || cs.textAlign === "end" ? "right" : cs.textAlign === "justify" ? "justified" : "left",
      color: parseColor(cs.color),
      singleLine,
      styleName: textStyleName(parent),
      property: parent.getAttribute("data-figma-property")?.endsWith(":text") ? { name: parent.getAttribute("data-figma-property")!.slice(0, -5), type: "text" } : undefined
    },
    source: { tag: "#text", selector: cssPath(parent) },
    children: []
  };
}

function leafTextElement(el: Element): boolean {
  return Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) && !Array.from(el.children).length;
}

function captureElement(el: Element, viewport: Rect, warnings: CompatibilityItem[], rasterLayers: BrowserCaptureResult["compatibility"]["rasterLayers"]): IrNode | null {
  if (el.hasAttribute("data-figma-ignore")) return null;
  const cs = getComputedStyle(el);
  const rect = rectOf(el.getBoundingClientRect());
  const clip = clipFor(el, viewport);
  if (!inferVisibility({ display: cs.display, visibility: cs.visibility, opacity: cs.opacity }, rect, clip)) return null;
  const id = stableId(el);
  const declarations = collectAuthoredDeclarations(el);
  const explicitRaster = el.hasAttribute("data-figma-rasterize");
  const isImage = el instanceof HTMLImageElement;
  const isBackgroundImage = !el.children.length && !el.textContent?.trim() && /^url\(/.test(cs.backgroundImage);
  const isSvg = el instanceof SVGElement && el.tagName.toLowerCase() === "svg";
  const directText = leafTextElement(el);
  const decoratedText = directText && (hasVisibleFill(cs) || number(cs.borderTopWidth) > 0 || padding(cs).some((value) => value > 0));
  let kind: IrNode["kind"] = explicitRaster ? "raster" : isImage || isBackgroundImage ? "image" : isSvg ? "vector" : directText && !decoratedText ? "text" : "frame";
  if (!el.children.length && kind === "frame" && !directText && hasVisibleFill(cs)) kind = "shape";
  const authoredWidth = declarations.width;
  const authoredHeight = declarations.height;
  const children: IrNode[] = [];
  const childElements = Array.from(el.children);
  if (kind === "frame") {
    for (const child of childElements) {
      const captured = captureElement(child, viewport, warnings, rasterLayers);
      if (captured) children.push(captured);
    }
    let textIndex = 0;
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const captured = textNode(el, child as Text, textIndex++, viewport);
      if (captured) children.push(captured);
    }
    children.sort((a, b) => a.geometry.y - b.geometry.y || a.geometry.x - b.geometry.x);
  }
  const position = cs.position === "absolute" || cs.position === "fixed" ? "absolute" : "flow";
  const parentRect = el.parentElement ? rectOf(el.parentElement.getBoundingClientRect()) : viewport;
  const marginValues = margins(cs);
  const autoMargin = {
    top: declarations["margin-top"] === "auto",
    right: declarations["margin-right"] === "auto",
    bottom: declarations["margin-bottom"] === "auto",
    left: declarations["margin-left"] === "auto"
  };
  if (autoMargin.top) marginValues[0] = 0;
  if (autoMargin.right) marginValues[1] = 0;
  if (autoMargin.bottom) marginValues[2] = 0;
  if (autoMargin.left) marginValues[3] = 0;
  const bindings = {
    fill: variableNameFromDeclaration(declarations["background-color"] || declarations.background),
    text: variableNameFromDeclaration(declarations.color),
    stroke: variableNameFromDeclaration(declarations["border-color"] || declarations["border-top-color"]),
    gap: variableNameFromDeclaration(declarations.gap || declarations["row-gap"] || declarations["column-gap"]),
    radius: variableNameFromDeclaration(declarations["border-radius"])
  };
  const node: IrNode = {
    id,
    name: semanticName(el),
    kind,
    geometry: rect,
    visibleBounds: intersectRect(rect, clip),
    layout: layoutFor(el, cs, children),
    sizing: {
      horizontal: inferAxisSizing({ display: cs.display, flexGrow: cs.flexGrow, width: cs.width, position: cs.position }, "horizontal", authoredWidth, axisAnnotation(el, "width")),
      vertical: inferAxisSizing({ display: cs.display, flexGrow: cs.flexGrow, height: cs.height, position: cs.position }, "vertical", authoredHeight, axisAnnotation(el, "height")),
      grow: number(cs.flexGrow),
      minWidth: declarations["min-width"] && declarations["min-width"] !== "auto" ? number(cs.minWidth) : undefined,
      maxWidth: declarations["max-width"] && declarations["max-width"] !== "none" ? number(cs.maxWidth) : undefined,
      minHeight: declarations["min-height"] && declarations["min-height"] !== "auto" ? number(cs.minHeight) : undefined,
      maxHeight: declarations["max-height"] && declarations["max-height"] !== "none" ? number(cs.maxHeight) : undefined
    },
    position,
    absolute: position === "absolute" ? { x: round(rect.x - parentRect.x), y: round(rect.y - parentRect.y) } : undefined,
    autoMargin,
    margins: marginValues,
    alignSelf: cs.alignSelf === "center" || (autoMargin.left && autoMargin.right) ? "center" : cs.alignSelf === "flex-end" ? "end" : cs.alignSelf === "stretch" ? "stretch" : "auto",
    style: nodeStyle(cs),
    component: el.hasAttribute("data-figma-component") ? { name: el.getAttribute("data-figma-component")!, explicit: true } : undefined,
    variableBindings: Object.fromEntries(Object.entries(bindings).filter((entry): entry is [string, string] => Boolean(entry[1]))),
    source: { tag: el.tagName.toLowerCase(), selector: cssPath(el), htmlId: el.id || undefined },
    children
  };
  if (kind === "text") {
    const capturedText = textNode(el, el.firstChild as Text, 0, viewport);
    node.text = capturedText?.text;
    if (capturedText) node.sizing = capturedText.sizing;
  }
  if (kind === "image") node.image = { assetKey: `pending:${id}`, fit: cs.objectFit === "contain" ? "fit" : cs.objectFit === "cover" || isBackgroundImage ? "crop" : "fill", alt: isImage ? (el as HTMLImageElement).alt || undefined : el.getAttribute("aria-label") || undefined };
  if (kind === "vector") node.vector = { svg: (el as SVGElement).outerHTML };
  if (kind === "raster") {
    node.raster = { assetKey: `pending:${id}`, reason: el.getAttribute("data-figma-rasterize") || "Explicit data-figma-rasterize" };
    rasterLayers.push({ nodeId: id, reason: node.raster.reason, assetKey: node.raster.assetKey });
  }
  const pseudoBefore = getComputedStyle(el, "::before");
  const pseudoAfter = getComputedStyle(el, "::after");
  const hasPseudo = [pseudoBefore, pseudoAfter].some((pseudo) => pseudo.content !== "none" && pseudo.content !== "normal" && pseudo.display !== "none");
  const complexBackground = cs.backgroundImage !== "none" && !/^url\(/.test(cs.backgroundImage);
  const complexFilter = cs.filter !== "none" || cs.backdropFilter !== "none" || cs.mixBlendMode !== "normal";
  if (!explicitRaster && (hasPseudo || complexBackground || complexFilter)) {
    const reasons = [hasPseudo && "pseudo-element", complexBackground && "gradient", complexFilter && "filter/blend"].filter(Boolean).join(", ");
    warnings.push({ code: "RASTER_EFFECT_REQUIRED", nodeId: id, message: `${semanticName(el)} needs a minimal raster effect overlay`, detail: reasons });
  }
  return node;
}

function collectVariables(root: Element): BrowserCaptureResult["variables"] {
  const colors: Record<string, IrColor> = {};
  const spacing: Record<string, number> = {};
  const radius: Record<string, number> = {};
  const cs = getComputedStyle(root);
  const names = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (!(rule instanceof CSSStyleRule) || rule.selectorText !== ":root") continue;
        for (const property of Array.from(rule.style)) if (property.startsWith("--")) names.add(property);
      }
    } catch { /* cross-origin */ }
  }
  for (const cssName of names) {
    const value = cs.getPropertyValue(cssName).trim();
    const name = cssName.slice(2).replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    if (/^#|^rgb/.test(value)) colors[name] = parseColor(getComputedStyleColor(value));
    else if (/^-?[\d.]+px$/.test(value)) {
      const numeric = number(value);
      if (/radius|round/i.test(cssName)) radius[name] = numeric;
      else spacing[name] = numeric;
    }
  }
  return { colors, spacing, radius };
}

function getComputedStyleColor(value: string): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const result = getComputedStyle(probe).color;
  probe.remove();
  return result;
}

function variableNameFromDeclaration(value?: string): string | undefined {
  const match = value?.match(/var\(\s*(--[\w-]+)/);
  if (!match) return undefined;
  return match[1].slice(2).replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function collectFonts(root: IrNode): BrowserCaptureResult["compatibility"]["fonts"] {
  const map = new Map<string, { family: string; weight: number; style: string; nodes: string[] }>();
  const visit = (node: IrNode) => {
    if (node.text) {
      const key = `${node.text.family}|${node.text.weight}|${node.text.style}`;
      const entry = map.get(key) || { family: node.text.family, weight: node.text.weight, style: node.text.style, nodes: [] };
      entry.nodes.push(node.id);
      map.set(key, entry);
    }
    node.children.forEach(visit);
  };
  visit(root);
  return Array.from(map.values()).sort((a, b) => `${a.family}${a.weight}`.localeCompare(`${b.family}${b.weight}`));
}

function normalizeSizing(root: IrNode, warnings: CompatibilityItem[]): void {
  const visit = (node: IrNode) => {
    for (const child of node.children) visit(child);
    const checks: Array<["horizontal" | "vertical", boolean]> = [
      ["horizontal", node.layout.mode === "horizontal" || node.layout.align === "stretch"],
      ["vertical", node.layout.mode === "vertical"]
    ];
    for (const [axis, participates] of checks) {
      if (!participates || node.sizing[axis] !== "hug") continue;
      const conflict = node.children.find((child) => child.position !== "absolute" && (child.sizing[axis] === "fill" || child.sizing.grow > 0));
      if (!conflict) continue;
      node.sizing[axis] = "fixed";
      warnings.push({
        code: "HUG_PROMOTED_TO_FIXED",
        nodeId: node.id,
        message: `${node.name} was promoted to fixed ${axis} to keep ${conflict.name} fill/grow legal in Figma`
      });
    }
  };
  visit(root);
}

function normalizeMargins(root: IrNode, warnings: CompatibilityItem[]): void {
  const visit = (node: IrNode) => {
    const flow = node.children.filter((child) => child.position !== "absolute");
    if (node.layout.mode === "vertical" && flow[0]?.margins && flow[0].margins[0] < 0) {
      const offset = flow[0].margins[0];
      node.layout.padding[0] = Math.max(0, node.layout.padding[0] + offset);
      flow[0].margins[0] = 0;
      warnings.push({ code: "LEADING_NEGATIVE_MARGIN_NORMALIZED", nodeId: flow[0].id, message: `${flow[0].name} leading negative margin was folded into ${node.name} padding` });
    }
    for (const child of node.children) {
      if (child.margins?.some((value) => value < 0)) {
        warnings.push({ code: "NEGATIVE_MARGIN_REQUIRES_REVIEW", nodeId: child.id, message: `${child.name} has a remaining negative margin that Figma cannot express natively` });
      }
      visit(child);
    }
  };
  visit(root);
}

function makeSiblingNamesUnique(root: IrNode): void {
  const visit = (node: IrNode) => {
    const counts = new Map<string, number>();
    for (const child of node.children) {
      const count = (counts.get(child.name) || 0) + 1;
      counts.set(child.name, count);
      if (count > 1) child.name = `${child.name} ${count}`;
      visit(child);
    }
  };
  visit(root);
}

export async function captureCurrentPage(options: BrowserCaptureOptions = {}): Promise<BrowserCaptureResult> {
  await document.fonts.ready;
  const viewport: Rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
  const rootElement = options.rootSelector
    ? document.querySelector(options.rootSelector)
    : document.querySelector("[data-figma-root]") || document.querySelector(".phone") || document.querySelector("main") || document.body;
  if (!rootElement) throw new Error("DOM Migrate v3 could not find a capture root");
  const warnings: CompatibilityItem[] = [];
  const errors: CompatibilityItem[] = [];
  const rasterLayers: BrowserCaptureResult["compatibility"]["rasterLayers"] = [];
  const root = captureElement(rootElement, viewport, warnings, rasterLayers);
  if (!root) throw new Error("DOM Migrate v3 capture root is invisible or fully clipped");
  root.name = rootElement.getAttribute("data-figma-name") || "Screen";
  root.geometry = { x: 0, y: 0, width: viewport.width, height: viewport.height };
  root.visibleBounds = { ...root.geometry };
  root.sizing = { horizontal: "fixed", vertical: "fixed", grow: 0 };
  root.position = "flow";
  root.absolute = undefined;
  normalizeSizing(root, warnings);
  normalizeMargins(root, warnings);
  makeSiblingNamesUnique(root);
  const pageName = options.pageName || new URLSearchParams(location.search).get("state") || document.title || "Screen";
  return {
    page: { id: `page-${pageName.replace(/\W+/g, "-").toLowerCase()}`, name: pageName, viewport: { width: viewport.width, height: viewport.height }, root },
    variables: collectVariables(document.documentElement),
    compatibility: { warnings, errors, fonts: collectFonts(root), rasterLayers }
  };
}

declare global {
  interface Window {
    DOMMigrateV3?: { capture: typeof captureCurrentPage };
  }
}

if (typeof window !== "undefined") window.DOMMigrateV3 = { capture: captureCurrentPage };
