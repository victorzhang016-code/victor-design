# Product/UI adapter

## Job

Make a person’s next task, system state, and recovery path unmistakable while
letting the interface inhabit the authored world established by the aesthetic
core.

## Translate the core

Use field, scale, rhythm, material, and color to clarify the task rather than
to decorate a component library. Keep the primary task in the largest continuous
area. Group input, source, inference, output, and correction by the decision
they support. Give atmosphere to surfaces, imagery, type, and motion; keep
controls sober enough to operate.

## Product hardening

Apply UI/UX Pro Max and Impeccable mechanisms here only:

- one clear primary action per action group;
- visible current state, progress, result, and recovery where risk warrants it;
- readable copy, labels, and non-color-only state distinctions;
- responsive recomposition rather than miniature desktop panels;
- keyboard focus, contrast, reduced motion, and semantic control labels;
- honest separation of user input, source evidence, inference, and generated
  output for AI products.

Do not import poster metaphors, fake hardware texture, or editorial microcopy
into controls unless the product task gives them a real operating role.

## Interaction semantics

- Confirmation friction attaches only to consequential or irreversible actions
  (skip, delete, send, publish). Navigation never gets a modal, a sheet, or a
  warning.
- Every decision has both outcome states designed (accept and decline), and
  every state offers a way onward or back — no dead ends.
- A task brief that implies action implies a state flow: receiving/viewing,
  the decision moment, and the post-decision state. One static screen is not a
  state flow.
- Waiting, empty, and error states get the same typographic care as the happy
  path; silence is not feedback.

## Review

Test the real primary task at intended size and a narrow layout. Verify that a
new person can identify what happened, what the system knows, what is uncertain,
and what to do next. Run the authored review first, then deterministic
accessibility and resilience checks, then reconcile without neutralizing the
visual world.

## Delivery

Per the matrix in `operations/execution.md`:

- Ship an interactive HTML build in which every declared state — including
  waiting, empty, and error states — is reachable by click or key, and every
  state transition carries motion feedback that follows the shared motion
  discipline (functional only, 150–400 ms, reduced-motion safe).
- Ship one PNG per state for review, plus an editable Figma file with one
  frame per state: native text and components, replaceable image fills.
- A single static screen recording or a flattened mockup is not delivery.

Production-grade Figma acceptance for UI (check all before release):

- frames use auto-layout with real gap/padding, not absolute stacks;
- repeated elements (chips, buttons, bars) exist as components with
  instances, not copies;
- icons are vectors, images are replaceable fills;
- layer names are semantic (the DOM's class names), no "Frame 127";
- every declared state has its own frame, and each frame passes the
  equal-scale comparison against its approved render.

The bundled dom-migrate plugin's UI structural mode
(`assets/figma-plugins/dom-migrate/`, README › UI structural mode) produces
this shape from the approved HTML master; the repair pass closes the rest.
