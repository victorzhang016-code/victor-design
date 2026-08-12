# Victor Design

Victor Design is a human-centered visual design workflow for AI agents. It understands the subject and the task first, then chooses the form, content, and visual language before delivering work that can be reviewed and edited.

In a recorded four-track evaluation, it outperformed most of seven world-class design skills and received a first-place public-vote finish.

## Use it for

- Posters and key visuals
- Social media graphics
- Product UI
- Presentations and decks

## What makes it different

1. **Form before styling** — A design brief is classified before production: one poster, a graphic set, a multi-state UI flow, or a presentation.
2. **Real material first** — Workspace material and project facts come before generation. Generated images are approved supplemental material, never a substitute for authored structure.
3. **A complete production and review chain** — Layout constraints, three hard delivery gates, and visual review keep the output accountable. Built-in guardrails also reject generic AI visual and copy patterns.
4. **Editable delivery** — Posters and graphic sets ship as editable Figma frames by default; product UI keeps its HTML interaction flow.
5. **HTML to Figma** — The companion DOM Migrate v3 plugin converts Victor Design's controlled UI HTML into editable Figma Frames, Auto Layout, Grid, Text, Image, components, and valid Hug / Fill / Fixed sizing. Complex CSS effects are rasterized only at the smallest necessary layer while the main structure stays editable.

DOM Migrate v3 is designed for controlled Victor Design UI HTML. It does not promise lossless migration for arbitrary websites.

## Install

```bash
git clone https://github.com/victorzhang016-code/victor-design.git ~/.agents/skills/victor-design
```

Windows PowerShell:

```powershell
git clone https://github.com/victorzhang016-code/victor-design.git "$HOME\.agents\skills\victor-design"
```

The entry point is `SKILL.md`. MIT License.

## First run

The skill ships with the author's default style evidence, so it has a real
voice immediately. If you have approved work of your own, open
`references/style-evidence.md` and replace the default base with evidence
from your own finished pieces — the "Make it yours" section walks through
it. Teams adopting the system should treat this swap as onboarding step one,
not an advanced option.

## SkillHub release

The repository includes development and test files. Prepare a clean SkillHub source directory first:

```bash
python scripts/prepare_skillhub_release.py --output /tmp/victor-design-skillhub
```

Then pass that directory to `redskillhub-upload` for dry-run, review, and submission.
