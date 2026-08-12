# Poster and key-visual adapter

## Contents

- [Job and boundary](#job-and-boundary)
- [Confirmed image-as-carrier input](#confirmed-image-as-carrier-input)
- [Content contract](#content-contract)
- [Benchmark against human-made posters](#benchmark-against-human-made-posters)
- [Asset roles and processing](#asset-roles-and-processing)
- [Typography](#typography-is-structural-imagery)
- [Direction selection](#direction-selection)
- [Material and craft family](#material-and-craft-family)
- [HTML-first master](#html-first-master)
- [Composition discipline](#composition-discipline)
- [Delivery](#delivery)

## Job and boundary

If an image is attached, resolve `workflow/image-role-routing.md` before using
this adapter. Only an approved `base` role can activate the image-as-carrier
branch below; project-evidence, supporting, and reference images keep their
declared roles.

Create one authored visual event that is memorable at distance and understood
at close range. A poster is a designed canvas, not an AI image with text
added, an exhibition board with fewer modules, a title-image-footer recipe,
or a stack of individually attractive assets.

Understand the theme and emotional pressure first, then select techniques from
a genuinely adjacent human-made poster family: film, music, exhibition,
cultural, editorial, or another task-specific category. Technique richness is
a requirement — the full method, density targets, and the playbook for thin
briefs live in `workflow/density-and-care.md` and are part of this adapter's
definition of done.

The canvas owns the hierarchy. Images, generated objects, screenshots, and
textures serve it. Hide the largest image during review: if the remaining
type, space, field, and evidence no longer form a composition, the image has
replaced the design.

## Confirmed image-as-carrier input

Only use this branch when `workflow/image-role-routing.md` records `Image role: base`
and the declared form is a poster/key visual. The common shortcut — preserve
the image as the entire canvas and add a title — is a P0 failure. A single
uploaded image by itself does not activate this branch.

When this branch is active, also read
`optional/case-night-shift-poster.md`: a worked decomposition of an approved
image-carried poster against its failed unattended counterpart. Use it as the
default benchmark when the user supplies no references.

Brief before layout — confirm or label as a proposal:

1. whether the image is the full-bleed background or the main visual subject;
2. title or orientation;
3. one concise definition, proposition, or human stake;
4. audience and viewing context;
5. output surface, canvas, and source/rights status;
6. required copy, credits, dates, or elements and the refusal list.

"PNG", "手机竖版", or "做成海报" only answers the surface. It does not approve
the title, proposition, or visual direction.

Canvas and treatment defaults:

- **Full-bleed by default.** The image fills the canvas and undergoes multiple
  same-source operations (crop, grading, exposure split, plate, reflection,
  halftone). Floating polygon windows, darkened margins, and large uniform
  borders are exceptions that must state a physical or perspectival cause and
  receive explicit user approval; otherwise they are P1.
- **Content layer per the contract below** — five type levels across four
  anchor regions is the default, reached by drafting interpretive copy when
  the brief is thin, never by shrinking the system.
- **Furniture/material layer** — a measured rule, caption system, shadow,
  frame, halftone, or tape with a named source cause.

Hide the image before release: if the remaining field, type, content, and
furniture collapse to a blank field plus title, reject the master as P0.
The final result must not be an unchanged source image with a title, an
uncaused gradient, an ornamental bar, fake metadata, or an AI-style filter.

## Content contract

Lock the real copy before layout. A project poster normally needs:

1. title or orientation;
2. one concise project definition;
3. one human stake, proposition, or memorable statement;
4. one mechanism or evidence layer: interface, process, technical concept,
   interaction loop, or source artifact;
5. author, platform, date, or institution only when factual and useful.

Compose these as a **type system, not a text block**: the default is at least
five distinct type levels placed in at least four anchor regions that form a
reading loop around the canvas. Levels are **distinct jobs, not repeated
registers** — orientation (display title), definition, human stake (at most
one lyrical logline), annotation or evidence, credit. Several poetic
paragraphs of similar size are one level wearing five costumes; they fail
this contract. Consecutive levels need visible size contrast, with the
display title several times the body size.

When supplied content is too thin, draft the missing levels — bilingual
subtitle, synopsis, logline, caption, annotation — classified as `factual`,
`interpretive draft`, or `decorative/semantic`, with interpretive copy
approved before final delivery. Never manufacture credits, dates,
coordinates, parameters, or institutions, and never resolve thinness by
deleting levels.

Chinese micro-typography is part of the contract: break lines at phrase
boundaries, never dangle a single character, never strand punctuation at a
line start, and never shrink type to fit a line.

State what the viewer receives at:

- **distance** — identity and dominant event;
- **mid-distance** — project definition and relation;
- **close range** — proof, mechanism, or residue.

Reject title-only elegance when the project remains unknowable; reject
board-like density when evidence competes with the main event.

## Benchmark against human-made posters

Benchmarking is a required production step, not an option. Choose an adjacent
human-made poster family per task, decompose one to three benchmarks, and
record the calibration table from `workflow/density-and-care.md`. When the
user supplies no references, **view the built-in benchmark boards**
(`assets/benchmarks/poster-board-1.png` … `-4.png`) following
`optional/poster-benchmark-boards.md`, alongside
`references/style-evidence.md` and `optional/case-night-shift-poster.md`.
Reading prose about benchmarks without viewing the images does not discharge
the obligation — the standard is visual. Declaring "no prior outcome
inspected" exempts nothing.

For each benchmark, extract:

| Quality to learn | Device that creates it | Why it serves this subject | Surface move to refuse |
| --- | --- | --- | --- |
| hierarchy / pressure / tactility / type voice / crop | | | |

Learn attention order, scale contrast, type-image relation, material density,
and restraint. Do not copy the benchmark's grid, palette, font, or signature
motif. If the benchmark is an exhibition board, translate its strongest
quality into one key-visual event and remove board navigation.

## Asset roles and processing

Build a contact sheet and assign every selected asset one role:

- **factual evidence** — real interface, object, place, or research source;
- **supporting carrier** — a host that makes the concept tactile;
- **material field** — paper, screen light, grain, scan, ink, shadow, textile;
- **secondary proof** — detail that changes understanding at close range.

A generated asset may fill a user-approved unmet supporting role. Never place
its untouched rectangular render on the canvas and call it the hero. Cut it
out, crop it decisively, grade it into the palette, inherit the host field's
light and shadow, and integrate real evidence through shared perspective,
contour, scale, or contact.

## Typography is structural imagery

Before direction work, render the actual title, descriptor, and one body-copy
sample in a compact type specimen. Test at least three genuinely plausible
voices and inspect full size and thumbnail.

Choose by:

- title silhouette and counterform rhythm;
- subject voice rather than genre label;
- Chinese/Latin language support;
- reading distance and body-copy contrast;
- availability in the intended HTML and Figma delivery environments.

Do not choose a font because it is merely "retro", "technical", or unusual.
Do not let a default serif, slab, pixel, or mono face impersonate taste.
If a custom display font is central, record its file and Figma availability
before Gate 2 approval. Test the full type system — every level in the
content contract — not only the display face.

## Direction selection

Create three compact HTML direction compositions with real copy lengths
and the target aspect ratio — fewer only on explicit user instruction.
Grayscale is optional when color carries the
subject. They must differ in spatial grammar and technique relation, not only
palette, crop, tilt, or object choice. Internal wireframes may be crude; every
direction shown to the user must already meet the reference-level draft gate.

Each direction must define:

- dominant event and first attention;
- title behavior: anchor, interruption, overlap, or field;
- the type system's levels and anchor regions;
- evidence location and reading order;
- quiet zone;
- image/material relation;
- distance, mid-distance, and close-range behavior.

Each direction must also name its single conceit — one material relationship
or operation idea that makes this poster more than text on a photo — and the
rendered preview must already show its seed. Direction claims are
pixel-verifiable: every declared craft family, same-source operation, and
type level must be pointable in the render. A claim that exists only in the
control record is a lie — delete it or rework the direction. A preview that
is real copy stacked over a merely graded or cropped photo is not a
direction, whatever its calibration table says; return it to internal work.

Select the direction that makes the subject inevitable, not the one with the
most effects.

## Material and craft family

Derive one named craft family from the subject or benchmark — film
development, misregistered print, photocopy, screen light, ink on paper — and
apply it coherently across image, type, and field. Texture must alter the
field, not sit on top as a stock overlay; control its scale, fade, density,
edge behavior, and interaction with text. Isolated light and shadow effects
stacked on a photo are not a craft family.

A coherent technique combination spans four roles:

- image: crop, repetition, exposure, scan, overprint, blur, collage, or
  another subject-caused operation;
- type: display silhouette, bilingual hierarchy, overlap, interruption, or
  scale conflict — material may enter the type layer itself (e.g. plate
  misregistration on the title);
- composition/content: synopsis, caption, line, icon, block, drawing, frame;
- material: the craft family above.

Record each surviving decorative device:

| Device | Source cause | Viewer effect | Layer and blend rule |
| --- | --- | --- | --- |
| | | | |

Pick only what serves the subject, but pick enough to reach the benchmark's
completion. A background, a title, and a few thin lines is returned to
internal work before the user sees it.

## HTML-first master

1. Obtain Gate 1 approval and source-policy release.
2. Build the contact sheet and `ASSET_LEDGER.md`.
3. Create the real-copy type specimen and record the delivery font risks.
4. Fill the benchmark calibration table; record the chosen craft family.
5. Discover one material relationship from eligible assets.
6. Create three spatial grammars; retain color when it carries meaning.
7. Build the selected master in this order:
   field → dominant relation → title → type system → material/craft →
   removal pass.
8. Render full size, thumbnail, copy-hidden, image-hidden, and same-scale
   reference views.
9. Run `operations/review.md` including the benchmark-comparison gate;
   obtain explicit user approval before Figma.

Mark concrete acts with `data-vds-action` and set `data-vds-schema="v3.1"`
on the HTML root (see `workflow/density-and-care.md` for what counts as an
act).

## Composition discipline

Treat the plane as a continuous force map. Every crop, rule, frame, second
image, color event, and connector must state a physical, temporal, spatial, or
typographic consequence of the thesis. Mark surviving lines and bars with
their cause in the HTML audit declaration.

Use contact, shared light, perspective, scale, crop, or overlap to make a
relation legible. A connector is allowed only when it is a real path,
measurement, or causal trace whose removal makes the project less clear.

Text needs visible breathing room from edges, crops, rules, and containers.
Fix structure or copy burden; never shrink type to hide a collision.

## Delivery

After approval, read `operations/figma-fidelity.md` and translate only the
approved master. Keep images replaceable, preserve custom-font and
perspective sources, and compare the Figma render to the approved HTML at
equal scale.

For cover-plus-body editorial or social sets, route to
`adapters/graphic-text.md`; do not reuse this single-canvas adapter.
