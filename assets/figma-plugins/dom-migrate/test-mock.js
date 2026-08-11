// Mock the Figma plugin API closely enough to execute dom-migrate's code.js
// end-to-end in Node, enforcing the real constraints we care about.
const fs = require("fs");

let nodeSeq = 0;

class MockNode {
  constructor(type) {
    this.type = type;
    this.id = "n" + nodeSeq++;
    this.name = type;
    this.children = [];
    this.x = 0; this.y = 0;
    this.width = 100; this.height = 100;
    this._layoutPositioning = "AUTO";
    this.layoutMode = "NONE";
  }
  resize(w, h) { this.width = w; this.height = h; }
  appendChild(child) {
    if (this.type === "COMPONENT" && child.type === "COMPONENT")
      throw new Error("in appendChild: Cannot move node. Reparenting would create a component inside a component");
    if (child.parent) child.parent.children = child.parent.children.filter(c => c !== child);
    child.parent = this;
    this.children.push(child);
  }
  insertChild(i, child) {
    if (this.type === "COMPONENT" && child.type === "COMPONENT")
      throw new Error("in appendChild: Cannot move node. Reparenting would create a component inside a component");
    child.parent = this;
    this.children.splice(i, 0, child);
  }
  get layoutPositioning() { return this._layoutPositioning; }
  set layoutPositioning(v) {
    if (v === "ABSOLUTE" && this.parent && this.parent.layoutMode === "NONE")
      throw new Error("in set_layoutPositioning: Can only set layoutPositioning = ABSOLUTE if the parent node has layoutMode !== NONE");
    this._layoutPositioning = v;
  }
}

class MockText extends MockNode {
  constructor() { super("TEXT"); this.fontName = null; this._chars = ""; }
  set characters(v) {
    if (!this.fontName) throw new Error("in set_characters: fontName is not set");
    this._chars = v;
  }
  get characters() { return this._chars; }
  setRangeFontName(s, e, f) { if (e > this._chars.length) throw new Error("range overflow"); }
  setRangeFills(s, e, f) { if (e > this._chars.length) throw new Error("range overflow"); }
}
class MockComponent extends MockNode {
  constructor() { super("COMPONENT"); }
  createInstance() { const i = new MockNode("INSTANCE"); i.name = this.name + " instance"; return i; }
}

const figma = {
  currentPage: new MockNode("PAGE"),
  ui: { posted: [], postMessage(m) { this.posted.push(m); if (m.type !== "status") console.log("[ui]", m.type, m.text || ""); } },
  showUI() {},
  createFrame: () => new MockNode("FRAME"),
  createRectangle: () => new MockNode("RECTANGLE"),
  createComponent: () => new MockComponent(),
  createText: () => new MockText(),
  createNodeFromSvg: (svg) => { const n = new MockNode("VECTOR-GROUP"); n.resize(16, 16); return n; },
  createImage: (bytes) => ({ hash: "h" + (bytes.length % 997) }),
  loadFontAsync: async (f) => f,
  viewport: {},
};

global.figma = figma;
global.__html__ = "";

const code = fs.readFileSync(process.argv[2], "utf8");
eval(code);

const pkg = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));

(async () => {
  try {
    await figma.ui.onmessage({ type: "build", pkg });
    const done = figma.ui.posted.filter(m => m.type === "done" || m.type === "error");
    console.log("RESULT:", JSON.stringify(done));
    console.log("top-level nodes:", figma.currentPage.children.length);
  } catch (e) {
    console.error("BUILD FAILED:", e.message);
    process.exit(1);
  }
})();
