import { DomMigratePackageV3Schema, type DomMigratePackageV3, type IrColor, type IrNode } from "../shared/schema";
import { validateIr } from "../shared/invariants";
import { planFigmaNode, type PlannedNode } from "../planner/plan";
import { fontRequirementKey, resolveFontRequirements } from "./fonts";
import { convertLegacyPackage, detectPackageRoute, type PackageRoute } from "./legacy";

type FontMap = Map<string, FontName>;
type VariableMap = Map<string, Variable>;
type TextStyleMap = Map<string, TextStyle>;
type BuildContext = {
  images: Map<string, string>;
  fonts: FontMap;
  variables: VariableMap;
  textStyles: TextStyleMap;
  componentCounts: Map<string, number>;
  components: Map<string, ComponentNode>;
  componentShelf: FrameNode;
  geometry: Array<{ page: string; id: string; name: string; type: string; x: number; y: number; width: number; height: number }>;
  pageName: string;
};

type Preflight = {
  route: PackageRoute;
  schemaVersion: number | null;
  pages: number;
  nodes: number;
  components: number;
  variables: number;
  textStyles: number;
  rasterLayers: number;
  warnings: Array<{ code: string; message: string }>;
  errors: Array<{ code: string; message: string }>;
};

figma.showUI(__html__, { width: 520, height: 640, themeColors: true });

function color(value: IrColor): RGB {
  return { r: value.r, g: value.g, b: value.b };
}

function solid(value: IrColor): SolidPaint {
  return { type: "SOLID", color: color(value), opacity: value.a };
}

function bytes(base64: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let index = 0; index < alphabet.length; index++) lookup[alphabet.charCodeAt(index)] = index;
  const length = Math.floor(base64.length * 3 / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  const output = new Uint8Array(length);
  let cursor = 0;
  for (let index = 0; index < base64.length; index += 4) {
    const value = (lookup[base64.charCodeAt(index)] << 18) | (lookup[base64.charCodeAt(index + 1)] << 12) | (lookup[base64.charCodeAt(index + 2)] << 6) | lookup[base64.charCodeAt(index + 3)];
    if (cursor < length) output[cursor++] = (value >> 16) & 255;
    if (cursor < length) output[cursor++] = (value >> 8) & 255;
    if (cursor < length) output[cursor++] = value & 255;
  }
  return output;
}

function countNodes(node: IrNode): number {
  return 1 + node.children.reduce((total, child) => total + countNodes(child), 0);
}

function textSignature(node: IrNode): string | null {
  if (!node.text) return null;
  return [node.text.family, node.text.weight, node.text.style, node.text.size, node.text.lineHeight ?? "auto", node.text.letterSpacing, node.text.align].join("|");
}

function componentSignature(node: PlannedNode): string | null {
  if (node.synthetic || node.kind !== "frame" || node.name === "Screen" || node.children.length === 0) return null;
  if (node.component) return `explicit:${node.component.name}`;
  const strip = (value: PlannedNode): unknown => ({
    name: value.name,
    kind: value.kind,
    layout: value.layout,
    sizing: value.sizing,
    style: value.style,
    text: value.text,
    image: value.image?.fit,
    vector: value.vector?.svg,
    children: value.children.map(strip)
  });
  return `auto:${JSON.stringify(strip(node))}`;
}

function collectComponentCounts(pages: DomMigratePackageV3["pages"]): Map<string, number> {
  const counts = new Map<string, number>();
  const visit = (node: PlannedNode) => {
    const signature = componentSignature(node);
    if (signature) counts.set(signature, (counts.get(signature) || 0) + 1);
    node.children.forEach(visit);
  };
  for (const page of pages) visit(planFigmaNode(page.root, { parentLayout: "none", parentFixed: { horizontal: true, vertical: true } }));
  return counts;
}

async function preflightPackage(input: unknown): Promise<{ report: Preflight; pkg?: DomMigratePackageV3; fontMap?: FontMap }> {
  const route = detectPackageRoute(input);
  if (route === "unknown") return { report: { route, schemaVersion: null, pages: 0, nodes: 0, components: 0, variables: 0, textStyles: 0, rasterLayers: 0, warnings: [], errors: [{ code: "PACKAGE_UNSUPPORTED", message: "The selected JSON is not a supported DOM Migrate package." }] } };
  let pkg: DomMigratePackageV3;
  try {
    pkg = route === "v3" ? DomMigratePackageV3Schema.parse(input) : convertLegacyPackage(input);
  } catch (error) {
    return { report: { route, schemaVersion: route === "v3" ? 3 : null, pages: 0, nodes: 0, components: 0, variables: 0, textStyles: 0, rasterLayers: 0, warnings: [], errors: [{ code: "PACKAGE_INVALID", message: error instanceof Error ? error.message : String(error) }] } };
  }
  const validation = validateIr(pkg);
  const available = await figma.listAvailableFontsAsync();
  const fontResolution = resolveFontRequirements(pkg.compatibility.fonts, available);
  if (route !== "v3" && fontResolution.errors.length) {
    const fallback = available.find((item) => item.fontName.family === "Inter" && item.fontName.style === "Regular")?.fontName || available[0]?.fontName;
    if (fallback) for (const requirement of pkg.compatibility.fonts) if (!fontResolution.map.has(fontRequirementKey(requirement.family, requirement.weight, requirement.style))) fontResolution.map.set(fontRequirementKey(requirement.family, requirement.weight, requirement.style), fallback);
  }
  const componentCounts = collectComponentCounts(pkg.pages);
  const report: Preflight = {
    route,
    schemaVersion: pkg.schemaVersion,
    pages: pkg.pages.length,
    nodes: pkg.pages.reduce((total, page) => total + countNodes(page.root), 0),
    components: Array.from(componentCounts.values()).filter((count) => count > 1).length,
    variables: Object.values(pkg.variables || {}).reduce((total, group) => total + Object.keys(group).length, 0),
    textStyles: Object.keys(pkg.textStyles || {}).length,
    rasterLayers: pkg.compatibility.rasterLayers.length,
    warnings: [...pkg.compatibility.warnings, ...validation.warnings, ...(route === "v3" ? [] : [{ code: "DEPRECATED_ROUTE", message: route === "ui-v2" ? "UI v2 is supported for compatibility only; production structure is not guaranteed." : "Flat/poster mode remains a visual legacy route." }])].map(({ code, message }) => ({ code, message })),
    errors: [...pkg.compatibility.errors, ...validation.errors, ...(route === "v3" ? fontResolution.errors : [])].map(({ code, message }) => ({ code, message }))
  };
  return { report, pkg, fontMap: fontResolution.map };
}

function cssVariableName(name: string): string {
  return `--${name.trim().replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_/]+/g, "-").toLowerCase()}`;
}

async function ensureVariables(pkg: DomMigratePackageV3): Promise<VariableMap> {
  const result = new Map<string, Variable>();
  if (!pkg.variables) return result;
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariables = await figma.variables.getLocalVariablesAsync();
  const ensureCollection = (name: string) => collections.find((collection) => collection.name === name) || figma.variables.createVariableCollection(name);
  const createGroup = (groupName: "Color" | "Spacing" | "Radius", values: Record<string, IrColor | number>, type: VariableResolvedDataType, scopes: VariableScope[]) => {
    const collection = ensureCollection(`DOM Migrate v3 / ${groupName}`);
    const modeId = collection.defaultModeId;
    for (const [name, value] of Object.entries(values)) {
      const variableName = name.replace(/[._]+/g, "/");
      let variable = allVariables.find((item) => item.variableCollectionId === collection.id && item.name === variableName);
      if (!variable) variable = figma.variables.createVariable(variableName, collection, type);
      variable.scopes = scopes;
      variable.setVariableCodeSyntax("WEB", `var(${cssVariableName(name)})`);
      variable.setValueForMode(modeId, typeof value === "number" ? value : color(value));
      result.set(name, variable);
    }
  };
  createGroup("Color", pkg.variables.colors, "COLOR", ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"]);
  createGroup("Spacing", pkg.variables.spacing, "FLOAT", ["GAP", "WIDTH_HEIGHT"]);
  createGroup("Radius", pkg.variables.radius, "FLOAT", ["CORNER_RADIUS"]);
  return result;
}

async function ensureTextStyles(pkg: DomMigratePackageV3, fonts: FontMap): Promise<TextStyleMap> {
  const counts = new Map<string, { node: IrNode; count: number }>();
  const visit = (node: IrNode) => {
    const signature = textSignature(node);
    if (signature) counts.set(signature, { node, count: (counts.get(signature)?.count || 0) + 1 });
    node.children.forEach(visit);
  };
  pkg.pages.forEach((page) => visit(page.root));
  const existing = await figma.getLocalTextStylesAsync();
  const result = new Map<string, TextStyle>();
  for (const [signature, entry] of counts) {
    if (entry.count < 2 && !entry.node.text?.styleName) continue;
    const text = entry.node.text!;
    const name = text.styleName || `DOM Migrate v3 / ${text.family} ${text.weight} / ${text.size}-${text.lineHeight || "Auto"}`;
    let style = existing.find((item) => item.name === name);
    if (!style) style = figma.createTextStyle();
    style.name = name;
    const fontName = fonts.get(fontRequirementKey(text.family, text.weight, text.style));
    if (!fontName) continue;
    await figma.loadFontAsync(fontName);
    style.fontName = fontName;
    style.fontSize = text.size;
    style.lineHeight = text.lineHeight ? { unit: "PIXELS", value: text.lineHeight } : { unit: "AUTO" };
    style.letterSpacing = { unit: "PIXELS", value: text.letterSpacing };
    result.set(signature, style);
  }
  return result;
}

function applyPaintStyle(target: MinimalFillsMixin & MinimalStrokesMixin, node: PlannedNode, variables: VariableMap): void {
  if (node.style.fills.length) {
    let paint = solid(node.style.fills[0].color);
    const binding = node.variableBindings?.fill || node.variableBindings?.background;
    if (binding && variables.has(binding)) paint = figma.variables.setBoundVariableForPaint(paint, "color", variables.get(binding)!);
    target.fills = [paint];
  } else target.fills = [];
  if (node.style.border) {
    let paint = solid(node.style.border.color);
    const binding = node.variableBindings?.stroke;
    if (binding && variables.has(binding)) paint = figma.variables.setBoundVariableForPaint(paint, "color", variables.get(binding)!);
    target.strokes = [paint];
    const [top, right, bottom, left] = node.style.border.widths;
    if ("strokeTopWeight" in target) {
      const weighted = target as unknown as { strokeTopWeight: number; strokeRightWeight: number; strokeBottomWeight: number; strokeLeftWeight: number };
      weighted.strokeTopWeight = top; weighted.strokeRightWeight = right; weighted.strokeBottomWeight = bottom; weighted.strokeLeftWeight = left;
    }
  } else target.strokes = [];
}

function applyGeometryStyle(target: GeometryMixin & CornerMixin & { opacity: number; effects: readonly Effect[] }, node: PlannedNode): void {
  target.opacity = node.style.opacity;
  if (node.style.radius) {
    const corners = target as unknown as { topLeftRadius: number; topRightRadius: number; bottomRightRadius: number; bottomLeftRadius: number };
    corners.topLeftRadius = node.style.radius[0]; corners.topRightRadius = node.style.radius[1]; corners.bottomRightRadius = node.style.radius[2]; corners.bottomLeftRadius = node.style.radius[3];
  }
  if (node.style.shadow) {
    const shadow = node.style.shadow;
    target.effects = [{ type: "DROP_SHADOW", color: { ...color(shadow.color), a: shadow.color.a }, offset: { x: shadow.x, y: shadow.y }, radius: shadow.blur, spread: shadow.spread, visible: true, blendMode: "NORMAL" }];
  }
}

function layoutMode(mode: PlannedNode["layout"]["mode"]): BaseFrameMixin["layoutMode"] {
  return mode === "horizontal" ? "HORIZONTAL" : mode === "vertical" ? "VERTICAL" : mode === "grid" ? "GRID" : "NONE";
}

function setupContainer(frame: FrameNode | ComponentNode, node: PlannedNode): void {
  frame.name = node.name;
  frame.resize(Math.max(node.geometry.width, 0.1), Math.max(node.geometry.height, 0.1));
  frame.layoutMode = layoutMode(node.layout.mode);
  if (frame.layoutMode !== "NONE") {
    frame.paddingTop = node.layout.padding[0]; frame.paddingRight = node.layout.padding[1]; frame.paddingBottom = node.layout.padding[2]; frame.paddingLeft = node.layout.padding[3];
    frame.itemSpacing = node.layout.gap;
    frame.primaryAxisAlignItems = node.layout.justify === "center" ? "CENTER" : node.layout.justify === "end" ? "MAX" : node.layout.justify === "space-between" ? "SPACE_BETWEEN" : "MIN";
    frame.counterAxisAlignItems = node.layout.align === "center" ? "CENTER" : node.layout.align === "end" ? "MAX" : node.layout.align === "baseline" && frame.layoutMode === "HORIZONTAL" ? "BASELINE" : "MIN";
    frame.layoutWrap = node.layout.wrap ? "WRAP" : "NO_WRAP";
  }
  if (frame.layoutMode === "GRID") {
    frame.gridColumnCount = Math.max(node.layout.grid?.columns.length || 1, 1);
    frame.gridRowCount = Math.max(node.layout.grid?.rows?.length || 1, 1);
    frame.gridColumnGap = node.layout.columnGap || node.layout.gap;
    frame.gridRowGap = node.layout.rowGap || node.layout.gap;
    node.layout.grid?.columns.forEach((track, index) => {
      const target = frame.gridColumnSizes[index];
      target.type = track.kind === "fixed" ? "FIXED" : track.kind === "auto" ? "HUG" : "FLEX";
      if (track.value !== undefined) target.value = track.value;
    });
  }
  frame.clipsContent = Boolean(node.style.clipsContent);
}

function positionChild(child: SceneNode, node: PlannedNode, parentNode: PlannedNode, parent: FrameNode | ComponentNode): void {
  if (node.position === "absolute") {
    if (parent.layoutMode !== "NONE") (child as SceneNode & { layoutPositioning: "ABSOLUTE" | "AUTO" }).layoutPositioning = "ABSOLUTE";
    child.x = node.absolute?.x ?? node.geometry.x - parentNode.geometry.x;
    child.y = node.absolute?.y ?? node.geometry.y - parentNode.geometry.y;
    return;
  }
  if (parent.layoutMode === "NONE") {
    child.x = node.geometry.x - parentNode.geometry.x;
    child.y = node.geometry.y - parentNode.geometry.y;
  }
}

function applySizing(child: SceneNode, node: PlannedNode, parent: FrameNode | ComponentNode): void {
  if (!("layoutSizingHorizontal" in child) || parent.layoutMode === "NONE" || node.position === "absolute") return;
  child.layoutSizingHorizontal = node.layoutSizingHorizontal;
  child.layoutSizingVertical = node.layoutSizingVertical;
  if (node.sizing.grow > 0) child.layoutGrow = node.sizing.grow;
  if (node.sizing.minWidth !== undefined) child.minWidth = node.sizing.minWidth;
  if (node.sizing.maxWidth !== undefined) child.maxWidth = node.sizing.maxWidth;
  if (node.sizing.minHeight !== undefined) child.minHeight = node.sizing.minHeight;
  if (node.sizing.maxHeight !== undefined) child.maxHeight = node.sizing.maxHeight;
}

async function buildText(node: PlannedNode, parentNode: PlannedNode, parent: FrameNode | ComponentNode, context: BuildContext, componentContext?: { component: ComponentNode; properties: Map<string, string> }): Promise<TextNode> {
  const text = node.text!;
  const fontName = context.fonts.get(fontRequirementKey(text.family, text.weight, text.style));
  if (!fontName) throw new Error(`No preflight font mapping for ${text.family} ${text.weight} ${text.style}`);
  await figma.loadFontAsync(fontName);
  const target = figma.createText();
  parent.appendChild(target);
  target.name = node.name;
  target.fontName = fontName;
  target.characters = text.value;
  target.fontSize = text.size;
  target.lineHeight = text.lineHeight ? { unit: "PIXELS", value: text.lineHeight } : { unit: "AUTO" };
  target.letterSpacing = { unit: "PIXELS", value: text.letterSpacing };
  target.textAlignHorizontal = text.align === "center" ? "CENTER" : text.align === "right" ? "RIGHT" : text.align === "justified" ? "JUSTIFIED" : "LEFT";
  let paint = solid(text.color);
  const binding = node.variableBindings?.text;
  if (binding && context.variables.has(binding)) paint = figma.variables.setBoundVariableForPaint(paint, "color", context.variables.get(binding)!);
  target.fills = [paint];
  if (text.singleLine) target.textAutoResize = "WIDTH_AND_HEIGHT";
  else {
    target.textAutoResize = "HEIGHT";
    target.resize(Math.max(node.geometry.width, 1), Math.max(target.height, 1));
  }
  const style = context.textStyles.get(textSignature(node)!);
  if (style) await target.setTextStyleIdAsync(style.id);
  if (text.property && componentContext) {
    let propertyKey = componentContext.properties.get(text.property.name);
    if (!propertyKey) {
      propertyKey = componentContext.component.addComponentProperty(text.property.name, "TEXT", text.value);
      componentContext.properties.set(text.property.name, propertyKey);
    }
    target.componentPropertyReferences = { characters: propertyKey };
  }
  positionChild(target, node, parentNode, parent);
  applySizing(target, node, parent);
  return target;
}

async function buildLeaf(node: PlannedNode, parentNode: PlannedNode, parent: FrameNode | ComponentNode, context: BuildContext, componentContext?: { component: ComponentNode; properties: Map<string, string> }): Promise<SceneNode> {
  if (node.kind === "text") return buildText(node, parentNode, parent, context, componentContext);
  if (node.kind === "vector") {
    const target = figma.createNodeFromSvg(node.vector!.svg);
    parent.appendChild(target); target.name = node.name; target.resize(Math.max(node.geometry.width, 0.1), Math.max(node.geometry.height, 0.1));
    positionChild(target, node, parentNode, parent); applySizing(target, node, parent); return target;
  }
  const target = figma.createRectangle();
  parent.appendChild(target); target.name = node.name; target.resize(Math.max(node.geometry.width, 0.1), Math.max(node.geometry.height, 0.1));
  if (node.kind === "image" || node.kind === "raster") {
    const key = node.image?.assetKey || node.raster?.assetKey;
    if (!key || !context.images.has(key)) throw new Error(`Image asset ${key || "<missing>"} is unavailable for ${node.name}`);
    target.fills = [{ type: "IMAGE", imageHash: context.images.get(key)!, scaleMode: node.image?.fit === "fit" ? "FIT" : node.image?.fit === "tile" ? "TILE" : "FILL" }];
  } else applyPaintStyle(target, node, context.variables);
  applyGeometryStyle(target, node);
  positionChild(target, node, parentNode, parent); applySizing(target, node, parent); return target;
}

async function populateContainer(target: FrameNode | ComponentNode, node: PlannedNode, context: BuildContext, componentContext?: { component: ComponentNode; properties: Map<string, string> }): Promise<void> {
  setupContainer(target, node);
  const gapVariable = node.variableBindings?.gap && context.variables.get(node.variableBindings.gap);
  if (gapVariable && target.layoutMode !== "NONE") target.setBoundVariable("itemSpacing", gapVariable);
  const radiusVariable = node.variableBindings?.radius && context.variables.get(node.variableBindings.radius);
  if (radiusVariable) {
    target.setBoundVariable("topLeftRadius", radiusVariable);
    target.setBoundVariable("topRightRadius", radiusVariable);
    target.setBoundVariable("bottomRightRadius", radiusVariable);
    target.setBoundVariable("bottomLeftRadius", radiusVariable);
  }
  applyPaintStyle(target, node, context.variables);
  applyGeometryStyle(target, node);
  for (const child of node.children) await buildNode(child, node, target, context, componentContext);
  if (target.layoutMode !== "NONE") {
    target.layoutSizingHorizontal = node.layoutSizingHorizontal === "FILL" ? "FIXED" : node.layoutSizingHorizontal;
    target.layoutSizingVertical = node.layoutSizingVertical === "FILL" ? "FIXED" : node.layoutSizingVertical;
  }
}

async function buildComponentInstance(node: PlannedNode, parentNode: PlannedNode, parent: FrameNode | ComponentNode, context: BuildContext, signature: string): Promise<InstanceNode> {
  let component = context.components.get(signature);
  if (!component) {
    component = figma.createComponent();
    context.componentShelf.appendChild(component);
    component.name = node.component?.name || `Auto / ${node.name}`;
    const componentContext = { component, properties: new Map<string, string>() };
    await populateContainer(component, node, context, componentContext);
    component.description = node.component?.explicit ? `Imported from data-figma-component="${node.component.name}" by DOM Migrate v3.` : "Exact repeated semantic subtree generated by DOM Migrate v3.";
    context.components.set(signature, component);
  }
  const instance = component.createInstance();
  parent.appendChild(instance);
  instance.name = node.name;
  const textProperties = new Map<string, string>();
  const collect = (candidate: PlannedNode) => {
    if (candidate.text?.property) textProperties.set(candidate.text.property.name, candidate.text.value);
    candidate.children.forEach(collect);
  };
  collect(node);
  const propertyValues: Record<string, string> = {};
  for (const [name, value] of textProperties) {
    const key = Object.keys(component.componentPropertyDefinitions).find((candidate) => candidate === name || candidate.startsWith(`${name}#`));
    if (key) propertyValues[key] = value;
  }
  if (Object.keys(propertyValues).length) instance.setProperties(propertyValues);
  instance.resize(Math.max(node.geometry.width, 0.1), Math.max(node.geometry.height, 0.1));
  positionChild(instance, node, parentNode, parent);
  applySizing(instance, node, parent);
  return instance;
}

async function buildNode(node: PlannedNode, parentNode: PlannedNode, parent: FrameNode | ComponentNode, context: BuildContext, componentContext?: { component: ComponentNode; properties: Map<string, string> }): Promise<SceneNode> {
  const signature = componentSignature(node);
  if (signature && ((context.componentCounts.get(signature) || 0) > 1 || node.component?.explicit) && !componentContext) return buildComponentInstance(node, parentNode, parent, context, signature);
  if (node.kind !== "frame") return buildLeaf(node, parentNode, parent, context, componentContext);
  const target = figma.createFrame();
  parent.appendChild(target);
  await populateContainer(target, node, context, componentContext);
  positionChild(target, node, parentNode, parent);
  applySizing(target, node, parent);
  return target;
}

function collectGeometry(node: SceneNode, pageName: string, output: BuildContext["geometry"]): void {
  output.push({ page: pageName, id: node.id, name: node.name, type: node.type, x: Math.round(node.x * 1000) / 1000, y: Math.round(node.y * 1000) / 1000, width: Math.round(node.width * 1000) / 1000, height: Math.round(node.height * 1000) / 1000 });
  if ("children" in node) for (const child of node.children) collectGeometry(child, pageName, output);
}

async function buildPackage(pkg: DomMigratePackageV3, fonts: FontMap, pageName: string): Promise<{ frameIds: string[]; componentIds: string[]; geometry: BuildContext["geometry"] }> {
  let page = figma.root.children.find((candidate) => candidate.name === pageName);
  if (!page) { page = figma.createPage(); page.name = pageName; }
  await figma.setCurrentPageAsync(page);
  const imageMap = new Map<string, string>();
  for (const [key, base64] of Object.entries(pkg.images)) imageMap.set(key, figma.createImage(bytes(base64)).hash);
  const variables = await ensureVariables(pkg);
  const textStyles = await ensureTextStyles(pkg, fonts);
  const componentShelf = figma.createFrame();
  componentShelf.name = "DOM Migrate v3 / Components";
  componentShelf.layoutMode = "VERTICAL";
  componentShelf.primaryAxisSizingMode = "AUTO";
  componentShelf.counterAxisSizingMode = "FIXED";
  componentShelf.resize(480, 100);
  componentShelf.paddingTop = 32; componentShelf.paddingRight = 32; componentShelf.paddingBottom = 32; componentShelf.paddingLeft = 32; componentShelf.itemSpacing = 24;
  componentShelf.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.96 } }];
  const context: BuildContext = { images: imageMap, fonts, variables, textStyles, componentCounts: collectComponentCounts(pkg.pages), components: new Map(), componentShelf, geometry: [], pageName: "" };
  const existingBottom = page.children.filter((node) => node !== componentShelf).reduce((bottom, node) => Math.max(bottom, node.y + node.height), -160);
  const startY = existingBottom + 160;
  const frameIds: string[] = [];
  let x = 0;
  for (const pageSpec of pkg.pages) {
    const planned = planFigmaNode(pageSpec.root, { parentLayout: "none", parentFixed: { horizontal: true, vertical: true } });
    const frame = figma.createFrame();
    frame.name = `DOM Migrate v3 / ${pageSpec.name}`;
    frame.x = x; frame.y = startY;
    await populateContainer(frame, planned, context);
    frame.resize(pageSpec.viewport.width, pageSpec.viewport.height);
    frame.layoutSizingHorizontal = "FIXED"; frame.layoutSizingVertical = "FIXED";
    frame.clipsContent = true;
    frameIds.push(frame.id);
    context.pageName = pageSpec.name;
    collectGeometry(frame, pageSpec.name, context.geometry);
    x += pageSpec.viewport.width + 160;
    figma.ui.postMessage({ type: "progress", text: `Built ${frameIds.length}/${pkg.pages.length}: ${pageSpec.name}` });
  }
  componentShelf.x = x + 40; componentShelf.y = startY;
  if (!context.components.size) componentShelf.remove();
  figma.currentPage.selection = frameIds.map((id) => figma.getNodeById(id)).filter(Boolean) as SceneNode[];
  figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
  return { frameIds, componentIds: Array.from(context.components.values()).map((node) => node.id), geometry: context.geometry };
}

figma.ui.onmessage = async (message: { type: string; pkg?: unknown; pageName?: string }) => {
  try {
    if (message.type === "preflight") {
      const result = await preflightPackage(message.pkg);
      figma.ui.postMessage({ type: "preflight", report: result.report });
      return;
    }
    if (message.type !== "build") return;
    const result = await preflightPackage(message.pkg);
    if (!result.pkg || !result.fontMap) throw new Error("Preflight did not produce a buildable package");
    if (result.report.errors.length) throw new Error(result.report.errors.map((item) => `${item.code}: ${item.message}`).join("\n"));
    figma.ui.postMessage({ type: "progress", text: "Preflight passed. Creating variables and text styles…" });
    const built = await buildPackage(result.pkg, result.fontMap, message.pageName || "DOM Migrate v3 QA");
    figma.ui.postMessage({ type: "report", data: JSON.stringify({ schemaVersion: 3, frames: built.frameIds, components: built.componentIds, geometry: built.geometry }, null, 2) });
    figma.ui.postMessage({ type: "done", text: `Built ${built.frameIds.length} screen(s), ${built.componentIds.length} component(s).`, frameIds: built.frameIds, componentIds: built.componentIds });
  } catch (error) {
    figma.ui.postMessage({ type: "error", text: error instanceof Error ? error.message : String(error) });
  }
};
