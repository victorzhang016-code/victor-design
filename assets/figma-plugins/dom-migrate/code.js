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

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "build") return;
  const t0 = Date.now();
  try {
    const { pages, images } = msg.pkg;
    figma.ui.postMessage({ type: "status", text: "解码图片…" });
    const hash = {};
    for (const k of Object.keys(images)) {
      hash[k] = figma.createImage(b64ToBytes(images[k])).hash;
    }

    let x = 0;
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
          if (n.stroke) { r.strokes = [solid(n.stroke.color)]; r.strokeWeight = n.stroke.weight; }
          frame.appendChild(r);
        } else if (n.type === "image") {
          const r = figma.createRectangle();
          r.x = n.x; r.y = n.y; r.resize(Math.max(n.w, 0.1), Math.max(n.h, 0.1));
          r.fills = [{ type: "IMAGE", imageHash: hash[n.imageKey], scaleMode: "FIT" }];
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
