// dom-migrate snapshot — canonical browser-side capture.
// Paste into the approved master's page context (or serve via snapshot-runner.html).
// Captures every `section.page` (or the single `.active` one) into a raw JSON
// structure. Images are referenced by path; package.py embeds them later.
//
// Returns: Promise<pages[]> where each page is
//   { width, height, name, bgColor?|bgSrc?, nodes: [...] }
// node types: text (with styled spans), image, bgimage, shape.
window.domMigrateSnapshotAll = async function (root) {
  const doc = (root && root.ownerDocument) || document;
  const win = doc.defaultView;
  const px = (v) => Math.round(v * 100) / 100;
  const INLINE = new Set(["B", "STRONG", "SPAN", "EM", "I", "A", "SMALL"]);

  function rgbArr(c) { const m = c.match(/[\d.]+/g) || [0, 0, 0]; return [m[0] / 255, m[1] / 255, m[2] / 255]; }
  function bgUrlOf(cs) {
    const bi = cs.backgroundImage || "";
    if (!bi.startsWith("url(")) return null;
    return bi.slice(4).replace(/^["']|["']\)?$/g, "").replace(/\)$/, "");
  }

  async function snap(page) {
    const pr = page.getBoundingClientRect();
    const rel = (r) => ({ x: px(r.left - pr.left), y: px(r.top - pr.top), w: px(r.width), h: px(r.height) });
    const nodes = [];

    async function walk(el) {
      if (!(el instanceof win.Element)) return;
      const cs = win.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      const r = el.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5) return;
      if (el.tagName === "IMG") { nodes.push({ type: "image", ...rel(r), src: el.getAttribute("src") }); return; }

      // own background/border first (stays below text in z-order)
      const bgA = (cs.backgroundColor || "").match(/[\d.]+/g);
      const hasBg = bgA && bgA.length >= 3 && (bgA.length === 3 || parseFloat(bgA[3]) > 0.02);
      const bwT = parseFloat(cs.borderTopWidth) || 0;
      const bwR = parseFloat(cs.borderRightWidth) || 0;
      const bwB = parseFloat(cs.borderBottomWidth) || 0;
      const bwL = parseFloat(cs.borderLeftWidth) || 0;
      const topOnly = bwT > 0 && bwR === 0 && bwB === 0 && bwL === 0 && cs.borderTopStyle !== "none";
      const fullBorder = bwT > 0 && !topOnly && cs.borderTopStyle !== "none";
      if ((hasBg || fullBorder) && !["BODY", "HTML"].includes(el.tagName)) {
        const node = { type: "shape", ...rel(r), radius: parseFloat(cs.borderRadius) || 0 };
        if (hasBg) node.fill = { color: rgbArr(cs.backgroundColor), opacity: bgA.length === 4 ? parseFloat(bgA[3]) : 1 };
        if (fullBorder) {
          const bc = (cs.borderTopColor || "").match(/[\d.]+/g) || [0, 0, 0];
          node.stroke = { color: rgbArr(cs.borderTopColor), weight: bwT, opacity: bc.length === 4 ? parseFloat(bc[3]) : 1 };
        }
        nodes.push(node);
      }
      if (topOnly) {
        // a CSS border-top is a hairline, not a box: emit a 1px-tall fill rect,
        // otherwise the importer draws a full rectangle outline around the block
        const rr = rel(r);
        const bc = (cs.borderTopColor || "").match(/[\d.]+/g) || [0, 0, 0];
        nodes.push({ type: "shape", x: rr.x, y: rr.y, w: rr.w, h: Math.max(bwT, 1),
          fill: { color: rgbArr(cs.borderTopColor), opacity: bc.length === 4 ? parseFloat(bc[3]) : 1 } });
      }
      const bgUrl = bgUrlOf(cs);
      if (bgUrl && !["BODY", "HTML"].includes(el.tagName)) {
        nodes.push({ type: "bgimage", ...rel(r), src: bgUrl, repeat: cs.backgroundRepeat });
      }

      const hasOwnText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (hasOwnText) {
        const norm = (t) => t.replace(/[^\S\n]+/g, " ");
        let rebuilt = "";
        const spans = [];
        function collect(node) {
          if (node.nodeType === 3) {
            let t = norm(node.textContent);
            if (rebuilt === "" || rebuilt.endsWith("\n")) t = t.replace(/^[ \t]+/, "");
            rebuilt += t; return;
          }
          if (node.nodeType === 1) {
            if (node.tagName === "BR") { rebuilt = rebuilt.replace(/[ \t]+$/, "") + "\n"; return; }
            const before = rebuilt.length;
            [...node.childNodes].forEach(collect);
            const ncs = win.getComputedStyle(node);
            const bold = parseInt(ncs.fontWeight, 10) >= 600;
            if (INLINE.has(node.tagName) && rebuilt.length > before && (bold || ncs.color !== cs.color))
              spans.push({ start: before, end: rebuilt.length, bold, color: rgbArr(ncs.color) });
          }
        }
        [...el.childNodes].forEach(collect);
        rebuilt = rebuilt.replace(/[ \t]+$/, "");
        if (rebuilt.trim()) {
          const fams = (cs.fontFamily || "").split(",").map(s => s.trim().replace(/["']/g, ""));
          const w = parseInt(cs.fontWeight, 10) || 400;
          const rr = rel(r);
          const fs0 = parseFloat(cs.fontSize);
          // single-line text: Figma's font metrics run wider than the browser's;
          // a shrink-to-fit box would wrap, so give the line 12% slack
          if (rr.h < fs0 * 2) rr.w = Math.min(rr.w * 1.12, pr.width - rr.x);
          nodes.push({
            type: "text", ...rr, text: rebuilt,
            fontFamily: fams[0] || "Microsoft YaHei",
            fontStyle: w >= 800 ? "Black" : w >= 600 ? "Bold" : w <= 300 ? "Light" : "Regular",
            fontSize: parseFloat(cs.fontSize),
            lineHeight: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight),
            letterSpacing: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing),
            color: rgbArr(cs.color), align: cs.textAlign, spans,
          });
          return; // text blocks don't recurse
        }
      }
      for (const c of el.children) await walk(c);
    }

    const pcs = win.getComputedStyle(page);
    const out = { width: Math.round(pr.width), height: Math.round(pr.height), name: page.id || "page", nodes: [] };
    const pbg = bgUrlOf(pcs);
    if (pbg) out.bgSrc = pbg;
    else { const bga = (pcs.backgroundColor || "").match(/[\d.]+/g); if (bga) out.bgColor = [bga[0] / 255, bga[1] / 255, bga[2] / 255]; }
    for (const c of page.children) await walk(c);
    out.nodes = nodes;
    // effect-layer detection: pseudo-element backgrounds and CSS filters are
    // invisible to this snapshot — flag them so the packager can pre-render
    // alpha-PNG overlays (see delivery-implementations.md "Effect layers")
    const fx = [];
    [page, ...page.querySelectorAll("*")].forEach((el) => {
      const pre = win.getComputedStyle(el, "::before").backgroundImage;
      const post = win.getComputedStyle(el, "::after").backgroundImage;
      const flt = win.getComputedStyle(el).filter;
      const tag = el.id ? "#" + el.id : el.className && el.className.baseVal === undefined ? "." + String(el.className).split(" ")[0] : el.tagName;
      if (pre && pre !== "none") fx.push(`${tag} ::before background`);
      if (post && post !== "none") fx.push(`${tag} ::after background`);
      if (flt && flt !== "none") fx.push(`${tag} filter:${flt}`);
    });
    if (fx.length) out.fxWarnings = fx;
    return out;
  }

  const pages = root ? [root] : [...doc.querySelectorAll("section.page.active")].concat(
    doc.querySelectorAll("section.page.active").length ? [] : [...doc.querySelectorAll("section.page")]);
  const result = [];
  for (const p of pages) result.push(await snap(p));
  return result;
};
