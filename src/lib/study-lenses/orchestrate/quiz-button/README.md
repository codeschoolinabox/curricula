# quiz-button

The omnipresent region's **generative** affordance: a button that calls
`socratize` on the live embodiment to produce Socratic questions about the
program, plus the surface that renders them. Omnipresent (always available,
program-dependent) and generative (it produces something _about the program_) —
distinct from the dock's run/debug surface and from the meta embedded guide.

The canonical placement lives at
[`../README.md` § The omnipresent region](../README.md) — that section is the
contract; this README is the module-local orientation.

## What lives here

```text
quiz-button/
  README.md   (this)
  DOCS.md     architectural sketch + Mermaid
  index.tsx   <QuizButton> — presentation only
  tests/      vitest jsdom tests
```

## The component

`<QuizButton>` is **presentation only**: it renders the button + the
question-render surface and routes the click up. The orchestrator
([`../index.tsx`](../index.tsx)) owns the call into the **real** socratizing
library ([`../lib/socratizing/`](../lib/socratizing/)) and hands the resulting
questions back as a prop. (`socratize` is the domain verb for the call into that
library's `analyzeMicroDecisions` export — there is no symbol literally named
`socratize`.) This module imports no `embody`, dispatches no bus events, and
holds no orchestrator state.

The socratizing library is built and real (not a mock); the Quiz button wires to
it. The heavier block-model Quiz **engine** is a separate later DDD (deferred
backlog) — the button does not wait on it.

Props (full contract in [`./index.tsx`](./index.tsx) JSDoc):

| Prop         | What it carries                                                         |
| ------------ | ----------------------------------------------------------------------- |
| `questions`  | the socratize output to render (orchestrator-supplied; null before run) |
| `generating` | whether a generation is in flight                                       |
| `onQuiz`     | the button click, routed to the orchestrator's socratize call           |

## Selectors

`data-orchestrator-quiz` — the Quiz button (full list in
[`../README.md` § Data attributes](../README.md)). The question-render surface's
own selector + shape is a Phase-1 presentational choice ("panel" stays reserved
for the phases panel, so the render surface is named otherwise).

## Durable rules

- **Generative, not a lens.** The Quiz button is a cross-phase tool, not a
  registered lens; it never enters lens mode and carries no `LensModule.phase`.
- **Owns no generator logic.** The orchestrator calls `socratize`; this module
  renders. Swapping `socratize` for the future Quiz engine is an
  orchestrator-side change — the button's prop contract is the plug-and-play
  seam.
- **Program-dependent.** Unlike the meta embedded guide, Quiz output is _about
  the current program_ (it reads the live embodiment via the orchestrator's
  call).

## Navigation

- **Parent**: [`../README.md`](../README.md) — § The omnipresent region.
- **Sketch**: [`./DOCS.md`](./DOCS.md).
- **Generator**: [`../lib/socratizing/`](../lib/socratizing/) (the real library
  the orchestrator calls).
