# Three release gates

Use `operations/execution.md` for the fields and release criteria. A control
record is evidence of a decision, never a replacement for it.

## Gate 1 — Proposition

Treat Gate 1 as a visible state machine, not a sentence the executor can write
after the fact:

- **Image role pending/approved** — the user has confirmed whether the image is
  the base/hero, project evidence, supporting material, or reference. No adapter,
  web search, generation, or composition begins before this state is approved.
- **Brief pending/approved** — the user has confirmed task, copy, surface,
  audience, source boundary, and output form.
- **Direction pending/approved** — the user has seen three rendered, genuinely
  different direction options and selected one by ID. A single direction is
  allowed only when the user explicitly instructs it ("就按这个做"); the
  executor's own judgment that "visual intent is unambiguous" never waives
  the three-direction comparison.
- **Released** — both approvals exist. Only this state may enter high-fidelity
  master production.

Never promote a model recommendation to an approved role or direction. Never
interpret “确认/生成/PNG/手机竖版” as a role or direction selection.

Release only after explicit user confirmation of the subject, human stake,
audience task, unique soul, required content, refusal list, output surface, and
source route. Require a contact sheet, asset ledger, hero-source declaration,
and a documented local → web → unmet-role → generation → code trail.

For a controlled unattended run, record the controller path and explicit
interaction policy in `TASK_BRIEF.md` instead of fabricating confirmation. The
controller may set scope and authority; it cannot silently provide an absent
visual preference. Run the task-brief counterfactuals and flag unresolved
judgment for later review.

Block when the proposition is inferred, the task brief is absent when required,
the deliverable form conflicts with the
control layer, the style-evidence selection is absent, the density target and
layer inventory are missing from the record, a previous project is
being used as palette/type evidence without a current-task cause, the primary
source is unclear, or generation is proposed without explicit user
authorization.

For an uploaded image whose approved role is `base` on a poster/key visual,
also block title-only treatment, unchanged full-bleed placement, and any master
whose image-hidden view collapses to a blank field. These are P0 quality
failures, not optional polish. Do not apply this poster-specific rule to a
reference image or to a project-evidence image routed into a deck, social set,
or product surface.

At direction stage, block any shown direction that is copy over a merely
graded or cropped photo, whose declared craft family, operations, or type
levels are not visible in the rendered preview, or whose type system is a
stack of same-register prose blocks. A direction is where the craft begins,
not where it is promised — claims must be pointable in pixels before the
user is asked to choose.

Run the form challenge from `operations/execution.md` as a separate pass before
release. A concept that declares a poster while the controller asks for slides,
social pages, or product states is a P0 form conflict; the declaration records
the mistake and does not excuse it.

## Gate 2 — Master

For posters, use HTML as the exploration master. Review authored world,
subject-fit, material relation, hierarchy, type, color, space, crop, and factual
content before technical checks. Require a real-copy type specimen, complete
mid/close-range content, and three different spatial grammars. Inspect full
size, thumbnail, copy-hidden, image-hidden when relevant, and same-scale
reference views.

Release only when the user explicitly approves the selected render. Block
self-approval, a generic master after title removal, decorative AI-editorial
costume, AI-image-led composition, exhibition-board structure, title-only
emptiness, tasteless/untested type, batch production of a multi-page output
before pilot-page approval, pages that fall below the recorded density
target, or unresolved P0/P1 review findings.

For v3.1 high-fidelity directions, also block user-visible rough sketches,
fewer than four concrete design acts, missing reference decomposition when the
user supplied benchmarks, and over-restraint that leaves only a title,
untreated asset, and weak furniture. Apply this across poster, graphic-text,
slides, and UI with carrier-specific density.

For slides, release the deck master only after every declared page has a
rendered review image, the page count matches the surface lock, and each page
has a conclusion followed by supporting evidence. Do not release a poster that
has merely been split, cropped, or repeated as a deck.

## Gate 3 — Delivery

Translate only the approved master. Every category ships its editable form per
the delivery matrix in `operations/execution.md`: posters and graphic-text
sets as editable Figma frames, slides as Figma or PPTX per the user's recorded
Gate 1 choice, and slides/UI additionally as interactive HTML. For editable
poster delivery, preserve named
native Figma text, fields, masks, rules, and geometry; keep images replaceable
and record projective source/parameters.

Release only when a Figma/PPTX render has been compared at equal scale with the
approved HTML master and high-risk title/material/perspective crops have been
checked. Block flattened editable claims, missing Figma URL/node audit,
unapproved font substitution, font/crop drift, lost material masks or blends,
false perspective, visible recovery layers, missing evidence, or technical
failures. Also block: a slides/UI delivery without its interactive HTML;
slides without a recorded editable-format choice; motion with no function or
no reduced-motion fallback; a multi-page or multi-state Figma file reduced to
a single frame. Any user rejection reopens Gate 3.
