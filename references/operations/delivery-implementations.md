# Delivery implementations

This is the execution route for Gate 3 deliverables. Visual approval and
editable structure are separate acceptance criteria; neither silently replaces
the other.

## Route detection

1. **Figma UI:** use bundled DOM Migrate v3 first. It is offline, local, free,
   and versioned. Use another importer only when the approved source is outside
   the controlled VDS HTML contract.
2. **Figma poster/flat work:** keep the plugin's legacy visual route, then run
   the poster repair checklist.
3. **PPTX:** author with native slide objects and verify with a rendered export.
4. **Interactive HTML:** retain a static query route for every review state.

Do not ship a flattened screenshot as an editable deliverable.

## Figma UI pipeline — DOM Migrate v3

### 1. Prepare the master

- Set the exact viewport and a stable `?state=<name>` route per state.
- Waitable UI must expose `data-ui-ready="true"`, or provide a custom ready
  expression to the capture CLI.
- Use semantic flex/grid, gap, padding, CSS variables, and the annotations in
  `references/adapters/product-ui.md`.
- Mark only the smallest unsupported effect with `data-figma-rasterize`.

### 2. Capture once

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

The command waits for fonts, images, UI readiness, and stable animation frames,
then emits the v3 IR, a golden PNG per state, a compatibility report, and local
effect/image assets. A repeated capture must produce identical structural and
image hashes under the same source and environment.

### 3. Preflight in Figma

Import `manifest.json`, load `dom-migrate.v3.json`, and review:

- target page and screen count;
- exact font family/weight availability;
- component, variable, text-style, and raster-layer counts;
- warnings and hard errors.

Strict v3 blocks illegal sizing, malformed IR, and unsupported packages.
Missing fonts or weights remain visible warnings with deterministic
same-family/global fallback so a delivery can still complete. v2 UI packages
show a deprecation warning. Flat/poster packages stay on the legacy route.

### 4. Build and audit

Build into a dedicated `DOM Migrate v3 QA` page. Preserve any failed baseline
frames as evidence. The generator creates fixed screen roots, native flex/grid
containers, legal axis sizing, semantic spacing/alignment wrappers, vectors,
replaceable images, components/instances, scoped local variables, and text
styles. Download the Figma geometry audit from the plugin.

### 5. Verify

- Compare each Figma export with its golden at equal scale.
- Require ≤1 px non-text geometry error and ≤2 px text-bound error.
- Require identical wrapping, whole-frame SSIM ≥0.98, and image SSIM ≥0.995.
- Audit zero missing fonts, illegal sizing pairs, anonymous spacers, duplicate
  sibling names, and visible off-canvas inactive state nodes.
- Replace title, button, and body copy with longer strings. Confirm Auto Layout
  redistributes space without overlap or accidental clipping.
- Confirm component instance properties, variable bindings, text styles, and
  semantic names.

## Minimal raster effect layers

Gradients, filters, masks, blends, complex shadows, and pseudo-elements may not
have a native Figma equivalent. Rasterize only the isolated visual effect, never
the UI structure or text. Keep the layer named by purpose and retain the reason
in the compatibility report. Verify z-order first when an effect diff grows.

## PPTX pipeline

Rebuild with native slide shapes, text, and replaceable images. Render with
LibreOffice or PowerPoint and compare page by page. Record font substitution,
template choice, and remaining non-editable effects.

## Interactive HTML pipeline

Every declared state must be reachable by click/key and independently rendered.
Motion is functional, brief, and reduced-motion safe. Run a full state click-
through and console-error check before release.
