# Worked case — "After the Night Shift" poster (03A)

A worked decomposition of an approved image-carried poster, paired with its
failed unattended counterpart from the same brief. Load this when
`Image role: base` + poster/key visual is active and no stronger user
benchmark exists. Learn the method, not the surface: do not reuse its
palette, fonts, or motifs on an unrelated subject.

## The brief

One photograph: a cold blue corridor ending in a warm domestic lamp, an
exhausted person seated beneath it after a night shift. Approved role:
`base`. Deliverable: 1440×2560 (9:16) phone poster, flattened PNG accepted.
Mood confirmed by the user: fatigue held by warmth.

## What the approved version (03A) does

**Canvas.** Full-bleed 9:16. The photograph fills the entire canvas; every
treatment layer spans edge to edge. There is no window, frame, or margin —
the image *is* the field after decisive processing.

**Type system — six levels, five anchor regions, one reading loop:**

| Level | Content | Treatment | Anchor |
| --- | --- | --- | --- |
| 1. Display title | 夜班之后 | serif, ~176px, per-character positioning, cyan/red misregistration shadow | top-left, over the cold zone |
| 2. Subtitle | AFTER THE NIGHT SHIFT | ~37px, tracked .15em, same misregistration | under title |
| 3. Annotation | A VISUAL STUDY OF FATIGUE, HOME, AND LIGHT. | ~24px caps | top-right |
| 4. Support line | two-line English caption | ~29px | mid-left |
| 5. Logline | 夜班散场以后，回家的走廊显得格外漫长。 | serif ~36px | lower-mid-left |
| 6. Body | 回到家，他在灯下坐了很久。暖黄的光落在肩上… | serif ~48px, right-aligned | bottom-right, over the reflection zone |

Every block sits on the image event it comments on (title on cold, body on
reflection), carries a text-shadow to detach from the photo, and the eye
travels a loop: top-left → top-right → mid-left → bottom-right.

**Craft family — misregistered print / film development, ~12 layers, all
same-source:** three-stop multiply grading; vignette; cyan and red plate
duplicates of the person region offset ±18–19px with hue-rotate; a
high-exposure development layer; a `scaleY(-1)` floor-reflection scan with
its own ink plates; coarse halftone dots (22px radial-gradient matrix,
elliptical mask) inside the lamp glow; blurred warm print glow; paper-fiber
repeating gradient; feTurbulence grain. The misregistration reaches the
title itself — material enters the type layer.

**Key principle demonstrated:** density comes from multiple operations on the
same photograph — crop, grading, plate, exposure, reflection, halftone — not
from ornaments placed beside it. Standalone hairlines, tags, and flat color
chips from the first internal direction were removed once same-source density
arrived.

## What the unattended version did — and why it failed

Same source photo, same skill, no human in the loop:

- **3 type levels** (title, one proposition sentence, credit) at **3 anchors**
  — no subtitle, annotation, logline, or bilingual system. The brief even
  pre-excluded bilingual copy, and the thin-brief playbook was never invoked.
- **Arbitrary polygon window.** The warm zone was clipped into a floating
  quadrilateral (`polygon(33% 24%, 90% 17%, 95% 83%, 29% 88%)`) over a
  darkened 3:4 canvas. The clip's anchors derive from nothing in the photo's
  perspective — decoration masquerading as structure.
- **Effects, not a craft family.** ~10 layers of glow, shadow, gradient, and
  grain, all in the "light and shadow" genre. No plate, no halftone, no
  reflection — no named material system.
- **Paperwork full marks.** 14 declared `data-vds-action`s, both validators
  PASS, review self-graded "no P0/P1". Declaration count certified nothing.

## Side-by-side

| Measure | Failed run | Approved 03A |
| --- | --- | --- |
| Type levels | 3 | 6 |
| Text anchor regions | 3 | 5 |
| Operations inside the image | 1 (darken filter) | 6+ (crop, grading, plates, exposure, reflection, halftone) |
| Canvas | 3:4, darkened margins + polygon window | 9:16 full-bleed |
| Material | isolated light effects | named craft family reaching the type layer |
| Benchmark used | none ("no prior outcome inspected") | 5 user-supplied film/print references, decomposed |

## Transferable lessons

1. Build the type system to five-plus levels by drafting interpretive copy —
   thin briefs are a production task, not permission for austerity.
2. Anchor text blocks to image events and arrange them as a reading loop.
3. Prefer the third same-source operation over the first new ornament.
4. Name one craft family and let it touch every layer, including the type.
5. Full-bleed is the default for an approved base image; a window or margin
   must argue its physical cause.
6. A benchmark is mandatory: user references when given; when not, **view**
   the built-in boards (`assets/benchmarks/poster-board-1.png` … `-4.png`)
   alongside this case and `references/style-evidence.md`. The leap documented
   in this case came from looking at the references that are now those
   boards — not from reading rules.
