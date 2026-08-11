# Victor Design

An evidence-led design skill for AI agents — for **posters, social cards,
product UI, and slide decks (PPT)**. It art-directs and delivers by forcing
one discipline: **understand the subject before choosing any visual move, and
make every move state its cause.**

No visual decision is valid until it can name its subject cause, its viewer
effect, and why this carrier is necessary. The skill rejects style labels,
asset recipes, templates, and AI-generated spectacle as starting points —
and it has the gates to prove the work actually happened.

## Battle-tested

Victor Design was evaluated head-to-head against seven world-class design
skills in controlled blind races across four tracks — poster, social cards,
product UI, and slides. It outperformed most of them, including a first-place
finish by public vote. The full mechanism below is the direct result of that
competition: every rule here was reverse-engineered from a real, recorded
failure or a verified win.

## The method

1. **Material first, always.** Real workspace material and real evidence come
   before any web search, and generation is a named, user-approved fallback —
   never the default hero, never factual evidence.
2. **Excavate the subject.** Person, tension, material world, and the
   irreplaceable soul of the subject are established before composition,
   typography, color, or imagery is chosen.
3. **Match the design method to the subject.** A methodology or case becomes
   a narrated deck; social content becomes a cover-plus-body card set; a
   product task becomes a state flow; a poster is one canvas — and only when
   the brief actually calls for one.
4. **A hard anti-AI stance.** Refusal lists for spectacle and decorative
   polish, a grep-enforced copy blacklist (negation-contrast templates,
   false suspense, hollow parallelism, marketing abstractions), and a
   positive craft model so "restrained" never collapses into "undesigned".

## Why this exists

Design-capable agents fail in predictable ways:

- they answer a deck brief with a single poster, or a product brief with one
  static screen;
- they reuse whatever palette or serif worked last time, regardless of
  subject;
- they produce austerity (system fonts, flat fields, bare pages) and call it
  restraint;
- they fill pages with decorative rails, badges, fake metadata, and invented
  microcopy to simulate polish;
- they batch-produce thirty pages before anyone has approved one.

This skill is the accumulated counter-mechanism. Its rules were reverse-
engineered from real, recorded failures — including its own.

## Install

Clone it into your agent's skills directory. Any agent that reads
`SKILL.md`-style skills can then load it.

**macOS / Linux (bash):**

```bash
git clone https://github.com/victorzhang016-code/victor-design.git ~/.agents/skills/victor-design
```

**Windows (PowerShell):**

```powershell
git clone https://github.com/victorzhang016-code/victor-design.git "$HOME\.agents\skills\victor-design"
```

Using a tool-specific skills directory instead? Point the same clone at it —
e.g. `~/.claude/skills/victor-design` for Claude Code or
`~/.codex/skills/victor-design` for Codex. The entry point is `SKILL.md`.

## Architecture

`SKILL.md` is the runtime entry point. It routes through two mandatory
backstops, a default reference chain, exactly one adapter, and three release
gates:

```
SKILL.md
├── Form sanity backstop      deliverable form is fixed by user/controller
│                             language, never by the model's own concept
├── Task-grounding backstop   TASK_BRIEF.md before substantial/ambiguous/
│                             branded/unattended work
├── references/
│   ├── aesthetic-core.md         cause → form translation, material relation
│   ├── style-evidence.md         TEMPLATE — owner fills with own approved work
│   ├── copy-discipline.md        voice rules + AI-flavor copy blacklist
│   ├── workflow/
│   │   ├── task-brief.md         task contract + unattended fallback
│   │   ├── density-and-care.md   the positive craft model (six page layers)
│   │   ├── evidence-ledger.md    TEMPLATE — source weighting tiers A–D
│   │   └── project-governance.md master/surface layers, P0–P3 severity
│   ├── adapters/                 read exactly one per task
│   │   ├── poster.md             single canvas / key visual + social card sets
│   │   ├── product-ui.md         state flows, confirmation friction, no dead ends
│   │   └── slides.md             narrated decks: form lock, palette derivation,
│   │                             pilot pages, type floors (≥56/23/16 px)
│   ├── operations/
│   │   ├── execution.md          Gate 1/2/3 field requirements
│   │   ├── three-gates.md        blocking conditions per gate
│   │   ├── review.md             visual veto + measured hard gates
│   │   ├── production-toolkit.md asset sourcing → generation chain, compositing
│   │   └── figma-fidelity.md     approved-render → editable Figma translation
│   └── optional/                 load only for the named need
├── scripts/                    deterministic checks (they cannot certify taste)
└── assets/project-system/      MASTER / SURFACE / REVIEW / DESIGN_CONTROL /
                                ASSET_LEDGER templates
```

Routing details and precedence live in `references/module-index.md`.

## The mechanisms that carry the weight

- **Form sanity** — a methodology, case, tutorial, or pitch defaults to a
  narrated deck; social graphic-text means cover + body pages; product means
  a state flow. A single canvas always needs an explicit external reason.
- **Palette and type derivation** — every field, color, and type voice must
  cite current-subject evidence; reusing a past project's surface requires a
  recorded exception. "Academic" is not a serif rationale.
- **Density, not austerity** — the refusal rules ban uncaused decoration;
  `density-and-care.md` then requires crafted layers (treated field, made
  dominant event, composed evidence, factual inscriptions, precise
  furniture). A bare page fails the craft floor as surely as a cluttered one.
- **Copy blacklist** — negation-contrast templates, false-suspense
  corrections, hollow parallelism, marketing abstractions, and fake
  profundity closers are swept with grep before delivery.
- **Pilot before batch** — multi-page work ships 1–3 full-craft pilot pages
  (cover, densest evidence, most unusual) for approval before the rest.
- **Three gates** — proposition (with form challenge and source ledger) →
  HTML master (with required review views) → native editable delivery.
  Unattended runs record the controller policy instead of fabricating
  approval.
- **Measured review gates** — overflow measurement, bottom-edge inspection,
  declared spacing scale, density budget, closing beat, plus full-size /
  thumbnail / copy-hidden / image-hidden views.

## Delivery

Every category ships a native editable deliverable, not just a render:

| Form | Static export | Editable | Interactive |
| --- | --- | --- | --- |
| Poster / key visual | PNG | Figma frames | — |
| Social graphic-text set | PNG per page | Figma, one frame per page | — |
| Slides / deck | PNG per page | Figma or PPTX (user's pick) | interactive HTML, restrained motion |
| Product UI | PNG per state | Figma, one frame per state | interactive HTML, full state flow |

The Figma route is a **migration, not a rebuild**: the bundled
`assets/figma-plugins/dom-migrate` plugin snapshots the approved HTML master
in a browser and creates native Figma frames from the DOM — text nodes with
styled ranges, replaceable image fills, shapes with fills and strokes. Free,
offline, no subscription. PPTX delivery rebuilds natively via python-pptx.
Pipelines: `references/operations/delivery-implementations.md`.

## First use: fill the evidence layer

Two files ship as templates and are empty on purpose:

- `references/style-evidence.md` — the owner's source index, density anchor,
  and selection protocol (the universal refusal list is included);
- `references/workflow/evidence-ledger.md` — tier A–D source weighting.

Until the owner records their own approved work here, the system still
enforces form, gates, density, copy, and review — it just cannot express a
personal voice it has never seen.

## Scripts

Deterministic supporting checks; none of them can approve taste.

```bash
python scripts/validate_design_execution.py <delivery-dir> --poster --figma-required --from-zero
python scripts/audit_html_design.py <master.html> --strict
python scripts/compare_renders.py approved.png figma.png
python scripts/cutout_subject.py input.png output.png
python scripts/test_design_execution.py            # fixture self-test
```

## License

MIT — see `LICENSE`.
