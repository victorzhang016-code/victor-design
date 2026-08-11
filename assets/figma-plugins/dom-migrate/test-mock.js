import fs from "node:fs";

let nodeSequence = 0;
const nodes = new Map();

class MockNode {
  constructor(type, figma) {
    this.type = type;
    this.id = `n${++nodeSequence}`;
    this.name = type;
    this.children = [];
    this.parent = null;
    this.x = 0; this.y = 0; this.width = 100; this.height = 100;
    this.fills = []; this.strokes = []; this.effects = [];
    this.opacity = 1; this.layoutMode = "NONE"; this.layoutPositioning = "AUTO";
    this._layoutSizingHorizontal = "FIXED"; this._layoutSizingVertical = "FIXED";
    this.gridColumnSizes = []; this.gridRowSizes = [];
    this.componentPropertyDefinitions = {};
    this._figma = figma;
    nodes.set(this.id, this);
  }
  resize(width, height) { this.width = width; this.height = height; }
  appendChild(child) {
    if (this.type === "COMPONENT" && child.type === "COMPONENT") throw new Error("Cannot nest a component directly inside a component");
    if (child.parent) child.parent.children = child.parent.children.filter((item) => item !== child);
    child.parent = this; this.children.push(child);
  }
  insertChild(index, child) { if (child.parent) child.parent.children = child.parent.children.filter((item) => item !== child); child.parent = this; this.children.splice(index, 0, child); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((item) => item !== this); nodes.delete(this.id); }
  set layoutSizingHorizontal(value) {
    if (value === "FILL" && this.parent && this.parent.layoutMode === "NONE") throw new Error("FILL horizontal requires an auto-layout parent");
    if (value === "HUG" && this.type !== "TEXT" && this.layoutMode === "NONE") throw new Error("HUG can only be set on auto-layout frames or text children of auto-layout frames");
    if (value === "HUG" && this.children?.some((child) => child.layoutSizingHorizontal === "FILL")) throw new Error("HUG horizontal parent cannot contain FILL child");
    this._layoutSizingHorizontal = value;
  }
  get layoutSizingHorizontal() { return this._layoutSizingHorizontal; }
  set layoutSizingVertical(value) {
    if (value === "FILL" && this.parent && this.parent.layoutMode === "NONE") throw new Error("FILL vertical requires an auto-layout parent");
    if (value === "HUG" && this.type !== "TEXT" && this.layoutMode === "NONE") throw new Error("HUG can only be set on auto-layout frames or text children of auto-layout frames");
    if (value === "HUG" && this.children?.some((child) => child.layoutSizingVertical === "FILL")) throw new Error("HUG vertical parent cannot contain FILL child");
    this._layoutSizingVertical = value;
  }
  get layoutSizingVertical() { return this._layoutSizingVertical; }
  set gridColumnCount(value) { this._gridColumnCount = value; this.gridColumnSizes = Array.from({ length: value }, () => ({ type: "FLEX", value: 1 })); }
  get gridColumnCount() { return this._gridColumnCount || 1; }
  set gridRowCount(value) { this._gridRowCount = value; this.gridRowSizes = Array.from({ length: value }, () => ({ type: "FLEX", value: 1 })); }
  get gridRowCount() { return this._gridRowCount || 1; }
  setBoundVariable() {}
  setProperties(values) { this.properties = { ...(this.properties || {}), ...values }; }
}

class MockText extends MockNode {
  constructor(figma) { super("TEXT", figma); this.fontName = null; this._characters = ""; }
  set characters(value) { if (!this.fontName) throw new Error("Font must be loaded before writing text"); this._characters = value; }
  get characters() { return this._characters; }
  async setTextStyleIdAsync(id) { this.textStyleId = id; }
}

class MockComponent extends MockNode {
  constructor(figma) { super("COMPONENT", figma); }
  createInstance() { const node = this._figma._create("INSTANCE"); node.width = this.width; node.height = this.height; node.mainComponent = this; return node; }
  addComponentProperty(name, type, defaultValue) { const key = `${name}#${this.id}`; this.componentPropertyDefinitions[key] = { type, defaultValue }; return key; }
}

class MockVariable {
  constructor(name, collection, type) { this.id = `v${++nodeSequence}`; this.name = name; this.variableCollectionId = collection.id; this.resolvedType = type; this.scopes = []; this.valuesByMode = {}; }
  setVariableCodeSyntax(platform, value) { this.codeSyntax = { ...(this.codeSyntax || {}), [platform]: value }; }
  setValueForMode(mode, value) { this.valuesByMode[mode] = value; }
}

const root = { children: [] };
const figma = {
  root,
  ui: { messages: [], postMessage(message) { this.messages.push(message); } },
  viewport: { center: { x: 1000, y: 700 }, scrollAndZoomIntoView() {} },
  showUI() {},
  _create(type) {
    const node = type === "TEXT" ? new MockText(this) : type === "COMPONENT" ? new MockComponent(this) : new MockNode(type, this);
    if (this.currentPage && type !== "PAGE") this.currentPage.appendChild(node);
    return node;
  },
  createPage() { const page = new MockNode("PAGE", this); page.selection = []; root.children.push(page); return page; },
  createFrame() { return this._create("FRAME"); },
  createRectangle() { return this._create("RECTANGLE"); },
  createText() { return this._create("TEXT"); },
  createComponent() { return this._create("COMPONENT"); },
  createNodeFromSvg() { return this._create("VECTOR-GROUP"); },
  createImage(data) { return { hash: `image-${data.length}` }; },
  getNodeById() { throw new Error("getNodeById is unavailable with documentAccess: dynamic-page"); },
  async getNodeByIdAsync(id) { return nodes.get(id) || null; },
  async setCurrentPageAsync(page) { this.currentPage = page; },
  async listAvailableFontsAsync() { return ["Regular", "Semi Bold", "Bold", "Extra Bold"].map((style) => ({ fontName: { family: "Inter", style } })); },
  async loadFontAsync() {},
  _textStyles: [],
  async getLocalTextStylesAsync() { return this._textStyles; },
  createTextStyle() { const style = { id: `ts${++nodeSequence}`, name: "", fontName: null }; this._textStyles.push(style); return style; },
  variables: {
    _collections: [], _variables: [],
    async getLocalVariableCollectionsAsync() { return this._collections; },
    async getLocalVariablesAsync() { return this._variables; },
    createVariableCollection(name) { const collection = { id: `vc${++nodeSequence}`, name, defaultModeId: "mode", modes: [{ modeId: "mode", name: "Value" }] }; this._collections.push(collection); return collection; },
    createVariable(name, collection, type) { const variable = new MockVariable(name, collection, type); this._variables.push(variable); return variable; },
    setBoundVariableForPaint(paint, field, variable) { return { ...paint, boundVariables: { [field]: { id: variable.id, type: "VARIABLE_ALIAS" } } }; }
  }
};

figma.currentPage = figma.createPage();
figma.currentPage.name = "Baseline";
globalThis.figma = figma;
globalThis.__html__ = "";

const codePath = process.argv[2] || "code.js";
const packagePath = process.argv[3] || "tests/fixtures/v3-package.json";
const code = fs.readFileSync(codePath, "utf8");
(0, eval)(code);
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

await figma.ui.onmessage({ type: "build", pkg, pageName: "DOM Migrate v3 QA" });
const errors = figma.ui.messages.filter((message) => message.type === "error");
if (errors.length) throw new Error(errors.map((error) => error.text).join("\n"));
const qaPage = root.children.find((page) => page.name === "DOM Migrate v3 QA");
const topLevel = qaPage?.children.length || 0;
if (topLevel === 0) throw new Error("top-level nodes: 0");
const anonymousSpacers = qaPage.children.flatMap(function flatten(node) { return [node, ...(node.children || []).flatMap(flatten)]; }).filter((node) => /^spacer(?:-grow)?$/i.test(node.name));
if (anonymousSpacers.length) throw new Error(`anonymous spacers: ${anonymousSpacers.length}`);
const done = figma.ui.messages.find((message) => message.type === "done");
if (!done?.componentIds?.length) throw new Error("explicit component did not produce a component and instances");
console.log(JSON.stringify({ topLevelNodes: topLevel, messages: [done], variables: figma.variables._variables.length, textStyles: figma._textStyles.length }, null, 2));
