// dom-migrate UI snapshot — structural mode.
// Serializes the DOM as a TREE with layout metadata, so the Figma plugin can
// rebuild auto-layout frames instead of flat absolute nodes.
//
// Usage (page context): await domMigrateSnapshotUI()  →
//   { width, height, name, bgColor?, tree }
// tree node: { kind: "frame"|"text"|"image"|"svg"|"shape", name, ... }
//   frame:  layout {mode:"NONE"|"HORIZONTAL"|"VERTICAL", gap, pad:[t,r,b,l],
//           primary, counter}, absolute {x,y}?, fill?, stroke?, radius?,
//           shadow?, children[]
//   text:   text, fontFamily, fontStyle, fontSize, lineHeight, letterSpacing,
//           color, align, spans[], layoutGrow?, absolute?
//   image:  src, radius?, absolute?
//   svg:    svg (outerHTML), absolute?
//   shape:  fill?, stroke?, radius?, absolute?  (hairlines, indicators…)
window.domMigrateSnapshotUI = async function (root) {
  const doc = (root && root.ownerDocument) || document;
  const win = doc.defaultView;
  const px = (v) => Math.round(v * 100) / 100;
  const INLINE = new Set(["B", "STRONG", "SPAN", "EM", "I", "A", "SMALL"]);

  function rgbArr(c) { const m = c.match(/[\d.]+/g) || [0, 0, 0]; return [m[0] / 255, m[1] / 255, m[2] / 255]; }
  function resolveFamily(fontFamily) {
    // fonts.check() lies in headless Chrome; measure against a bogus baseline instead
    const ctx = doc.createElement("canvas").getContext("2d");
    const probe = "mmmmmmmmmmlli WWW 中文测试字 0123456789";
    ctx.font = '16px "DefinitelyMissingXYZ123"';
    const base = ctx.measureText(probe).width;
    const fams = (fontFamily || "").split(",").map(x => x.trim().replace(/["']/g, "")).filter(Boolean);
    for (const f of fams) {
      if (["sans-serif", "serif", "monospace"].includes(f)) break;
      ctx.font = `16px "${f}", "DefinitelyMissingXYZ123"`;
      if (ctx.measureText(probe).width !== base) return f;
    }
    return null; // caller keeps its own fallback
  }
  function alphaOf(c) { const m = c.match(/[\d.]+/g); return m && m.length === 4 ? parseFloat(m[3]) : 1; }
  function nameOf(el) {
    const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").toString().trim().split(/\s+/)[0];
    if (cls) return cls;
    if (el.id) return "#" + el.id;
    return el.tagName.toLowerCase();
  }
  function mapAlign(v) {
    return { "flex-start": "MIN", start: "MIN", center: "CENTER", "flex-end": "MAX", end: "MAX",
             "space-between": "SPACE_BETWEEN", baseline: "BASELINE", stretch: "STRETCH" }[v] || "MIN";
  }
  function parseShadow(v) {
    if (!v || v === "none") return null;
    const m = v.match(/^(rgba?\([^)]*\)|#\w+)\s*(.*)$/) || v.match(/(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\s*(-?[\d.]+)?px?\s*(rgba?\([^)]*\))/);
    const nums = v.match(/(-?[\d.]+)px/g);
    const col = v.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/);
    if (!nums || nums.length < 3 || !col) return null;
    let c = [0, 0, 0, 0.25];
    if (col[0].startsWith("#")) {
      const h = col[0].slice(1);
      c = [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255, h.length >= 8 ? parseInt(h.substr(6, 2), 16) / 255 : 1];
    } else {
      const p = col[0].match(/[\d.]+/g); c = [p[0] / 255, p[1] / 255, p[2] / 255, p.length > 3 ? parseFloat(p[3]) : 1];
    }
    return { x: parseFloat(nums[0]), y: parseFloat(nums[1]), blur: parseFloat(nums[2]),
             spread: nums[3] ? parseFloat(nums[3]) : 0, color: c.slice(0, 3), opacity: c[3] };
  }
  function textPayload(el, cs) {
    const norm = (t) => t.replace(/[^\S\n]+/g, " ");
    let rebuilt = "";
    const spans = [];
    [...el.childNodes].forEach(function collect(node) {
      if (node.nodeType === 3) {
        let t = norm(node.textContent);
        if (rebuilt === "" || rebuilt.endsWith("\n")) t = t.replace(/^[ \t]+/, "");
        rebuilt += t; return;
      }
      if (node.nodeType === 1) {
        if (node.tagName === "BR") { rebuilt = rebuilt.replace(/[ \t]+$/, "") + "\n"; return; }
        if (node.tagName === "SVG") { if (rebuilt && !rebuilt.endsWith(" ")) rebuilt += " "; return; }
        const before = rebuilt.length;
        [...node.childNodes].forEach(collect);
        const ncs = win.getComputedStyle(node);
        const bold = parseInt(ncs.fontWeight, 10) >= 600;
        if (INLINE.has(node.tagName) && rebuilt.length > before && (bold || ncs.color !== cs.color))
          spans.push({ start: before, end: rebuilt.length, bold, color: rgbArr(ncs.color) });
      }
    });
    const fams = (cs.fontFamily || "").split(",").map(s => s.trim().replace(/["']/g, ""));
    const w = parseInt(cs.fontWeight, 10) || 400;
    return {
      kind: "text", name: nameOf(el), text: rebuilt.replace(/[ \t]+$/, ""),
      fontFamily: resolveFamily(cs.fontFamily) || fams[0] || "Inter",
      fontStyle: w >= 800 ? "Black" : w >= 600 ? "Bold" : w <= 300 ? "Light" : "Regular",
      fontSize: parseFloat(cs.fontSize),
      lineHeight: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight),
      letterSpacing: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing),
      color: rgbArr(cs.color), opacity: alphaOf(cs.color), align: cs.textAlign, spans,
    };
  }

  // Chrome's getComputedStyle resolves auto margins to used pixels, so
  // detect `auto` from the stylesheet text instead (single-file masters).
  const styleText = [...doc.querySelectorAll("style")].map(st => st.textContent).join("\n");
  const ruleCache = new Map();
  function marginFlags(el) {
    const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").toString().trim().split(/\s+/).filter(Boolean);
    let mtAuto = false, mxAuto = false;
    for (const c of cls) {
      if (!ruleCache.has(c)) {
        const bodies = [];
        const re = new RegExp("\\." + c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w-])[^}]*\\{([^}]*)\\}", "g");
        let m; while ((m = re.exec(styleText))) bodies.push(m[1]);
        ruleCache.set(c, bodies.join(";"));
      }
      const body = ruleCache.get(c);
      if (!body) continue;
      if (/margin-top\s*:\s*auto/.test(body)) mtAuto = true;
      const short = body.match(/margin\s*:\s*([^;]+)/);
      if (short) {
        const parts = short[1].trim().split(/\s+/);
        if (parts[0] === "auto") mtAuto = true;
        if ((parts.length === 1 && parts[0] === "auto") || (parts.length >= 2 && parts[1] === "auto")) mxAuto = true;
      }
      if (/margin-left\s*:\s*auto/.test(body) && /margin-right\s*:\s*auto/.test(body)) mxAuto = true;
      if (/margin\s*:\s*0\s+auto/.test(body)) mxAuto = true;
    }
    // explicit px dimensions declared in the stylesheet (fixed-size blocks)
    let fixW = null, fixH = null;
    for (const c of cls) {
      const body = ruleCache.get(c);
      if (!body) continue;
      const hm = body.match(/(?:^|;)\s*height\s*:\s*([\d.]+)px/);
      const wm = body.match(/(?:^|;)\s*width\s*:\s*([\d.]+)px/);
      if (hm) fixH = parseFloat(hm[1]);
      if (wm) fixW = parseFloat(wm[1]);
    }
    return { mtAuto, mxAuto, fixW, fixH };
  }

  async function walk(el, parentRect) {
    if (!(el instanceof win.Element)) return null;
    const cs = win.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return null;
    if (parseFloat(cs.opacity) === 0 && cs.position !== "static") return null; // hidden state layers
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) return null;

    const out = {};
    out.size = { w: px(r.width), h: px(r.height) };
    out.pos = { x: px(r.left - parentRect.left), y: px(r.top - parentRect.top) };
    if (cs.position === "absolute" || cs.position === "fixed") {
      out.absolute = { x: px(r.left - parentRect.left), y: px(r.top - parentRect.top) };
    }
    const flexGrow = parseFloat(cs.flexGrow) || 0;
    if (flexGrow > 0) out.layoutGrow = flexGrow;
    const mTop = parseFloat(cs.marginTop) || 0;
    if (mTop > 0 && cs.marginTop !== "auto") out.marginTop = px(mTop);
    const mf = marginFlags(el);
    if (mf.mtAuto) out.marginTopAuto = true;
    if (mf.mxAuto) out.centerSelf = true;
    if (mf.fixW) out.fixW = mf.fixW;
    if (mf.fixH) out.fixH = mf.fixH;
    if (cs.alignSelf && cs.alignSelf !== "auto" && cs.alignSelf !== "stretch") out.alignSelf = mapAlign(cs.alignSelf);

    if (el.tagName === "IMG") return { kind: "image", name: el.getAttribute("alt") || "image", src: el.getAttribute("src"),
      fit: cs.objectFit, objPos: cs.objectPosition, ...out };
    if (el.tagName.toUpperCase() === "SVG") return { kind: "svg", name: "icon", svg: el.outerHTML, ...out };

    const hasOwnText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasOwnText) {
      const inlineSvgs = [...el.children].filter(c => c.tagName && c.tagName.toUpperCase() === "SVG");
      if (inlineSvgs.length && (cs.display || "").includes("flex")) {
        // icon + text chip: a real frame with vector icon and hugging text.
        // fill/stroke/radius/pad are computed HERE (textPayload does not set them)
        const t = textPayload(el, cs);
        const pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(v => px(parseFloat(v) || 0));
        const node = { kind: "frame", name: nameOf(el), ...out,
          layout: { mode: "HORIZONTAL", gap: px(parseFloat(cs.gap) || parseFloat(cs.columnGap) || 0),
                    pad, primary: mapAlign(cs.justifyContent), counter: mapAlign(cs.alignItems) } };
        const bgc = (cs.backgroundColor || "").match(/[\d.]+/g);
        if (bgc && bgc.length >= 3 && (bgc.length === 3 || parseFloat(bgc[3]) > 0.02)) node.fill = { color: rgbArr(cs.backgroundColor), opacity: bgc.length === 4 ? parseFloat(bgc[3]) : 1 };
        const bw0 = parseFloat(cs.borderTopWidth) || 0;
        if (bw0 > 0 && cs.borderTopStyle !== "none") node.stroke = { color: rgbArr(cs.borderTopColor), weight: bw0 };
        if (parseFloat(cs.borderRadius) > 0) node.radius = px(parseFloat(cs.borderRadius));
        node.children = [
          ...inlineSvgs.map(c => ({ kind: "svg", name: "icon", svg: c.outerHTML })),
          { ...t, text: t.text.trim(), hug: true },
        ];
        return node;
      }
      const t = textPayload(el, cs);
      // chip / button / card style on text-bearing elements
      const bgA = (cs.backgroundColor || "").match(/[\d.]+/g);
      if (bgA && bgA.length >= 3 && (bgA.length === 3 || parseFloat(bgA[3]) > 0.02)) t.fill = { color: rgbArr(cs.backgroundColor), opacity: bgA.length === 4 ? parseFloat(bgA[3]) : 1 };
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw > 0 && cs.borderTopStyle !== "none") t.stroke = { color: rgbArr(cs.borderTopColor), weight: bw };
      if (parseFloat(cs.borderRadius) > 0) t.radius = px(parseFloat(cs.borderRadius));
      const pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(v => px(parseFloat(v) || 0));
      if (pad.some(v => v > 0)) t.pad = pad;
      if (t.fill || (t.pad && t.pad.some(v => v > 0))) {
        if ((cs.display || "").includes("inline")) t.chip = true; else t.box = true;
      }
      Object.assign(t, out);
      return t;
    }

    // frame-ish container
    const kids = [];
    for (const c of el.children) { const k = await walk(c, r); if (k) kids.push(k); }

    const bgA2 = (cs.backgroundColor || "").match(/[\d.]+/g);
    const hasBg = bgA2 && bgA2.length >= 3 && (bgA2.length === 3 || parseFloat(bgA2[3]) > 0.02);
    const bw2 = parseFloat(cs.borderTopWidth) || 0;
    const hasBorder = bw2 > 0 && cs.borderTopStyle !== "none";
    const shadow = parseShadow(cs.boxShadow);
    const isFlex = cs.display.includes("flex");
    const bgImg = (cs.backgroundImage || "").startsWith("url(") ? cs.backgroundImage : null;

    if (!kids.length && !hasBg && !hasBorder && !shadow && !bgImg) return null; // empty wrapper

    const node = { kind: "frame", name: nameOf(el), children: kids, ...out };
    const anyAbsolute = kids.some(k => k.absolute);
    node.layout = (isFlex || (!anyAbsolute && kids.length > 1)) ? {
      mode: (isFlex && !(cs.flexDirection || "row").startsWith("column")) ? "HORIZONTAL" : "VERTICAL",
      gap: px(parseFloat(cs.gap) || parseFloat(cs.columnGap) || 0),
      pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(v => px(parseFloat(v) || 0)),
      primary: mapAlign(cs.justifyContent),
      counter: mapAlign(cs.alignItems),
    } : { mode: "NONE", pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(v => px(parseFloat(v) || 0)) };
    // margin-top:auto is handled by the plugin as a grow spacer, not SPACE_BETWEEN
    if (node.layout.mode === "VERTICAL") node.layout.stretchChildren = !isFlex || ["stretch","normal"].includes(cs.alignItems || "stretch");
    if (hasBg) node.fill = { color: rgbArr(cs.backgroundColor), opacity: bgA2.length === 4 ? parseFloat(bgA2[3]) : 1 };
    if (hasBorder) node.stroke = { color: rgbArr(cs.borderTopColor), weight: bw2 };
    if (parseFloat(cs.borderRadius) > 0) node.radius = px(parseFloat(cs.borderTopLeftRadius));
    if (shadow) node.shadow = shadow;
    if (bgImg) {
      const m = bgImg.match(/url\(["']?(.+?)["']?\)/);
      if (m) node.bgImage = { src: m[1], size: cs.backgroundSize, pos: cs.backgroundPosition, repeat: cs.backgroundRepeat };
    }
    if (cs.overflow === "hidden") node.clips = true;
    return node;
  }

  const body = root || doc.body;
  const br = body.getBoundingClientRect();
  const tree = await walk(body, br);
  const bcs = win.getComputedStyle(body);
  const stateName = new URLSearchParams(win.location.search).get("state");
  const out = { width: Math.round(br.width), height: Math.round(br.height), name: stateName || doc.title || "ui", tree };
  const bga = (bcs.backgroundColor || "").match(/[\d.]+/g);
  if (bga) out.bgColor = [bga[0] / 255, bga[1] / 255, bga[2] / 255];
  return out;
};
