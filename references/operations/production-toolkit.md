# Production toolkit

Load only after Gate 1 releases a named production need. Tools implement a
direction; they never invent one.

## Assets and generation

Search eligible workspace material first. Search a specific licensed web source
only for a named unmet role. Use generation only after both routes are recorded
in `ASSET_LEDGER.md` and the user explicitly approves the remaining role.

For every selected asset record provenance, factual/interpretive status, role,
crop rule, and any composite rule. Generated imagery is interpretive, cannot be
factual evidence, and cannot become the hero unless Gate 1 contains explicit
user approval for that exception.

Use authored SVG only when a vector interpretation genuinely serves the role
better than credible source material. Do not draw a complex real object in CSS
when a real asset is available.

### Generated or found image processing

A generated or found image is raw material. Before placing it, declare whether
it is factual evidence, a supporting carrier, a material field, or secondary
proof. Generation may supply only an approved interpretive role.

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
