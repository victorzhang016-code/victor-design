# Product/UI adapter

## Job

Make the next task, current state, and recovery path unmistakable while keeping
the authored visual world intact. UI is a state system, not a decorated static
screen.

## Product hardening

- one clear primary action per action group;
- visible current state, progress, result, and recovery where risk warrants it;
- readable copy, labels, keyboard focus, contrast, and reduced motion;
- responsive recomposition instead of miniature desktop panels;
- honest separation of user input, evidence, inference, and generated output;
- both outcomes of every decision, with a path onward or back.

Every declared state must render independently as `?state=<name>` for golden
capture. Waiting, empty, error, accept, and decline states receive the same
typographic and interaction care as the happy path.

## DOM Migrate v3 authoring contract

Strict editable-Figma delivery is guaranteed only for controlled VDS HTML.
Write semantic DOM and CSS first, then annotate ambiguity:

- `data-figma-name` for stable layer naming;
- `data-figma-width` / `data-figma-height` with `fixed|hug|fill` when browser
  geometry alone cannot express intent;
- `data-figma-component` for product components;
- `data-figma-property="Name:text"` for editable instance copy;
- `data-figma-text-style` for named typography;
- `data-figma-rasterize` only on the smallest unsupported effect layer;
- `data-figma-ignore` for non-design DOM.

Use real flex/grid semantics, authored `gap` and padding, and CSS custom
properties for reusable color/spacing/radius values. Do not introduce empty
DOM elements as visual spacers. `margin-top:auto` is allowed for a single grow
region. Hidden and inactive state nodes must be genuinely invisible or clipped.

Font family and numeric weight are part of the source contract. The importer
uses the exact family and weight when available, then the nearest same-family
face, and finally an explicitly reported global fallback so the job remains
buildable. Fallbacks are warnings and are recorded in the compatibility report;
they must never be silent.

## Figma acceptance

- one fixed-size root frame per state;
- native Auto Layout/Grid for the primary structure;
- valid Hug/Fill/Fixed on both axes after long-copy replacement;
- no anonymous spacer rectangles, hidden-state pollution, or visible overflow;
- components/instances for explicitly marked or exactly repeated semantics;
- local variables and text styles where the source defines reusable tokens;
- vectors stay vectors; images remain replaceable image fills;
- unsupported CSS is isolated as a named minimal raster effect layer;
- semantic, unique layer names; no `Frame 127` debris;
- equal-scale golden comparison passes for every state.

Production thresholds: ≤1 px non-text geometry error, ≤2 px text-bound error,
matching line breaks, whole-frame SSIM ≥0.98, and image-region SSIM ≥0.995.
Replace titles, body copy, and buttons with longer text before release; the
result must not overlap, clip unexpectedly, or break hierarchy.
