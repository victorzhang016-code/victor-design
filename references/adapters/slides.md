# Slides adapter

## Job and boundary

Use this adapter for a case, methodology, tutorial, pitch, research narrative,
or any task the audience must follow over time. A deck is a sequence of
decisions, not a poster divided into pages and not a portrait board exported as
landscape images.

Choose a single-canvas poster only when the user or the control layer explicitly
requests a poster/key visual. Silence about medium does not authorize that
fallback. A methodology, case, or tutorial defaults to a narrated deck.

## Form lock before concept

Record these fields in `DESIGN_CONTROL.md` before high-fidelity work:

| Field | Decision required |
| --- | --- |
| delivery form | deck, page count including cover, editable source |
| canvas and reading mode | presentation, self-read, or both |
| narrative spine | one repeatable conclusion per page and the evidence that earns it |
| cover and closing | the opening promise and the designed final residue |
| current-subject field | source cause for the background, not a remembered past surface |
| type and palette | role, current cause, rejected alternative, and exception if inherited |

Read the controlling round or product document before this declaration. Its
explicit page/state count overrides any inference made from a short creative
prompt.

## Narrative construction

Build the shortest sequence that makes the argument testable. A useful default
for a six-page case is: promise → decisive evidence → diagnosis → method →
reusable procedure → honest boundary or closing. Change this when the material
demands another order; never fill a fixed template.

For every page, state:

- the conclusion a reader can repeat after a quick glance;
- the evidence, example, mechanism, or decision that proves it;
- why this page must follow the prior page;
- its first attention and the one thing to remove if density rises.

Give each page a distinct job and a shared world. Consistency comes from a
caused field, type roles, and semantic color; it does not require identical
headers, bars, cards, or one repeated poster composition.

## Palette and material test

Derive the field from the current case's carrier: report, interface, specimen,
place, tool, or measured state. Test a neutral field, a dark field, and any
material field against the actual evidence before selecting one. Write why the
winner helps this subject and why the other two fail.

Warm paper, archive grain, serif editoriality, black launch fields, and a
previous round's palette are all hypotheses. They become valid only when the
current material calls for them. Do not use "academic", "editorial", or
"restrained" as a color or material cause.

## Craft floor and pilot pages

This adapter's warnings against exhibition-board density and decorative
structures guard against *uncaused* clutter; they do not lower the density
anchor. A slide page must carry, beyond title and body, at least two crafted
layers from `workflow/density-and-care.md` — a treated field, a made dominant
event, composed evidence, factual inscriptions, or precise furniture. A page
that is only a heading, two sentences, and an unprocessed image has failed
the craft floor even when it passes every refusal.

Never batch-produce a full deck before approval of pilot pages. Build one to
three representative pages first — the cover, the densest evidence page, and
the darkest or most unusual page — at full craft, and obtain user approval of
those renders. The approved pilots become the per-type reference for the
remaining pages.

## Typography and reading gates

Choose clear sans-serif by default. Serif, mono, display distortion, tracking,
or all-caps must name a current source voice and survive a final-scale render.
"Academic" alone is not a serif rationale.

For a 1920×1080 HTML deck, meet these hard floors unless the control layer
states another canvas and records an equivalent scaled floor:

- conclusion/title: 56 px or larger;
- required evidence/body: 23 px or larger;
- labels, captions, and source lines: 16 px or larger;
- Chinese body and conclusion tracking: `0`; Chinese kickers may use at most
  `0.08em`; wider tracking is reserved for short Latin uppercase labels.

Fix information architecture, copy, or page count when text does not fit. Do
not shrink type to preserve a visual treatment. Inspect the actual Chinese and
Latin copy at 100% and at the intended voting/reading scale; reject clipped,
orphaned, overtracked, or low-contrast text.

## Build and release

1. Make low-fidelity page thumbnails with real copy lengths before decoration.
2. Build an editable HTML/CSS/SVG, web-slide, or native presentation master.
3. Export exactly one PNG per declared page into `deliverables/`.
4. Inspect every page full size, at thumbnail scale, and as a sequence.
5. Verify page count, no clipping/scrollbars, conclusion-first reading, source
   traceability, and a designed closing beat before release.

Use `operations/review.md` for the cross-page veto. A final deck must work as a
story and as six individual images in a side-by-side or carousel review.
