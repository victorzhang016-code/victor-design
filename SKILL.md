---
name: victor-design-system
description: Art-direct and deliver high-quality posters, key visuals, editorial graphics, AI product interfaces, and cross-medium visual systems through Victor Design's evidence-led design language. Use when a task needs subject understanding translated into authored canvas structure, typography, content hierarchy, color, processed imagery, material texture, HTML-first poster production, high-fidelity editable Figma delivery, or critique that rejects generic AI image-led design and exhibition-board thinking without flattening authored character.
---

# Victor Design

## First principle

Understand the person, situation, tension, material world, and irreplaceable
soul of the subject before choosing a visual direction. Let that understanding
decide composition, typography, color, imagery, material, and production method.

No visual move is valid until it can state its subject cause, viewer effect, and
why this carrier is necessary. Do not begin from a style label, asset recipe,
template, or AI-generated spectacle.

## Form sanity backstop — run before every adapter

Never let a model-written concept declaration decide its own deliverable form.
Treat it as a hypothesis that must lose to user language, a task controller,
platform convention, and ordinary reader sense.

1. Read the user request and any controlling `RUN.md`, round control, or
   acceptance criteria. Quote the source that fixes the form, count, and
   editable delivery requirement.
2. State the intended reader action in plain language: read a sequence, compare
   a set, complete a state flow, understand one key visual, or use a surface.
3. Run the counterfactual: if the proposed carrier were the only thing the
   reader received, could it perform that action without the author explaining
   it? If not, reclassify before designing.
4. Use these non-negotiable fallbacks when the brief is underspecified:
   social graphic-text/article → cover plus body pages; product task → related
   states including feedback; methodology/case/tutorial/pitch → narrated deck;
   poster/key visual → one canvas only when explicitly requested.
5. Stop if the proposed form conflicts with a controller. “One entry per lane,”
   “one proposition,” a prior successful poster, or the model's own concept are
   never evidence that a poster is the right form.

This check is deliberately independent of aesthetic confidence. A beautiful
answer in the wrong carrier has failed before visual judgment begins.

## Task-grounding backstop

Before making any new visual decision, establish a concise task brief. For a
substantial, ambiguous, branded, or unattended task, save it as
`TASK_BRIEF.md`; for a small revision, record the same answers in the existing
control record. Read `references/workflow/task-brief.md`.

The brief is a current-task contract, not a new style system. It identifies the
authority for scope and facts, reader action and viewing conditions, content
that must remain true, allowed materials, the asset-necessity decision, and a
task-specific visual mother object or relation. A prior result, an
external style name, or an attractive generated image cannot fill a missing
answer.

When an unattended runtime cannot ask a user, do not silently skip this work.
Record the uncertainty, take the least-assumptive path permitted by the control
layer, run the form and asset counterfactuals, and leave remaining risk visible
for review. Never invent user approval, product facts, assets, or a visual
preference to keep moving.

## Evidence, not a preset

Read `references/style-evidence.md` for every task. It ships as a template:
the owner fills it with color, layout, typography, material, and anti-pattern
evidence from their own approved work. It is a record of judgment, never a
palette, font pair, or layout template. Use only the evidence that fits the
confirmed task, and name any exception.

## Required execution chain

1. Run the form sanity and task-grounding backstops above. Then read
   `references/aesthetic-core.md`, `references/style-evidence.md`,
   `references/copy-discipline.md`, and
   `references/workflow/density-and-care.md`.
   Conduct the design dialogue through the native structured prompt when
   callable. Do not infer Gate 1 approval from the request.
2. Classify the deliverable form before choosing a visual direction, then read
   exactly one adapter: `adapters/poster.md` for a user-specified single canvas,
   `adapters/product-ui.md` for product surfaces, or `adapters/slides.md` for
   cases, methodologies, tutorials, pitches, and narrated presentations.
3. Read `operations/execution.md` and `operations/three-gates.md`. They are
   blocking rules, not documentation to complete after making work.
4. Read `operations/production-toolkit.md` only for a released production need;
   read `operations/review.md` before calling a render approved or complete.
   For editable poster delivery, also read `operations/figma-fidelity.md`
   before any Figma translation.
5. Load `optional/*` only for its named need.

## Non-negotiable defaults

- Search real workspace material first, then specific licensed web sources.
  Generation is a named, user-approved fallback for an unmet role; it cannot be
  the hero image by default and is never factual product evidence.
- A generated or found object is input material, not a poster. Process, crop,
  grade, mask, and seat it inside an authored canvas. The composition must still
  work when that object is hidden.
- A key visual has one dominant event and enough source-backed content to
  identify the project. Reject both exhibition-board density and title-only
  emptiness.
- Test the actual title, descriptor, and necessary explanation as a type
  specimen before choosing a layout. Do not select a display face from a style
  label such as "retro" or accept a substitute whose silhouette changes the
  approved master.
- Treat a multi-page or multi-state form as the default when the task teaches a
  method, explains a case, or carries a sequence. A single poster is valid only
  when the user or controlling surface explicitly asks for one; it is never a
  fallback for an underspecified brief.
- Derive every palette and type voice from current-subject evidence. A prior
  success, including its paper field or serif treatment, is not evidence
  for a new project unless the reuse is explicitly justified and approved.
- Treat title, required copy, source evidence, and refusal list as source of
  truth. Do not create filler metadata, decorative microcopy, or uncaused rules,
  bars, dots, or connector lines. Factual inscriptions — coordinates, readouts,
  dates, real parameters — are not filler; carry them as crafted small type.
- Never batch-produce a multi-page deliverable before user-approved pilot
  pages (cover, densest evidence page, most unusual page). A page below the
  recorded density target is unfinished, not restrained.
- For posters, use HTML to judge the master. Obtain explicit user approval of
  the rendered master before Figma work. Unless the user explicitly accepts a
  flattened-only result, deliver the approved poster as native editable Figma
  nodes as well as the render.
- Treat the approved render as Gate 3's golden source. Inventory custom fonts,
  CSS masks/blends/repeating textures, and perspective composites before
  translation; these are fidelity risks, not acceptable silent approximations.
- A control record proves a decision happened; it never replaces user approval
  or authored visual judgment.

## Review order

Review subject specificity, material relation, and residue first; hierarchy,
type, color, space, crop, and task clarity second; technical checks last.
Deterministic checks find concrete risks but cannot certify taste.

## Architecture

This file is the runtime entry point. `aesthetic-core`, `style-evidence`,
`density-and-care`, one adapter, `execution`, and `three-gates` are the
default chain. Keep detailed
rules in the referenced module that owns them; do not hide active rules in a
migration ledger or a historical note.
