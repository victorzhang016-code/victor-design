# Production toolkit

Load only after the image role (when an image is attached) and Gate 1 release a
named production need. Tools implement a direction; they never invent an image
role, a medium, or a visual direction.

## Assets and generation

Fill every imagery or material role through this four-rung source chain, in
order, and record each rung's outcome in `ASSET_LEDGER.md`:

1. **Local workspace material** — search eligible real material first.
2. **Licensed web source** — search only for a named unmet role.
3. **AI generation** — only after both routes are recorded as unmet and the
   user explicitly approves the remaining role.
4. **Code (CSS/SVG/HTML)** — last resort, and only for roles code can
   genuinely render: material fields, textures, grain, halftone, rules, and
   simple graphics. Never draw a complex real object in CSS/SVG when any of
   the first three rungs could supply it.

For every selected asset record provenance, factual/interpretive status, role,
crop rule, and any composite rule. Generated imagery is interpretive, cannot be
factual evidence, and cannot become the hero unless Gate 1 contains explicit
user approval for that exception.

### Generated or found image processing

A generated or found image is raw material. Before placing it, declare whether
it is factual evidence, a supporting carrier, a material field, or secondary
proof. Generation may supply only an approved interpretive role.

Show evidence and illustration images at native aspect ratio by default; crop
only with a recorded composition reason. When several versions of an asset
exist, confirm the canonical version before compositing.

For a supporting carrier:

1. isolate or crop the useful physical fragment;
2. remove the generator's accidental composition and background;
3. grade contrast, temperature, saturation, and grain into the authored field;
4. integrate real project evidence through shared contour, perspective, light,
   scale, shadow, or contact;
5. test the poster with the carrier hidden.

If hiding the carrier destroys the hierarchy, return to composition before
adding more image effects.

## Cutout and compositing

Use cutout only when isolation clarifies a released material relationship.
Preserve source pixels and object identity by default. Nest host, inserted
content, mask, shadow, and shared transforms together. An inserted screen or
image must obey its host's perspective, contour, light, and crop.

Store the unprocessed source next to the composite. For projective insertion,
record four target corners; rotation and rectangular clipping do not count as
perspective.

## HTML and Figma

For posters, create a self-contained HTML master at the target ratio. Mark text
and image roles plus any line/bar cause as required by `operations/review.md`.
Render and obtain user approval before Figma work.

Start controlled v3.1 artifacts from
`assets/html-starters/artifact-v31.html` when applicable. Keep
`data-vds-schema="v3.1"`, use `data-vds-role` for content purpose,
`data-vds-layer` for field/event/inscription/material structure,
`data-vds-cause` for surviving devices, and `data-vds-action` for at least four
concrete authored acts.

Use `scripts/render_artifact_views.py` to plan or render review views. It writes
UTF-8 JSON manifests with file hashes. Surface sets are: poster (full,
thumbnail, copy-hidden, image-hidden, bottom), graphic-text (pages, contact
sheet, reading sequence), slides (pages, contact sheet, densest, bottom), and
UI (default, long-copy, empty, error, recovery). Masters must respond to the
documented `?view=` names; the renderer does not invent missing states.

For Figma delivery, read the required Figma skills before using its APIs. Build
native named text, fields, masks, rules, and structural geometry; retain raster
images as replaceable fills. Then follow `figma-fidelity.md`. Keep custom-font
sources, isolated material renders, perspective sources, and transform
parameters beside the composite. Never present one flattened capture as
editable design.

## Technical checks

Run `validate_design_execution.py` against the delivery directory and
`audit_html_design.py` against HTML masters. Resolve failures, then reconcile
warnings in the human visual review. For Figma translation, use
`compare_renders.py` on equal-size exports to expose placement or material
drift. None of these scripts can approve taste.
