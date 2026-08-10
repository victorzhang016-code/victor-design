# Figma fidelity translation

## Contents

- [Principle](#principle)
- [Preflight risk inventory](#preflight-risk-inventory)
- [Typography](#typography)
- [Complex material effects](#complex-material-effects)
- [Perspective and surface contact](#perspective-and-surface-contact)
- [Layer strategy](#layer-strategy)
- [Equal-scale comparison](#equal-scale-comparison)
- [Gate 3 release](#gate-3-release)

## Principle

Treat Figma delivery as translation of an approved golden source, not a redesign
opportunity. Structural editability and visual fidelity are separate
requirements; satisfy both deliberately.

Before any write, load the required Figma skills and inspect the target file.
Work incrementally and capture a render after every high-risk translation.

## Preflight risk inventory

Create a compact mapping before rebuilding:

| Approved element | Fidelity risk | Figma representation | Source retained | Acceptance crop |
| --- | --- | --- | --- | --- |
| title | custom font / outline | native text or exact vector outlines | font file + hidden text fallback | title |
| material field | mask / blend / repeating gradient | isolated replaceable raster + editable source geometry | CSS/source asset | background |
| inserted screen | projective transform | warped replaceable image | unwarped image + four points | screen |

Inventory at minimum:

- custom or unavailable fonts;
- CSS masks, repeating gradients, blend modes, filters, and pseudo-elements;
- perspective, non-rectangular clipping, convex glass, or surface contact;
- image crop and focal point;
- layers whose visual result depends on stacking order.

## Typography

Use the exact approved font when it is available. Do not silently replace a
display face with a merely similar font: title silhouette, spacing, and
counterforms are part of the composition.

When an approved custom font is unavailable in connected Figma:

1. generate exact editable vector outlines from the project's own font file;
2. place them against the approved pixel bounds;
3. retain a clearly named hidden native-text fallback for copy recovery;
4. disclose the outline strategy in the node audit.

Use substitution only after showing the visual variance and receiving explicit
approval.

## Complex material effects

Figma imports often flatten or lose CSS masks, repeating gradients, phosphor
patterns, pseudo-elements, and blend interactions. Do not approximate them with
large dull rectangles.

For an exact complex material layer:

1. isolate the effect on a transparent canvas at the approved dimensions;
2. render it from the approved HTML/CSS;
3. import it as a named replaceable image fill;
4. retain independent editable source geometry for important arcs, beams,
   masks, or rules when useful;
5. ensure the full poster is not flattened.

Keep text, layout fields, rules, semantic color events, and simple geometry
native. Rasterize the smallest material region that preserves the effect.

## Perspective and surface contact

Rotation, rectangular clipping, and a slight skew are not projective
perspective.

For content inserted into a screen, paper, wall, or object:

1. identify the four physical target corners;
2. warp the source image through those four points;
3. transform interface chrome, content, scanlines, and glass shading on the
   same plane;
4. use an alpha mask that follows the target contour;
5. keep the unwarped source hidden beside the composite;
6. record the output size and four-point parameters in the comparison record.

Verify that dominant horizontal and vertical lines share the host's vanishing
behavior. Check the contact at every corner, not only the center.

Use `assets/figma-plugins/vertex-perspective/` or a local deterministic
four-point warp when the Figma API cannot express the projective transform.

## Layer strategy

Use named native nodes for:

- title/body text when the exact font is available;
- canvas fields, tape fields, rules, rays, ticks, masks, color facets, and
  interaction geometry;
- replaceable image frames;
- hidden recovery/source layers.

Use precise names such as:

- `Image / Real UI / Perspective Composite / Replaceable`
- `Editable Source / Real UI / Unwarped`
- `Surface / CRT Composite / Exact Approved Texture`
- `Editable Copy / Title / Font Fallback`

Do not claim editable delivery when the poster is one flattened screenshot.

## Equal-scale comparison

Compare the approved HTML render and Figma render at identical dimensions:

1. full poster;
2. thumbnail;
3. title crop;
4. material/background crop;
5. perspective composite crop;
6. any user-identified failure area.

Use visual inspection first. Use pixel bounds and regional image statistics to
confirm placement, not to certify taste. `scripts/compare_renders.py` can create
a side-by-side/difference image and report per-channel MAE/RMS.

Check:

- title and major copy bounds;
- line breaks and font silhouette;
- crop, scale, and focal point;
- material fade, arc, beam, grain, and blend behavior;
- image-plane corner contact and line slope;
- visible fallbacks, duplicated source layers, and overflow.

## Gate 3 release

Release only when:

- the current Figma screenshot comes from the latest node state;
- no unapproved font substitution remains visible;
- no old/unwarped duplicate remains visible;
- no visible descendant leaves the master frame unintentionally;
- the comparison record names any remaining P2/P3 variance;
- the user has reviewed the corrected render.

A user rejection reopens Gate 3 immediately. Update the golden comparison and
fix the original failure path before re-releasing it.
