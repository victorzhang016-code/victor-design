# DOM Migrate v3

DOM Migrate v3 migrates controlled Victor Design System UI HTML into native,
editable Figma structures. Its strict guarantee is intentionally narrow:
browser fidelity at the declared viewport, resilient Auto Layout, native text,
vectors, replaceable images, components, local variables, and text styles.

It does not claim lossless conversion for arbitrary websites. Poster/flat
packages remain supported through the legacy visual route.

## Quick start

```bash
cd assets/figma-plugins/dom-migrate
npm install
npm run build
npm run capture -- \
  --input /absolute/path/to/master.html \
  --output /absolute/path/to/export \
  --states view,sheet,profile,quiet \
  --viewport 390x844
```

The capture command waits for the DOM, fonts, images, two animation frames,
and the optional UI-ready signal before writing:

- `dom-migrate.v3.json` — versioned IR and embedded image/effect assets;
- `goldens/<state>.png` — deterministic browser truth per state;
- `compatibility-report.json` — fonts, warnings, hard errors, raster layers.

To use a custom ready signal:

```bash
npm run capture -- --input master.html --output export \
  --ready "window.__UI_READY__ === true"
```

Import `manifest.json` in Figma Desktop via **Plugins → Development → Import
plugin from manifest**. Load `dom-migrate.v3.json`, review preflight, and build
to the default `DOM Migrate v3 QA` page. The manifest ID is unchanged, so this
overwrites an earlier local installation instead of creating a second plugin.

## Controlled HTML contract

Automatic inference uses CSSOM rule matching, `getComputedStyle`, DOM geometry,
and clipping. Add annotations when intent is ambiguous:

```html
<main data-figma-root data-figma-name="Screen">
  <button
    data-figma-name="Action / Continue"
    data-figma-width="fill"
    data-figma-height="fixed"
    data-figma-component="Button/Primary">
    <span
      data-figma-property="Label:text"
      data-figma-text-style="Body/Medium">Continue</span>
  </button>
</main>
```

Supported annotations:

- `data-figma-name`
- `data-figma-width="fixed|hug|fill"`
- `data-figma-height="fixed|hug|fill"`
- `data-figma-component="Component/Name"`
- `data-figma-property="Label:text"`
- `data-figma-text-style="Body/Medium"`
- `data-figma-rasterize="reason"`
- `data-figma-ignore`

Every state must be reachable as `?state=<name>`. Hidden, transparent, and
fully clipped inactive state nodes are excluded by default.

## What v3 changes

The implementation is TypeScript in three layers:

1. `src/capture/` — browser capture using real CSSOM matches and final geometry;
2. `src/planner/` — legal Figma sizing and semantic wrapper planning;
3. `src/plugin/` — variables/styles/components and native Figma generation.

The repository commits prebuilt `code.js` and `snapshot-ui.js`, so installation
does not require a local build.

Important invariants:

- fixed parents are sized before Fill/Grow children;
- `layoutSizingHorizontal/Vertical` is the final sizing interface;
- a Hug axis cannot contain a Fill/Grow child on that axis;
- CSS gap becomes `itemSpacing`; no anonymous pixel spacer rectangles exist;
- `margin-top:auto` becomes one `Layout / Flexible Space` grow frame;
- cross-axis centering uses a named alignment wrapper;
- CSS Grid becomes Figma `GRID`; unsupported tracks are reported;
- single-line text hugs; wrapped text uses fixed/fill width with auto height;
- no font-width compensation is added;
- missing fonts or weights use a visible, reportable fallback so the import remains buildable; exact family/weight matches are always preferred;
- repeated exact semantic subtrees and explicitly marked components produce
  components/instances; marked text becomes an instance text property;
- CSS custom properties become scoped local variables; repeated type specs
  become local text styles.

## Effects and images

Image elements and leaf CSS background images are captured at their exact
visible crop and become replaceable Figma image fills. Inline SVG stays vector.

Use `data-figma-rasterize` for an intentionally minimal effect layer. Gradients,
filters, blends, masks, and pseudo-elements that cannot be represented natively
are listed in the compatibility report. The UI structure and text remain native;
only the smallest declared effect layer is rasterized.

## Compatibility routes

- `schemaVersion: 3` — strict production UI route;
- v2 packages with `page.tree` — deprecated compatibility route;
- flat/poster packages with `page.nodes` — legacy visual route.

Legacy inputs still import, but they do not receive the v3 structural guarantee.
The old Python packager remains in the folder only for those packages.

## Development and verification

```bash
npm run typecheck
npm test
node test-mock.js code.js tests/fixtures/v3-package.json
```

The suite covers nested selectors, visibility, Grid, Hug/Fill invariants,
semantic flexible space, centering wrappers, strict font mapping, compatibility
routing, deterministic Playwright capture, and Figma API constraints. The mock
auto-attaches newly created nodes like Figma and fails if a build produces zero
top-level nodes.

Release QA still compares every imported state against its golden at equal
scale. Target thresholds are ≤1 px for non-text geometry, ≤2 px for text bounds,
identical line wrapping, whole-frame SSIM ≥0.98, and image-region SSIM ≥0.995.
