# Execution contract

Use this contract for every substantial visual task. It converts design
principles into releases; a later record cannot retroactively release earlier
work.

## Gate 1 — proposition and evidence

If an image is attached, Gate 1 begins with a user-visible image-role
checkpoint. `Image role: base` means the image is the background or hero;
`project-evidence` and `supporting` remain asset-driven roles; `reference` is
not placed by default. The role must be approved before choosing an adapter,
searching for missing assets, or composing.

Gate 1 then has two further user-visible checkpoints. `Brief status: approved`
confirms scope, copy, form, and source policy only. `Direction status: approved`
means the user saw the direction preview and explicitly selected a direction.
The first status never implies the second. A generic reply such as “确认”,
“生成”, “PNG”, or “手机竖版” cannot release a direction.

Load the "Confirmed image-as-carrier input" branch of `adapters/poster.md`
only when the approved role is `base`
and the declared form is `poster` or `key visual`. Do not create a high-fidelity
master or final export until the required role, brief, and direction evidence
are recorded. A model recommendation remains `Proposed direction`, never
`Approved direction`.

Before the proposition is released, create or update `TASK_BRIEF.md` using
`workflow/task-brief.md`. Its scope, source authority, asset policy, and form
answers are inputs to this gate. A concept cannot use its own aesthetic
confidence as a substitute for that record.

Before high-fidelity work, obtain the user's explicit confirmation. Record it in
`DESIGN_CONTROL.md` with a link or quoted approval evidence. For a controlled
unattended run, record the controller and interaction policy in `TASK_BRIEF.md`
instead; never treat a request for a visual, a controller, or self-written
assumptions as approval of an inferred visual preference.

The Gate 1 record must include these state fields:

```markdown
Gate 1 status: pending | released
Image role status: pending | approved
Image role: base | project-evidence | supporting | reference | mixed | pending
Image placement: background | hero | replaceable-image | not-placed | per-asset | pending
Image role approval evidence:
Image role source/rights:
Brief status: pending | approved
Direction status: pending | approved
Direction preview shown: yes/no — path or hash
Proposed direction: stable ID or none
Approved direction: stable ID or none
Brief approval evidence:
Direction approval evidence:
```

For v3.1 records, use arbitrary stable direction IDs such as `02A`, `03A`,
`cover-editorial`, or `data-story-dark`; do not remap them to A/B/C. When
attached files carry different roles, record `Image role: mixed`,
`Image placement: per-asset`, and put every file's actual role and placement in
`ASSET_LEDGER.md`.

Also record:

```markdown
Design schema: v3.1
Reference family:
Technique rationale:
Target density:
Revision contract: preserve / remove / strengthen / locked / reference level
Interpretive copy status: none | pending | approved — evidence
```

`Gate 1 status: released` is valid only when image role, brief, and direction
are approved, a preview was shown to the user, an explicit direction ID is
recorded, and the evidence quotes the user's selections. If any item is
missing, keep the gate pending and stop before the master.

Record all of the following:

- subject, human stake, audience task, unique soul, required copy/language,
  output surface, refusal list, and source route;
- **deliverable-form declaration**: the exact shape of the deliverable and the
  platform convention it answers to, with the inference basis when the brief
  does not state it. Conventions to check before choosing: social graphic-text
  = a cover plus body pages forming a continuous reading path (never a single
  poster page); product interface = a state flow of at least two related
  screens including the post-decision state (never one static screen); poster /
  key visual = one canvas; slides = a narration sequence. A methodology, case,
  tutorial, or pitch defaults to slides when the medium is unstated. A single
  canvas needs an explicit user or control-layer reason; "one canvas per lane"
  or "one proposition" is not such a reason. If the brief implies a medium,
  state the assumption in one sentence so the user can veto it;
- **density target and layer inventory**: when a reference artifact is named,
  record its type hierarchy, image operations, supporting elements, material,
  visual weight, dense/quiet regions, and relational density. Translate these
  into at least four concrete design acts per high-fidelity page or state;
  component count alone is not a density target. With no reference, record the
  carrier anchor from `workflow/density-and-care.md`. Gate 1 does not release a
  proposition that declares only a field, palette, and type voice;
- **surface lock**: record the controlling page/state count, canvas, reading
  mode, and editable source requirement before concept work. A later note that
  says "at most six slides" overrides every earlier poster inference;
- **palette and type cause record**: name the current subject evidence for the
  field, each semantic color, and each type family. Also name one rejected
  field/palette and one rejected type voice. Earlier work cannot fill
  either column by itself;
- selected `style-evidence.md` rows and any exception;
- **fact provenance**: for every fact driving a design decision (brand
  colors, names, versions, figures), record its level — user-confirmed,
  file-recorded, or system-inferred. An inferred fact is marked as an
  assumption and never presented as the user's choice;
- **asset version**: when several versions of a source asset exist, record
  which is canonical and why before compositing;
- contact sheet path and `ASSET_LEDGER.md` path;
- primary/hero source, source status, and each selected asset's role;
- the local → licensed web → unmet role → generation → code decision trail.

Generation is blocked until the ledger names an unmet role and the user
explicitly authorizes it. A generated hero image is blocked unless that approval
explicitly says it may be the hero. Generated work is never factual product
evidence.

## Form challenge — mandatory self-correction

Before building a master, challenge the declaration with three questions and
write the answers beside it:

1. **Authority** — Which exact user/controller sentence fixes the form? If
   there is one, follow it verbatim. A model's own declaration cannot override
   it.
2. **Reader action** — Is the reader meant to read a sequence, compare pages,
   follow product states, or take in one visual event? Choose the carrier that
   performs that action.
3. **Single-canvas test** — If one canvas is proposed, what explicit source
   makes a sequence, set, or state flow unnecessary? "The prompt is short" and
   "the topic has one claim" fail this test.

Block production until all three answers agree. If they do not, prefer the
multi-page/state convention above or ask the user. Do not use a form
declaration as evidence that the declaration itself was correct.

## Gate 2 — HTML master and user approval

For posters, make a self-contained HTML master only after Gate 1 releases it.
Use native HTML/CSS for text, fields, rules, and simple masks; use real assets
for physical objects and complex surfaces.

Before asking for approval, provide:

- three genuinely different grayscale spatial grammars with real copy lengths;
- a real-copy type specimen and a note on custom-font delivery risk;
- a content check covering project definition, human stake, and one mechanism
  or evidence layer;
- a selected master render at full size, thumbnail, copy-hidden, and same-scale
  reference view, plus image-hidden when an image or generated carrier is
  visually dominant;
- a review record from `operations/review.md`, including the required
  `## Benchmark comparison` section (a hard gate there).

For a multi-page or multi-state output, make a low-detail content thumbnail or
role map before decoration. Name every page/state's job, dominant evidence or
interaction, visual carrier, and transition from the previous state. Do not
batch-produce a sequence from one attractive composition. After the role map,
build one to three pilot pages at full craft — the cover, the densest
evidence page, and the most unusual page — and obtain explicit user approval
of the pilot renders before producing the rest.

When delegating visual execution to a subagent, the brief must carry the
design context the subagent cannot infer: reference image paths with an
explicit instruction to view them, the approved layer inventory and density
target, concrete font file paths (never "system stack" when project fonts
exist), and the component list each page type must contain. Acceptance must
include a full-size side-by-side comparison against the reference, performed
by the delegating agent — deterministic subagent checks (overflow, floors,
banned content) cannot certify craft.

Stop after presenting the master. Do not self-approve, generate a delivery
record, or begin Figma reconstruction until the user explicitly approves the
render.

## Gate 3 — native editable delivery

Unless the user explicitly accepts a flattened-only outcome, every category
ships a native editable deliverable after Gate 2 approval. In a controlled
unattended run, the controller decides whether this gate is waived and the
waiver is recorded.

### Delivery matrix

| Form | Master | Static export | Editable delivery | Interactive delivery |
| --- | --- | --- | --- | --- |
| Poster / key visual | HTML | 1 PNG | native editable Figma nodes | — |
| Social graphic-text set | HTML | 1 PNG per page | Figma: one frame per page, native text and shapes, images as replaceable fills | — |
| Slides / deck | HTML | 1 PNG per page | Figma **or** PPTX — the user picks per task at Gate 1; the skill must be capable of both | interactive HTML: keyboard/click navigation with restrained functional motion |
| Product UI | HTML | 1 PNG per state | Figma: one frame per state | interactive HTML: every declared state click-reachable, with motion feedback |

### Motion discipline (interactive HTML)

- Motion serves exactly two functions: feedback on a state change, and
  guidance of reading order.
- Durations 150–400 ms with one shared easing; no autoplay spectacle (floating
  objects, particles, looping animation).
- Respect `prefers-reduced-motion`; content stays complete with motion off.
- Interactive HTML never replaces the static export: one PNG per page/state
  still ships in `deliverables/`.

### Editable translation

Use the Figma integration only after reading its required skills. Create or
target a Figma Design file, then rebuild the approved master with named native
text, fields, masks, rules, and structural geometry — one frame per page or
state for multi-page/multi-state work. Keep raster images as replaceable
fills; retain source images and four-point parameters for a perspective
composite. For PPTX delivery, rebuild the approved pages as native slides with
editable text, shapes, and image placeholders; an exported screenshot per
slide is not editable delivery.

Before reconstruction, inventory font, material-effect, crop, blend, mask, and
perspective risks using `operations/figma-fidelity.md`. Record the Figma URL,
primary frame/node, node audit, and an equal-scale render comparison to the
approved HTML master — per frame for multi-page work. A screenshot pasted into
Figma is not editable delivery. An unavailable custom font, lost CSS texture,
or rectangular screen insertion is not an acceptable silent approximation.

Record in the Gate 3 fields: the chosen editable format (figma/pptx), the
interactive HTML path, and a motion inventory (what animates, its function,
its duration). For the concrete build pipelines, read
`operations/delivery-implementations.md`.

## Required records

`DESIGN_CONTROL.md` uses these labels under the named gates:

```markdown
## Gate 1 — Proposition
Image role status: pending | approved
Image role: base | project-evidence | supporting | reference | mixed | pending
Image placement: background | hero | replaceable-image | not-placed | per-asset | pending
Image role approval evidence:
Image role source/rights:
Decision:
User approval:
Approval evidence:
Brief approval evidence:
Direction approval evidence:
Source route:
Source policy:
Contact sheet:
Asset ledger:
Hero source:
Generation exception:

## Gate 2 — Master
Decision:
HTML master:
Approved render:
User approval:
Approval evidence:
Visual review:
Benchmark comparison:

## Gate 3 — Delivery
Decision:
Editable format:
Editable Figma file:
Primary frame/node:
Figma node audit:
Figma comparison:
Interactive HTML:
Motion inventory:
```

`ASSET_LEDGER.md` must list each selected asset with role, local path or URL,
rights/status, factual-vs-interpretive status, and any crop/composite rule.
