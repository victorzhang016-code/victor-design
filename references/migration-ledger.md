# Migration ledger

Historical note only. This file does not route runtime behavior.

## V3 correction — 2026-07-28

The prior ledger claimed that several detailed modules had moved successfully,
but their target files were absent. The result was a reduced runtime that kept
high-level principles while losing active anti-AI, asset, layout, HTML, Figma,
and approval controls.

V3 replaces those broken references with active modules:

- `style-evidence.md` restores Victor's source-indexed color, layout, type,
  material, and refusal evidence to the default chain.
- `operations/execution.md` owns approval, source chain, HTML, and Figma release
  requirements.
- `operations/review.md` owns visual veto and HTML declaration requirements.
- `scripts/validate_design_execution.py` and `scripts/audit_html_design.py`
  validate concrete evidence and structural red flags; they do not certify taste.

Do not reintroduce a migration claim without verifying that its file exists and
is linked from the execution chain in `SKILL.md`.

## v3.1 cross-carrier completion — 2026-08-12

The 夜班之后 single-image poster exposed a second overcorrection. The system
could reject generic decoration yet still allow a visibly crude user-facing
draft: untreated image, title, faint lines, and low relational density. Victor
set a stronger benchmark using human-made contemporary posters and clarified
that lines, icons, blocks, extra copy, and material are valid when selected
from theme and emotion, richly authored, and integrated into the composition.

Active changes: theme-to-technique reasoning in `aesthetic-core.md`; relational,
information, and design-act density in `workflow/density-and-care.md`; the
Victor-approved contemporary poster evidence in `style-evidence.md`; reference
decomposition in `optional/reference-synthesis.md`; a formal
`adapters/graphic-text.md`; carrier-specific updates for poster, slides, and
product UI; v3.1 control fields; arbitrary stable direction IDs; mixed image
roles; HTML `data-vds-action` auditing; and `render_artifact_views.py` for
cross-surface review captures. The referenced screenshots remain unbundled
because their rights and authorship were not verified.

## Density retro — 2026-08-04

The FELD PLAYBACK defense deck (30 pages) shipped a first master that the user
called severely under-designed; six repair rounds followed, and the step change
came only when the reference poster's actual HTML source (fonts, filter
parameters, components) was used directly.

User-adjudicated root cause: the skill's rule mass was almost entirely
prohibitions against uncaused decoration, with only abstract positive
principles. Executed literally, that produces austerity — system fonts, flat
fields, bare-line diagrams, no inscriptions, no material — i.e. the absence of
design, not restraint. Secondary causes: no reference source probe (fonts and
components existed locally but were found three rounds late), no pilot-page
gate before batching 29 pages, delegation briefs without reference images or
density targets, and acceptance limited to deterministic checks.

Fixes landed in active modules: new `workflow/density-and-care.md` (six-layer
craft model, density calibration, per-page care pass, font-sourcing clause);
counter-clauses in `aesthetic-core.md`; factual-inscription clarification in
`copy-discipline.md`; refusal preamble and density-evidence section in
`style-evidence.md`; craft floor and pilot pages in `adapters/slides.md`;
Gate 1 density-target record, Gate 2 pilot gate, and delegation-brief
requirements in `operations/execution.md`; matching block conditions in
`operations/three-gates.md`; chain registration in `SKILL.md`'s execution
chain (the module index has since been merged back into `SKILL.md`).

## v3.2 density-methodology consolidation — 2026-08-12

The 夜班之后 unattended test produced a poster with perfect paperwork but a
visually crude result: three type levels, three anchor regions, an arbitrary
polygon window over the image, and no craft family. Root cause: the density
rules only vetoed below a floor, the benchmark chain could be skipped, and the
validators checked declarations rather than completion.

Changes: `workflow/density-and-care.md` rewritten as the single source of the
richness methodology (principle chain, thin-brief playbook, benchmark
obligation, density-targets table); `adapters/poster.md` absorbed the
single-image-poster protocol and gained hard specs (five type levels, four
anchor regions, full-bleed default, craft family, mandatory benchmark); new
`optional/case-night-shift-poster.md`; `operations/review.md` gained the
benchmark-comparison hard gate; `SKILL.md` compressed and absorbed the module
index; `module-index.md` and `workflow/single-image-poster.md` deleted;
validator extensions in `scripts/` proceeded on a separate track.

## v3.3 direction-stage execution gap — 2026-08-12

The v3.2 unattended rerun produced Gate 1 direction previews with perfect
calibration tables — six levels, five anchors, named craft families such as
"low-light long-take scan" — but renders that were merely prose stacked over
graded photos: no visible craft family, no conceit, several same-register
lyrical paragraphs standing in for a type system, broken Chinese line breaks,
and uncaused hairlines. Root cause: v3.2 made the vocabulary declarable but
did not require direction claims to be visible in pixels at Gate 1, and
"levels" were counted rather than role-differentiated.

Changes: `adapters/poster.md` direction selection now requires a named
conceit and pixel-verifiable claims (a preview that is copy over a graded
photo is not a direction); content contract now defines levels as distinct
jobs with size contrast, at most one lyrical line, and Chinese
micro-typography rules; `workflow/density-and-care.md` draft gate fails
claims that exist only in the control record; `operations/three-gates.md`
Gate 1 blocks such directions; `operations/review.md` veto list covers
prose-stack type systems and invisible craft families;
`copy-discipline.md` caps one lyrical line per canvas.

Follow-up the same day: the reference boards that caused the original manual
step-change are now shipped inside the skill as
`assets/benchmarks/poster-board-1..4.png` with the guide
`optional/poster-benchmark-boards.md`. Rationale: prose rules had failed to
transfer a visual standard — the leap came from *viewing* references. The
benchmark obligation in `workflow/density-and-care.md` and
`adapters/poster.md` now explicitly requires viewing the boards when the user
supplies no references.

Same-day tightening: the "single proposed direction when visual intent is
unambiguous" clause in `operations/three-gates.md` was treated as a default
path and a Gate 1 run shipped one direction. The clause is removed — three
genuinely different rendered directions are mandatory unless the user
explicitly instructs otherwise; matching "up to three" wording in
`aesthetic-core.md` and `adapters/poster.md` changed to "three".
