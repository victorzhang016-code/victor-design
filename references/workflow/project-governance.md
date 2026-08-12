# Project governance

## Purpose

A personal design language needs stable principles and controlled variation. Use a three-layer system:

1. **Personal system** — this Skill; the durable design DNA and hard quality gates.
2. **Project master** — the specific product, campaign, or body of work.
3. **Surface override** — only the differences required by a page, channel, state, or medium.

This borrows the organizational discipline of mature design Skills while rejecting their visual presets. No external palette, font pairing, template, or component style enters the design system by default.

## Precedence

When rules conflict, resolve them in this order:

1. The user's explicit instruction for the current task.
2. Truth, safety, accessibility, and primary user task.
3. Approved surface override.
4. Approved project master.
5. This Design System and selected `style-evidence.md` evidence.
6. Platform convention.
7. External template or generator default.

An override should state what changes and why. Silence means inherit.

## Project files

For a substantial project, create:

```text
design-system/
├── MASTER.md
├── surfaces/
│   ├── product.md
│   ├── poster.md
│   └── social.md
└── REVIEW.md
```

Use the templates in `assets/project-system/`.

Do not create empty surface files. Add one only when it contains a real deviation.

For a substantial, ambiguous, branded, or unattended project, create
`TASK_BRIEF.md` before `MASTER.md`. It captures task-local authority and
uncertainty; it does not add a second visual system or replace the master.

## MASTER.md responsibilities

The project master records:

- subject and audience;
- primary tasks;
- felt brief and material source;
- refusal list;
- content and interaction hierarchy;
- type roles;
- color roles;
- layout grammar;
- image/material/motion rules;
- accessibility target;
- approved benchmark renders;
- unresolved hypotheses.

It must also identify the selected style-evidence rows and any exception. A
project may inherit a principle from Victor's history; it may not silently copy
an unrelated palette, font treatment, or material motif.

It is a decision source, not a mood board.

The project master may be drafted only after the user has confirmed the design proposition. It records the dialogue; it cannot replace the dialogue.

In Codex, record whether confirmation came through the native structured question interface or through an explicit statement the user had already made. Never reopen a confirmed decision without new evidence.

## Surface override responsibilities

A surface file records:

- medium and viewing constraints;
- what it inherits;
- exact deviations;
- content density and responsive behavior;
- additional states;
- acceptance views and sizes.

Examples of legitimate overrides:

- a campaign poster uses bright narrative color while the product uses a material field;
- the mobile interface reveals secondary filters on demand;
- a social carousel increases type scale and reduces evidence per frame;
- a dark narrative scene hands control back to a light operational surface.

An override may not silently weaken readability or change a semantic color.

## Decision record

Whenever a strong exception is introduced, record:

- decision;
- source or reason;
- alternative rejected;
- usability effect;
- whether it is reusable or one-off;
- User approval status.

This protects intuitive choices from becoming arbitrary and prevents one-off styling from mutating into the system.

## Quality severity

### P0 — blocking

- violates the user's explicit refusal list;
- ships a deliverable form that conflicts with the user or control layer (for
  example, a poster where a deck, set, or state flow is required);
- begins high-fidelity design without a confirmed design proposition;
- begins substantial, ambiguous, branded, or unattended work without the
  required task brief, or treats self-written assumptions as user approval;
- uses a content-essential visual asset without a source/rights decision, or
  uses a decorative asset that cannot survive the asset-necessity test;
- cannot state the task's unique soul or justify the main formal method;
- uses serif type by default without a subject-specific reason and approval;
- reuses a prior project's palette, paper field, texture, or type voice without
  a current-task cause and recorded exception;
- contains filler copy, duplicate labels, or micro-explanation added to occupy space;
- primary task or action is unclear;
- essential text is unreadable;
- core state, error, recovery, focus, or mobile behavior fails;
- generated or inferred evidence is presented as real;
- render has not been visually inspected.

### P1 — major

- attention order contradicts content or interaction order;
- primary, secondary, support, and atmosphere layers are not visibly distinct;
- bold, color, block, or background decisions lack semantic reason;
- type size, tracking, line height, or line break weakens reading;
- type or color roles change meaning;
- structure is dominated by generic AI tropes;
- responsive layout is scaled rather than recomposed;
- a material effect interferes with operation.

### P2 — important

- project voice is coherent but insufficiently specific;
- rhythm, spacing, crop, or density weakens atmosphere;
- a low-frequency function occupies too much space;
- a visual exception lacks a recorded reason.

### P3 — polish

- optical alignment;
- micro-spacing;
- line breaks;
- image grade;
- subtle transition timing;
- metadata rhythm.

Resolve all P0 issues before review. Do not present a P1 issue as cosmetic.

## Golden sources

Use these as the source of truth, in descending order:

1. The user's latest explicit approval or rejection.
2. Approved current-project render.
3. Current-project master and surface rules.
4. Tier A works in `evidence-ledger.md`.
5. Earlier authored work.
6. External references.

When an approved render exists, compare actual output visually. A token file or CSS helper cannot substitute for the rendered golden source.

## Validation loop

1. Preflight the brief, content, asset status, and inherited rules.
2. Build the lowest-detail structure that can prove hierarchy.
3. Run deterministic checks where possible.
4. Render real output.
5. Inspect visual behavior.
6. Classify findings P0–P3.
7. Revise structure before decoration.
8. Obtain the user's approval.
9. Promote approved decisions or benchmarks into the project system.
