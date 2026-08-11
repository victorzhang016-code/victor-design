# Visual review and veto

Run this review after a render exists and before any completion claim. Scripts
can find concrete red flags; they cannot approve hierarchy or taste.

## Choose the surface branch first

Use the poster checks only for a declared poster/key visual. Use the slide
checks below for a deck, methodology, case, tutorial, or pitch. Never judge a
deck by whether it looks like a single poster, and never let a poster stand in
for a required narrated sequence.

## Poster-specific authored-world review

- Could this work belong only to this subject after its title is removed?
- Does one subject-caused visual event lead the field, rather than a collection
  of attractive parts?
- Does the canvas retain hierarchy when the largest image or generated carrier
  is hidden?
- Is this unmistakably a poster/key visual at distance, or has it become an
  exhibition board with navigation and evidence panels?
- Is every image real evidence, approved interpretation, or a disclosed
  generated supporting role?
- Does the material relationship use contact, transform, light, crop, scale, or
  perspective instead of a decorative connector?

## Slide sequence review

- Does the number of rendered pages exactly match the surface lock, including
  the cover and closing page?
- Can a reader state each page's conclusion before reading its support?
- Does each page earn the next one, rather than resetting the same poster
  composition with a new heading?
- Are field, type, color, and image roles coherent across the sequence while
  page jobs and visual rhythms remain distinct?
- Does the cover promise a question the middle pages answer, and does the last
  page resolve the reading path rather than simply stop?
- Can each page survive as an individual review/voting image with no clipped
  footer, browser chrome, hidden overflow, or dependence on animation?

## Content and type review

- Can a mid-distance viewer state what the project is from the title and one
  concise definition?
- Does close-range content provide one human stake and one mechanism or proof?
- Is the work sparse because it is resolved, or because necessary project
  content is missing?
- Was the actual title tested as a specimen, and does its silhouette carry the
  intended voice?
- Would a different generic "retro", serif, mono, pixel, or technical face
  change little? If so, the type choice is not specific enough.

## Task-grounding and asset review

- Does the completed work still obey the current task brief's scope, facts,
  reader action, and material boundary?
- For every image, product mark, screenshot, or generated asset: if it is
  removed, does a reader lose content, evidence, identity, or an explicitly
  approved atmosphere role? If not, remove it rather than decorating with it.
- When a real named product or brand is material to the task, has its identity
  been sourced or has the absence been honestly disclosed rather than replaced
  by an invented logo, fake UI, or generic silhouette?
- Can every visual mother object, material, and high-effort detail name a
  current-task reason rather than a prior success or generic style label?

## Type, color, and layout veto

Reject and revise when any of the following is true:

- small mono/typewriter copy, tracked all caps, sequence labels, badges, or
  metadata are present without a verifiable source role;
- a colored left rail, dot, rule, frame, glow, gradient, or container cannot
  name its subject cause and viewer effect;
- the title-image-footer skeleton, card stack, or floating collage could be
  swapped into another project with little loss;
- type has been shrunk to solve a collision, or a line break damages reading;
- a methodology, case, tutorial, or pitch has been reduced to one poster or a
  poster-derived set without an explicit surface exception;
- a palette, paper field, texture, serif, or tracking treatment is justified by
  an earlier work instead of present-subject evidence;
- required deck body text falls below the slide adapter floor, Chinese body
  uses decorative tracking, or serif is standing in for "academic" taste;
- color decorates instead of marking a semantic event, voice, material, or
  state;
- generated imagery is carrying factual proof or unapproved visual dominance.
- a screen/interface is a flat rectangle inside a perspectival host;
- complex background material has collapsed into a uniform translucent block.

## Density, rhythm, and closing gate

Before any completion claim, run these measured checks — they are hard gates,
not taste calls:

- **Overflow measurement**: sum the fixed content heights against the canvas's
  usable height. Overflow is a P0 even when a flex layout hides it by
  collapsing gaps. For images shown at native aspect ratio, compute each
  column's total height from its assigned width *before* layout; an excess
  over usable height is a P0 whether or not it is visibly clipped.
- **Bottom-edge inspection at native resolution**: crop and view the bottom
  strip of every page or screen. A clipped footer, caption, or indicator is a
  P0.
- **Declared spacing scale**: section gaps must follow a scale declared before
  layout (e.g. 8/16/32/64). Cramped uniform gaps and arbitrary one-off gaps are
  both defects.
- **Density budget**: a cover or primary screen carries one dominant event plus
  at most three supporting elements. Overload (evidence competing with the main
  event) and dead zones (blank regions with no compositional role) both fail.
- **Closing beat**: any multi-page or multi-state work must end on a designed
  closing — a page or state that resolves the reading path — not simply stop.
- **Apparatus bypass test**: a framing device (stamp, counter, fake label,
  ornamental frame) must be removable without loss of meaning. An apparatus
  the reader must decode before reading the content is a P1.
- **Invented-frame veto**: a comparison, ranking, versus-pairing, or
  winner/loser emphasis that the source content does not state is a P1.
- **Caption check**: a caption with no name, role, or sourced fact is
  decoration — P2.
- **Persona-imagery match**: every person, avatar, or scene image must match
  the context the copy establishes (setting, activity, mood). State in one
  line why this figure is the right one before placing it; a mismatch
  (e.g. occupational props against a social scenario) is a P1.

## Required views

Inspect full size, thumbnail, copy-hidden, image-hidden, and same-scale
reference views. Add title, material, and perspective crops when those are
high-risk. For each, record first attention, missing proof, collision, and
remaining risk. Classify P0/P1/P2/P3 using
`workflow/project-governance.md`; no P0 may remain.

## HTML declarations for audit

When writing an HTML master, mark meaningful text/image elements with
`data-vds-role="title|explanation|evidence|action|atmosphere"`. Mark any line,
bar, border, or connector that remains with `data-vds-cause="…"`. The audit
flags undeclared microcopy, decorative rails, and rules for human review.

## Figma review

Check the Figma render beside the approved HTML master. Verify native text,
named layers, replaceable image fills, masks, and geometry; reject flattened
claims, font drift, crop drift, lost material, false perspective, visible
fallbacks, duplicate source layers, or missing evidence. Use
`figma-fidelity.md` for the full translation checklist.
