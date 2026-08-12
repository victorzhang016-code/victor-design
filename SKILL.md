---
name: victor-design-system
description: 证据驱动的跨载体视觉设计与交付系统。用于海报、图文/社交内容、PPT/演示和产品 UI：理解主题与情绪，学习优秀人工参考，选择有依据且足够丰富的设计手法，制作 HTML 母版并完成可编辑交付与审查。
---

# Victor Design

## First principle — the richness chain

Understand the person, situation, tension, material world, and irreplaceable
soul of the subject before choosing a visual direction. Then, in order:

1. **Subject and emotion first.** Let what is true about the subject decide
   composition, typography, color, imagery, material, and production method.
2. **Every technique has a cause** — subject cause or benchmark cause — and
   can state its viewer effect. "It looks designed" is not a cause.
3. **Enough techniques, not few.** Richness and justification are co-equal
   requirements. A draft that passes every veto but feels thin has failed;
   do not answer AI slop with austerity.
4. **Reference-level before user-visible.** Compare against strong human-made
   work of an adjacent family; a shown draft is already a designed artifact.

`references/workflow/density-and-care.md` owns the full method: what to add
when the brief is thin, the benchmark obligation, and the density targets.
Never begin from a style label, asset recipe, template, or AI spectacle.

## Form sanity backstop — run before every adapter

Never let a model-written concept declaration decide its own deliverable form.
Treat it as a hypothesis that must lose to user language, a task controller,
platform convention, and ordinary reader sense.

1. Read the user request and any controlling `RUN.md`, round control, or
   acceptance criteria. Quote the source that fixes the form, count, and
   editable delivery requirement.
2. State the intended reader action in plain language.
3. Counterfactual: if this carrier were the only thing the reader received,
   could it perform that action without the author explaining it? If not,
   reclassify before designing.
4. Fallbacks when underspecified: social graphic-text/article → cover plus
   body pages; product task → related states including feedback;
   methodology/case/tutorial/pitch → narrated deck; poster/key visual → one
   canvas only when explicitly requested.
5. Stop if the proposed form conflicts with a controller.

## Task-grounding backstop

Before any new visual decision, establish a concise task brief per
`references/workflow/task-brief.md` (`TASK_BRIEF.md` for substantial or
unattended work). The brief fixes the authority for scope and facts, reader
action and viewing conditions, content that must remain true, allowed
materials, asset necessity, and the task-specific visual mother object. A
prior result, a style name, or an attractive generated image cannot fill a
missing answer. An unattended runtime records uncertainty and takes the
least-assumptive path; it never invents user approval, facts, assets, or
visual preferences.

## Image-role preflight — zero step when an image is attached

An uploaded image does not determine the task type. Before form classification
or any production, load `references/workflow/image-role-routing.md` and ask
whether the image is the base/hero, project evidence, supporting material, or
a reference/benchmark. Only `Image role: base` plus `poster`/`key visual`
activates the image-as-carrier branch in `references/adapters/poster.md`.

## Evidence, not a preset

Read `references/style-evidence.md` for every task. It ships the author's
distilled visual grammar as a default evidence base; an adopter with approved
work replaces it as step one of onboarding. It is a record of judgment, never
a palette, font pair, or layout template. Use only evidence that fits the
confirmed task, and name any exception. The default voice — its color courage,
scale force, and materiality — always yields to the user's stated aesthetic
preference; a user who asks for quieter, softer, or different is the highest
authority on voice.

## Required execution chain

1. Image attached → image-role preflight above. Then the form sanity and
   task-grounding backstops.
2. Read `references/aesthetic-core.md`, `references/style-evidence.md`,
   `references/copy-discipline.md`, `references/workflow/density-and-care.md`.
3. Classify the form, then read exactly one adapter:
   `references/adapters/poster.md` (user-specified single canvas),
   `graphic-text.md` (cover-plus-body editorial/social), `product-ui.md`
   (product surfaces), `slides.md` (cases, methods, tutorials, pitches).
4. Read `references/operations/execution.md` and
   `references/operations/three-gates.md` — blocking rules, not paperwork to
   complete afterward.
5. Conduct the design dialogue through the native structured prompt when
   callable; otherwise ask in grouped plain prose. Never infer Gate 1
   approval from the request.

Conditional tools — load only for the named need:

| Need | Load |
| --- | --- |
| Asset sourcing, cutout, generation, SVG, perspective | `operations/production-toolkit.md` (after Gate 1 release) |
| Figma/PPTX/interactive-HTML build pipelines | `operations/delivery-implementations.md` (at Gate 3) |
| Editable translation, font/material/perspective drift | `operations/figma-fidelity.md` |
| Any master review or completion claim | `operations/review.md` |
| References to decompose, or revision-led work | `optional/reference-synthesis.md` |
| Multi-format communication surfaces | `optional/communication-surfaces.md` |
| Long-running project governance | `workflow/project-governance.md` |

Precedence: user-confirmed subject and acceptance criteria → truth, safety,
accessibility, primary task → approved project/surface decisions → this file,
aesthetic core, style evidence → adapter and operations → optional references
and external defaults.

## Non-negotiable defaults

- Asset source chain, in order: local workspace material → licensed web →
  user-approved AI generation → code (CSS/SVG/HTML, material/graphic roles
  only). Generation is never the default hero and never factual evidence.
- A generated or found object is input material, not a poster. Process, crop,
  grade, mask, and seat it inside an authored canvas that still works with
  the object hidden.
- Derive every palette and type voice from current-subject evidence. A prior
  success is not evidence for a new project unless reuse is explicitly
  justified and approved.
- Title, required copy, source evidence, and refusal list are source of
  truth. No filler metadata or uncaused devices; factual inscriptions are
  carried as crafted small type.
- Never batch-produce a multi-page deliverable before user-approved pilot
  pages. A page below the recorded density target is unfinished.
- Use HTML to judge masters; obtain explicit render approval before any
  translation. Every category ships its native editable deliverable unless
  the user explicitly accepts flattened-only.
- The approved render is Gate 3's golden source. Inventory custom fonts,
  masks, blends, and perspective composites before translation.
- A control record proves a decision happened; it never replaces user
  approval or authored visual judgment.

## Review order

Subject specificity, material relation, and residue first; hierarchy, type,
color, space, crop, and task clarity second; technical checks last.
Deterministic checks find concrete risks but cannot certify taste.

## Architecture

This file is the runtime entry point. The default chain is `aesthetic-core`,
`style-evidence`, `density-and-care`, one adapter, `execution`, and
`three-gates`. Keep detailed rules in the referenced module that owns them;
each rule lives in exactly one place.
