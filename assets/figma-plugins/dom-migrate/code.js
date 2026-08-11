// DOM Migrate — builds native Figma frames from a dom-migrate JSON package.
// Package shape: { pages: [{name,width,height,bgColor?|bgImageKey?,nodes:[...]}], images: {key: base64} }

const FONT_FALLBACKS = ["Microsoft YaHei", "Inter"];

async function loadFontRobust(family, style) {
  const candidates = [{ family, style }];
  for (const fb of FONT_FALLBACKS) {
    candidates.push({ family: fb, style });
    candidates.push({ family: fb, style: style === "Regular" ? "Regular" : "Regular" });
  }
  candidates.push({ family, style: "Regular" });
  candidates.push({ family: "Inter", style: "Regular" });
  for (const c of candidates) {
    try { await figma.loadFontAsync(c); return c; } catch (e) { /* try next */ }
  }
  return { family: "Inter", style: "Regular" };
}

function b64ToBytes(b64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const len = Math.floor(b64.length * 3 / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const n = (lookup[b64.charCodeAt(i)] << 18) | (lookup[b64.charCodeAt(i + 1)] << 12) |
              (lookup[b64.charCodeAt(i + 2)] << 6) | lookup[b64.charCodeAt(i + 3)];
    if (p < len) bytes[p++] = (n >> 16) & 255;
    if (p < len) bytes[p++] = (n >> 8) & 255;
    if (p < len) bytes[p++] = n & 255;
  }
  return bytes;
}

function solid(rgb, opacity) {
  const p = { type: "SOLID", color: { r: rgb[0], g: rgb[1], b: rgb[2] } };
  if (opacity !== undefined && opacity < 1) p.opacity = opacity;
  return p;
}

figma.showUI(__html__, { width: 380, height: 200 });

/* ---------- UI structural mode ---------- */

function sig(node) {
  // subtree signature for component detection — structure + text, no positions
  const strip = (n) => {
    const { absolute, size, marginTop, ...rest } = n;
    if (rest.children) rest.children = rest.children.map(strip);
    return rest;
  };
  return JSON.stringify(strip(node));
}

const ALIGN_MAP = { MIN: "MIN", CENTER: "CENTER", MAX: "MAX", SPACE_BETWEEN: "SPACE_BETWEEN", BASELINE: "BASELINE", STRETCH: "STRETCH" };

function countSigs(node, counts) {
  if (node.name && (node.children || []).length) {
    const s = sig(node);
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  for (const c of node.children || []) countSigs(c, counts);
}

async function buildTreeNode(node, hash, components, counts, inComponent) {
  if (node.type === "shape" || node.kind === "shape") {
    const r = figma.createRectangle();
    r.resize(Math.max((node.w || (node.size && node.size.w) || 1), 0.1), Math.max((node.h || (node.size && node.size.h) || 1), 0.1));
    if (node.radius) r.cornerRadius = node.radius;
    r.fills = node.fill ? [solid(node.fill.color, node.fill.opacity)] : [];
    if (node.stroke) { r.strokes = [solid(node.stroke.color, node.stroke.opacity)]; r.strokeWeight = node.stroke.weight; }
    r.name = node.name || "shape";
    return r;
  }
  if (node.kind === "image" || node.type === "image") {
    const r = figma.createRectangle();
    const w = node.w || (node.size && node.size.w) || 1, h = node.h || (node.size && node.size.h) || 1;
    r.resize(Math.max(w, 0.1), Math.max(h, 0.1));
    if (node.radius) r.cornerRadius = node.radius;
    r.fills = [{ type: "IMAGE", imageHash: hash[node.imageKey], scaleMode: "FILL" }];
    r.name = node.name || "image";
    return r;
  }
  if (node.kind === "svg") {
    const g = figma.createNodeFromSvg(node.svg);
    if (node.size) g.resize(node.size.w, node.size.h);
    g.name = node.name || "icon";
    return g;
  }
  if (node.kind === "text") {
    // chip/button pattern: text with fill or padding becomes an auto-layout frame
    const isChip = node.chip || node.box || node.fill || (node.pad && node.pad.some(v => v > 0));
    const t = figma.createText();
    const base = await loadFontRobust(niceFamily(node.fontFamily), node.fontStyle);
    t.fontName = base;
    t.characters = node.text;
    t.fontSize = node.fontSize;
    t.lineHeight = node.lineHeight ? { unit: "PIXELS", value: node.lineHeight } : { unit: "AUTO" };
    if (node.letterSpacing) t.letterSpacing = { unit: "PIXELS", value: node.letterSpacing };
    t.fills = [solid(node.color, node.opacity)];
    t.textAlignHorizontal = node.align === "center" ? "CENTER" : node.align === "right" ? "RIGHT" : "LEFT";
    // single-line text hugs its content (never wraps); multi-line text keeps
    // the captured width and auto-fits height, matching browser wrapping
    const lh = node.lineHeight || node.fontSize * 1.4;
    const singleLine = node.size && node.size.h <= lh * 1.35 && !node.text.includes("\n");
    if (singleLine) {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
    } else {
      t.textAutoResize = "HEIGHT";
      const tw = (node.size && node.size.w) || 100;
      t.resize(Math.max(tw, 1), 10);
    }
    for (const sp of (node.spans || [])) {
      if (sp.bold) t.setRangeFontName(sp.start, sp.end, await loadFontRobust(niceFamily(node.fontFamily), "Bold"));
      if (sp.color) t.setRangeFills(sp.start, sp.end, [solid(sp.color)]);
    }
    if (!isChip) { t.name = node.name || "text"; return t; }
    // chip/box text hugs its content; the frame's alignment does the placement
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    const f = figma.createFrame();
    f.name = node.name || "chip";
    f.layoutMode = "HORIZONTAL";
    f.primaryAxisAlignItems = node.box ? "CENTER" : "MIN";
    f.counterAxisAlignItems = "CENTER";
    const pad = node.pad || [0, 0, 0, 0];
    f.paddingTop = pad[0]; f.paddingRight = pad[1]; f.paddingBottom = pad[2]; f.paddingLeft = pad[3];
    f.fills = node.fill ? [solid(node.fill.color, node.fill.opacity)] : [];
    if (node.stroke) { f.strokes = [solid(node.stroke.color, node.stroke.opacity)]; f.strokeWeight = node.stroke.weight; }
    if (node.radius) f.cornerRadius = node.radius;
    f.appendChild(t);
    if (node.box && node.size) {
      // block-level buttons keep their captured height and stretch horizontally
      f.counterAxisSizingMode = "FIXED";
      f.primaryAxisSizingMode = "FIXED";
      f.resize(node.size.w, node.size.h);
    } else {
      f.primaryAxisSizingMode = "AUTO";
      f.counterAxisSizingMode = "AUTO";
    }
    return f;
  }
  // frame or component (repeated subtrees; components cannot nest, so inside
  // a component we either reuse an existing instance or stay a plain frame)
  const s = sig(node);
  const repeated = (counts.get(s) || 0) > 1;
  if (repeated && components.has(s)) {
    const inst = components.get(s).createInstance();
    inst.name = node.name || "instance";
    return inst;
  }
  const makeComponent = repeated && !inComponent;
  const f = makeComponent ? figma.createComponent() : figma.createFrame();
  f.name = node.name || "frame";
  const L = node.layout || { mode: "NONE", pad: [0, 0, 0, 0] };
  f.layoutMode = L.mode || "NONE";
  if (L.mode !== "NONE") {
    f.primaryAxisAlignItems = ALIGN_MAP[L.primary] || "MIN";
    f.counterAxisAlignItems = L.counter === "STRETCH" ? "MIN" : (ALIGN_MAP[L.counter] || "MIN");
    if (L.counter === "STRETCH") f.counterAxisAlignItems = "MIN";
    if (L.gap) f.itemSpacing = L.gap;
  }
  const pad = L.pad || [0, 0, 0, 0];
  f.paddingTop = pad[0]; f.paddingRight = pad[1]; f.paddingBottom = pad[2]; f.paddingLeft = pad[3];
  if (node.bgImageKey) {
    f.fills = [{ type: "IMAGE", imageHash: hash[node.bgImageKey], scaleMode: "FILL" }];
  } else {
    f.fills = node.fill ? [solid(node.fill.color, node.fill.opacity)] : [];
  }
  if (node.stroke) { f.strokes = [solid(node.stroke.color)]; f.strokeWeight = node.stroke.weight; }
  if (node.radius) f.cornerRadius = node.radius;
  if (node.shadow) {
    f.effects = [{ type: "DROP_SHADOW", color: { r: node.shadow.color[0], g: node.shadow.color[1], b: node.shadow.color[2], a: node.shadow.opacity },
                   offset: { x: node.shadow.x, y: node.shadow.y }, radius: node.shadow.blur, spread: node.shadow.spread || 0, visible: true, blendMode: "NORMAL" }];
  }
  f.clipsContent = node.clips !== false && L.mode === "NONE" ? true : !!node.clips;
  if (L.mode === "NONE" && node.size) f.resize(node.size.w, node.size.h);
  for (const c of node.children || []) {
    const child = await buildTreeNode(c, hash, components, counts, inComponent || makeComponent);
    f.appendChild(child);
    if (c.absolute) {
      // ABSOLUTE positioning only exists inside auto-layout parents;
      // in a NONE parent a plain x/y is already absolute
      if (f.layoutMode !== "NONE") child.layoutPositioning = "ABSOLUTE";
      child.x = c.absolute.x; child.y = c.absolute.y;
    } else if (f.layoutMode !== "NONE") {
      if (c.marginTop) {
        const sp = figma.createRectangle();
        sp.name = "spacer"; sp.fills = [];
        sp.resize(1, c.marginTop);
        f.insertChild(f.children.indexOf(child), sp);
      }
      if (c.layoutGrow) child.layoutGrow = c.layoutGrow;
      if (f.layoutMode === "VERTICAL" && L.stretchChildren !== false && !c.chip && (child.type === "TEXT" || child.type === "FRAME" || child.type === "COMPONENT" || child.type === "INSTANCE"))
        child.layoutAlign = "STRETCH";
    }
  }
  if (node.absolute && node.size) {
    // overlays keep the captured geometry
    f.primaryAxisSizingMode = "FIXED"; f.counterAxisSizingMode = "FIXED";
    f.resize(node.size.w, node.size.h);
  } else if (L.mode !== "NONE") { f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO"; }
  // register only real components (never one buried inside another component)
  if (makeComponent) components.set(s, /** @type any */(f));
  return f;
}

function niceFamily(f) { return f || "Inter"; }

async function buildTreePages(pages, images) {
  figma.ui.postMessage({ type: "status", text: "解码图片…" });
  const hash = {};
  for (const k of Object.keys(images)) hash[k] = figma.createImage(b64ToBytes(images[k])).hash;
  const components = new Map();
  const counts = new Map();
  for (const pg of pages) if (pg.tree) countSigs(pg.tree, counts);
  // append after any existing canvas content instead of overlapping it
  let x = 0;
  if (figma.currentPage.children.length) {
    x = Math.max(...figma.currentPage.children.map(n => n.x + n.width)) + 200;
  }
  let i = 0;
  figma.ui.postMessage({ type: "status", text: `导入起点 x=${Math.round(x)}` });
  for (const pg of pages) {
    const frame = figma.createFrame();
    frame.name = pg.name;
    frame.resize(pg.width, pg.height);
    frame.x = x; frame.y = 0;
    frame.clipsContent = true;
    frame.fills = pg.bgColor ? [solid(pg.bgColor)] : [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    if (pg.tree) {
      for (const c of pg.tree.children || []) {
        const child = await buildTreeNode(c, hash, components, counts);
        frame.appendChild(child);
        if (c.absolute) { child.x = c.absolute.x; child.y = c.absolute.y; } // top-level frames are NONE
      }
      frame.layoutMode = "NONE";
    }
    i++; x += pg.width + 160;
    figma.ui.postMessage({ type: "status", text: `已建 ${i}/${pages.length} 屏…` });
  }
  return { components: components.size };
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "build") return;
  const t0 = Date.now();
  try {
    const { pages, images } = msg.pkg;
    if (pages.length && pages[0].tree) {
      const r = await buildTreePages(pages, images);
      figma.ui.postMessage({ type: "done", text: `完成：${pages.length} 屏（auto-layout 结构），组件 ${r.components} 个，耗时 ${(Date.now() - t0) / 1000}s` });
      return;
    }
    figma.ui.postMessage({ type: "status", text: "解码图片…" });
    const hash = {};
    for (const k of Object.keys(images)) {
      hash[k] = figma.createImage(b64ToBytes(images[k])).hash;
    }

    let x = 0;
    if (figma.currentPage.children.length) {
      x = Math.max(...figma.currentPage.children.map(n => n.x + n.width)) + 200;
    }
    let frameCount = 0;
    for (const pg of pages) {
      const frame = figma.createFrame();
      frame.name = pg.name;
      frame.resize(pg.width, pg.height);
      frame.x = x; frame.y = 0;
      frame.clipsContent = true;
      if (pg.bgImageKey) {
        frame.fills = [{ type: "IMAGE", imageHash: hash[pg.bgImageKey], scaleMode: "FILL" }];
      } else if (pg.bgColor) {
        frame.fills = [solid(pg.bgColor)];
      } else {
        frame.fills = [];
      }

      for (const n of pg.nodes) {
        if (n.type === "shape") {
          const r = figma.createRectangle();
          r.x = n.x; r.y = n.y; r.resize(Math.max(n.w, 0.1), Math.max(n.h, 0.1));
          if (n.radius) r.cornerRadius = n.radius;
          r.fills = n.fill ? [solid(n.fill.color, n.fill.opacity)] : [];
          if (n.stroke) { r.strokes = [solid(n.stroke.color, n.stroke.opacity)]; r.strokeWeight = n.stroke.weight; }
          frame.appendChild(r);
        } else if (n.type === "image") {
          const r = figma.createRectangle();
          r.x = n.x; r.y = n.y; r.resize(Math.max(n.w, 0.1), Math.max(n.h, 0.1));
          // CSS object-fit: cover is the snapshot default; "fit" only when the
          // packager marked the node as contain (e.g. a full-bleed diagram plate);
          // "tile" = repeating texture layer (grain/noise), natural-size tiling
          const mode = n.fitMode === "fit" ? "FIT" : n.fitMode === "tile" ? "TILE" : "FILL";
          const fill = { type: "IMAGE", imageHash: hash[n.imageKey], scaleMode: mode };
          if (mode === "TILE") fill.scalingFactor = 1;
          r.fills = [fill];
          if (typeof n.alpha === "number") r.opacity = n.alpha;
          frame.appendChild(r);
        } else if (n.type === "text") {
          const t = figma.createText();
          const base = await loadFontRobust(n.fontFamily, n.fontStyle);
          t.fontName = base;
          t.characters = n.text;
          t.fontSize = n.fontSize;
          t.lineHeight = n.lineHeight ? { unit: "PIXELS", value: n.lineHeight } : { unit: "AUTO" };
          if (n.letterSpacing) t.letterSpacing = { unit: "PIXELS", value: n.letterSpacing };
          t.fills = [solid(n.color, n.opacity)];
          t.textAlignHorizontal = n.align === "center" ? "CENTER" : n.align === "right" ? "RIGHT" : "LEFT";
          t.x = n.x; t.y = n.y;
          t.textAutoResize = "HEIGHT";
          t.resize(Math.max(n.w, 1), Math.max(n.h, 1));
          for (const sp of (n.spans || [])) {
            if (sp.bold) {
              const bf = await loadFontRobust(n.fontFamily, "Bold");
              t.setRangeFontName(sp.start, sp.end, bf);
            }
            if (sp.color) t.setRangeFills(sp.start, sp.end, [solid(sp.color)]);
          }
          frame.appendChild(t);
        }
      }
      frameCount++;
      x += pg.width + 160;
      figma.ui.postMessage({ type: "status", text: `已建 ${frameCount}/${pages.length} 页…` });
    }
    figma.currentPage.selection = [];
    figma.ui.postMessage({ type: "done", text: `完成：${pages.length} 页，耗时 ${(Date.now() - t0) / 1000}s` });
  } catch (e) {
    figma.ui.postMessage({ type: "error", text: String(e && e.message || e) });
  }
};
