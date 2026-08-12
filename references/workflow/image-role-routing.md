# Image-role preflight and cross-media routing

An uploaded image is an input, not a task type. Before choosing the poster,
slides, social, or product adapter, ask what role the image plays in this task.
Never route every single image to the single-image poster path.

## User-visible first question

Ask this before generation, web search, high-fidelity layout, or final export:

> 这张图在这次任务中是什么角色？
>
> A. 主体 / 底图：作为画面的主要视觉、背景或主视觉载体
> B. 核心项目素材：必须进入成品，用来证明或说明项目内容
> C. 辅助素材：用于氛围、局部、纹理或次要信息
> D. 参考 / 基准素材：只参考构图、材质、色彩、字体或视觉气质

If the user is unsure, recommend one choice and mark it as proposed. Do not
approve it on the user's behalf. Until the role is approved, do not generate,
search, compose, or export.

## Role record

Record the answer in `TASK_BRIEF.md`, `ASSET_LEDGER.md`, and
`DESIGN_CONTROL.md`:

```markdown
Image role status: pending | approved
Image role: base | project-evidence | supporting | reference | mixed | pending
Image placement: background | hero | replaceable-image | not-placed | per-asset | pending
Image role approval evidence:
Image role source/rights:
```

When attached files have different roles, use `Image role: mixed` and
`Image placement: per-asset` in the task-level control record. Then record each
file separately in `ASSET_LEDGER.md` as base, project-evidence, supporting, or
reference with its own placement and rights status. Mixed never means an
individual file has an ambiguous role.

`base` is the only role that may use `background` or `hero` placement. A
`project-evidence` or `supporting` image may use a replaceable image slot but
cannot silently become the canvas background. A `reference` image is
`not-placed` by default.

## Route after role approval

| Image role | Poster / key visual | PPT / deck | Social graphic-text | Product UI |
| --- | --- | --- | --- | --- |
| base | poster adapter + image-as-carrier protocol | slides adapter; use on earned pages | social adapter; cover or earned page only | product UI adapter if it is interface content |
| project-evidence | original asset-driven route | evidence in the relevant slide | evidence in the relevant page | content asset route |
| supporting | original supporting-material route | atmosphere/support only | secondary carrier only | supporting asset route |
| reference | style/reference synthesis only | style/reference synthesis only | style/reference synthesis only | style/reference synthesis only |
| mixed | route each asset separately from the ledger | route each asset separately from the ledger | route each asset separately from the ledger | route each asset separately from the ledger |

The single-image poster protocol is conditional: it loads only when
`Image role: base` and the declared form is `poster` or `key visual`.

## Follow-up questions by role

For `base`, ask whether the image is the full background or the main subject,
then collect title, required copy, theme/proposition, audience/use, canvas,
delivery format, and aesthetic overrides.

For `project-evidence` or `supporting`, ask what the image proves or supports,
what roles are missing, and whether the user permits targeted web search for
those missing roles. Record source, rights, and factual-vs-interpretive status.

For `reference`, ask what quality is being learned and what surface treatment
must not be copied. Keep the image out of the final composition unless the
user later approves a separate content role.

## Reopening rule

Changing the image role reopens Gate 1. Do not reuse the old direction, asset
permissions, or route after a role change.
