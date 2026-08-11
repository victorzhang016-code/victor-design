# DOM Migrate — HTML → editable Figma

Migrates an approved HTML master into native, editable Figma frames. This is a
migration, not a reconstruction: text becomes TEXT nodes with styled ranges,
images become replaceable IMAGE fills, shapes keep fills/strokes/radius.

## Pipeline

1. **Snapshot** — in the approved master's directory, copy
   `snapshot-runner.html` beside the master and point its `src` at the master
   file. Then run (headless Chrome):

   ```bash
   chrome --headless=new --allow-file-access-from-files \
     --virtual-time-budget=15000 --dump-dom snapshot-runner.html > dump.html
   ```

   Extract the `<pre id="out">` JSON into `pages-raw.json`.
   (Single-page masters without `section.page` wrappers: snapshot.js captures
   `section.page` elements; wrap your pages accordingly.)

2. **Package** — embed and dedupe the images:

   ```bash
   python package.py pages-raw.json --base <master-dir> -o figma-package.json
   ```

   If the master uses data-URI SVG backgrounds (e.g. repeating decorative
   bands), the packager writes `*-svg-jobs.json`; rasterize each at its target
   pixel size and rerun with `--svg-png key=path.png`.

3. **Import** — Figma desktop → Plugins → Development → *Import plugin from
   manifest* → select `manifest.json` in this folder. Then run **DOM Migrate**,
   pick `figma-package.json`, and build. One frame per page/state, side by
   side.

4. **Repair pass** (mandatory, per `operations/figma-fidelity.md`) — rename
   layers semantically, verify fonts, rebuild anything that arrived flattened,
   then export each frame and compare against the approved render at equal
   scale (`scripts/compare_renders.py`).

## Testing

`test-mock.js` runs code.js end-to-end in Node against a package file, with a
mock Figma API that enforces the real constraints (no component nesting,
ABSOLUTE positioning only inside auto-layout parents, text font loading
order). Run it after every plugin change:

```bash
node test-mock.js code.js <package.json>
```

## What it captures

- text blocks: content, family/weight/size/line-height/tracking/color/align,
  inline bold & color spans as character ranges, `<br>` as line breaks
- images: element bounds + file reference (embedded during packaging)
- shapes: background fills (with opacity), borders, corner radius
- page background: solid color or image

## Known limits

- Absolutely-positioned nodes, not auto-layout. The output is editable, not
  responsive.
- CSS filters, blends, gradients, and complex masks are not migrated — the
  repair pass owns them.
- Element backgrounds that sit on text blocks are captured as separate shape
  nodes (correct z-order), but box-shadows are not migrated.
- Fonts must exist in the Figma environment; the plugin falls back
  (family → Microsoft YaHei → Inter) and the repair pass must catch it.

## UI structural mode (production-grade)

For product UI, use `snapshot-ui.js` + `snapshot-runner-ui.html` instead of
the flat snapshot. The runner takes the master with an explicit state query:

```bash
chrome --headless=new --allow-file-access-from-files --virtual-time-budget=15000 \
  --dump-dom "snapshot-runner-ui.html?src=master.html?state=view" > dump-view.html
```

Run once per state and merge the outputs into one pages array before
packaging. In this mode the plugin builds:

- **auto-layout frames** — flex/grid containers map to HORIZONTAL/VERTICAL
  layout mode with gap and padding; block containers with multiple children
  become vertical auto-layout; `margin-top:auto` becomes SPACE_BETWEEN;
  other child margins become named spacer nodes;
- **chips/buttons as frames** — a text element with padding or fill becomes
  an auto-layout frame wrapping a text node, not a flat label;
- **components** — exact-duplicate subtrees (status bars, indicators,
  repeated chips) become one component plus instances across state frames;
- **icons as vectors** — inline SVG via `createNodeFromSvg`;
- **overlays** — absolutely-positioned layers (sheets, backdrops, status
  bars) become `layoutPositioning = ABSOLUTE` inside the screen frame.

Still not production-complete without the repair pass: margins become spacer
nodes (Figma has no margins), `object-position` crops are approximate,
texts inside auto-layout stretch by block rules, and gradients/blends are not
migrated. Verify against the approved render per state and fix in Figma.

