# Product/UI adapter

If an image is attached, resolve `workflow/image-role-routing.md` before this
adapter. A project-evidence or supporting image may enter a declared UI slot;
an approved reference image remains out of the product surface by default. A
base image is allowed only when the UI brief explicitly defines it as the
surface background or hero content.

## Job

Make the next task, current state, and recovery path unmistakable while keeping
the authored visual world intact. UI is a state system, not a decorated static
screen.

Apply the cross-carrier theme and reference workflow, then control richness by
task efficiency. Use adjacent human-made product, data, editorial, or immersive
interface references. Translate their hierarchy and care into states and
feedback; never turn an operational surface into a poster.

The benchmark obligation in `workflow/density-and-care.md` applies here too:
when the user supplies no references, calibrate against the built-in base.
This carrier's own density sources are the brand field, data visualization,
state feedback, and recovery surfaces.

Review two densities together:

- **functional density:** task, information, action, status, feedback, and
  recovery are complete without redundant controls;
- **aesthetic completion:** brand field, typography, imagery, visualization,
  motion, material, and state transitions receive authored treatment.

High visual density is most useful in brand entrances, immersive content,
empty states, data stories, and decisive completion states. Forms, settings,
errors, and recovery surfaces remain calm; their completion appears through
hierarchy, state clarity, feedback, spacing, and precise details.

## Product hardening

- one clear primary action per action group;
- visible current state, progress, result, and recovery where risk warrants it;
- readable copy, labels, keyboard focus, contrast, and reduced motion;
- responsive recomposition instead of miniature desktop panels;
- honest separation of user input, evidence, inference, and generated output;
- both outcomes of every decision, with a path onward or back.

Icons must communicate a function, state, category, or brand meaning. Added
copy must help comprehension, decision, trust, or recovery. Do not add controls,
labels, or explanations merely to occupy space. Distinguish content as
`factual`, `interpretive draft`, or `decorative/semantic`; UI may not invent a
feature, metric, or system state for visual richness.

Every declared state must render independently as `?state=<name>` for golden
capture. Waiting, empty, error, accept, and decline states receive the same
typographic and interaction care as the happy path.

## DOM Migrate v3 as a first-pass quality gate

For controlled VDS product UI, treat DOM Migrate v3 as a first-pass quality
gate: author the exact viewport states with semantic flex/grid and the
importer annotations, capture the golden package, then compare the imported
Figma states before release. A build that merely completes is not a pass.

When an AI product UI may need editable Figma delivery, author export-ready
controlled HTML from the first draft. Do not defer DOM Migrate annotations,
state routes, reusable tokens, or semantic layer names until after visual
approval; they are part of the UI's authored structure.

## DOM Migrate v3 authoring contract

Strict editable-Figma delivery is guaranteed only for controlled VDS HTML.
When editable Figma is requested or plausibly downstream, VDS must author this
contract from the first HTML draft: one `data-figma-root` with a stable name,
semantic names on meaningful layers, reusable tokens, and the annotations below
where browser geometry cannot express intent. Do not retrofit the contract
after the visual master is complete.

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

## First-pass import rules

Write the source so its intended layout is unambiguous before capture:

- Mark a full-width card, image, input, or button inside a column with
  `data-figma-width="fill"`; mark a full-height flex region with
  `data-figma-height="fill"`. This is essential for vertically centred empty,
  loading, and completion states.
- Keep centring on the parent (`justify-content` / `align-items`) and let text
  use its real `text-align`; do not imitate it with absolute coordinates.
- Keep mixed-size inline labels in source reading order with real inline
  elements. DOM Migrate preserves the order by x-position and maps their shared
  line to Figma Baseline alignment; never fake this relationship with offsets.
- Use a source `<img>` for content imagery whenever possible. DOM Migrate
  captures its visible crop at 3× device resolution into a replaceable Figma
  image fill. Keep CSS effects on a separate named effect layer.
- Use negative margins only for a documented visual overlap. Prefer gap,
  padding, and a semantic wrapper for ordinary spacing.
- Name the four most revealing states: default, overlay/sheet, information
  dense, and empty/recovery. They are the minimum first-pass visual sample.
- Before delivery, emit the strict v3 package and its goldens alongside the
  approved HTML. The Figma import is an expected output of UI work, not an
  optional later conversion.

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
