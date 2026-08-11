# Delivery implementations

How to actually build what Gate 3 (`execution.md`) requires. Load this when a
deliverable reaches Gate 3. Rules live in `execution.md` / `three-gates.md`;
this file is the pipeline.

## Route detection (run first)

1. **Figma**: check availability in order —
   a. **the bundled dom-migrate plugin** (`assets/figma-plugins/dom-migrate/`):
      snapshot the approved master in a browser, package with `package.py`,
      import the JSON in Figma. This migrates the DOM instead of rebuilding
      it and works offline, free, forever;
   b. other HTML→Figma importers (free browser extensions or self-hosted
      open-source plugins; paid ones only when the user already subscribes);
   c. Figma MCP / plugin API or REST + token for direct writes.
   If none is available, stop and tell the user; do not silently ship
   flattened images.
2. **PPTX**: `python-pptx` for authoring; LibreOffice headless
   (`soffice --headless --convert-to`) for verification renders. If neither
   exists, install into an isolated environment or declare the gap.
3. **Interactive HTML**: no dependency — plain HTML/CSS/JS.

## Figma pipeline (per frame)

One frame per page (set/deck) or per state (UI), at the exact approved canvas
size.

### Route A — automated HTML import (preferred)

Import the approved HTML master directly instead of rebuilding by hand. This
is a *migration*, not a reconstruction: text arrives as text nodes, flex
containers as auto-layout, images as fills.

- Tooling, in order: the bundled **dom-migrate** plugin
  (`assets/figma-plugins/dom-migrate/`, see its README for the
  snapshot → package → import pipeline); other free importers; a paid
  importer only when the user already subscribes.
- Multi-page/state work: one frame per page or state (the master's static
  single-page mode, e.g. `?p=N`, keeps each page importable on its own).
- Prerequisites: all fonts installed in the Figma environment; images reachable
  as local/relative resources.

### Route B — manual rebuild (fallback)

Only when no importer is available or the import of a critical frame fails.
Build bottom-up, matching the approved HTML layer order: treated field →
image fills (uploaded, replaceable) → rules/shapes → text layers. Name every
layer semantically. Never substitute fonts silently — use the outline strategy
in `figma-fidelity.md`.

### Repair pass (mandatory after either route)

Import gives geometry, not semantics. Before release:

1. Read `figma-fidelity.md` and inventory risks: custom fonts, CSS
   masks/blends/repeating textures, perspective composites, crop focal points.
2. Rename imported layers semantically; delete import artifacts (wrapper
   frames, duplicate backgrounds).
3. Verify text nodes kept family/weight/size/line-height/tracking; fix or
   outline per `figma-fidelity.md`.
4. Rebuild whatever the import flattened — masks, blends, filters — or isolate
   them as raster layers with editable sources kept beside the file, declared
   in the node audit.
5. Export each frame as PNG and run `scripts/compare_renders.py` against the
   approved render at equal scale. Fix drift before release; record the node
   audit and comparison in the Gate 3 fields.

## PPTX pipeline

1. Slide size from the deck canvas: 1920×1080 px → 13.333×7.5 in. Conversion:
   1 px = 0.75 pt.
2. Rebuild each approved page as a native slide: background fill, positioned
   text frames (family/size/weight/color/line spacing), native shapes, and
   pictures as replaceable image parts. A pasted page render is not editable
   delivery.
3. Verification: render the PPTX via LibreOffice to PNG/PDF, compare page by
   page with the approved renders (`compare_renders.py`), fix font and
   position drift.
4. Record template choice, fonts embedded or substituted, and the comparison
   in Gate 3.

## Interactive HTML pipeline

Shared constraints (from the motion discipline): 150–400 ms, one easing,
function only, `prefers-reduced-motion` honored, no autoplay loops.

**Slides**: one self-contained file.

- One `<section>` per page; navigation by arrow keys, click zones, and swipe.
- Transitions: opacity + small translate on enter/exit, applied to the page,
  then to primary content blocks with a short stagger — reading order, not
  decoration.
- A quiet progress indicator (page n/N) that matches the static export
  numbering.
- Reduced-motion media query collapses all transitions to instant.
- Keep the `?p=N` static-render mode so headless screenshots of each page
  remain possible.

**Product UI**: state flow build.

- One route per declared state (hash routes are fine): entry, decision,
  confirmation, result, waiting, empty, error — every state declared at Gate 1
  must be reachable by click or key.
- Every interactive element gives visible feedback; transitions mark state
  changes.
- Each state must also render standalone (`?state=name`) for the per-state
  PNG export.

## Release verification

- `compare_renders.py` at equal scale for every translated frame/page.
- The interactive build gets a click-through of every route plus a console
  error check.
- All of this is evidence, not taste approval: Gate 3 still releases only on
  the user's approval of the comparison.
