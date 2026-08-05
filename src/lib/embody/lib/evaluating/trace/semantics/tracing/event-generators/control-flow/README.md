# Control Flow Event Generators

Seven generators producing the domain fields for control-flow trace events
across three categories — `conditional` (if / ternary), `loop` (while / doWhile
/ for / forOf), and `jump` (break / continue). See [DOCS.md](./DOCS.md) for
design decisions.

## Files

- `create-test-event.ts` — condition evaluation. Splits on the resolved kind: an
  if/ternary test is a `conditional` event, a while/doWhile/for test is a `loop`
  event. Includes optional `coercion` showing `Boolean(value)` when the value is
  not already boolean.
- `create-branch-event.ts` — if/else path selection (`conditional`, kind `if`)
- `create-iteration-event.ts` — loop iteration start (`loop`; with
  forOf-specific fields)
- `create-jump-event.ts` — break/continue (`jump`)
- `create-do-event.ts` — do-while body-before-test marker (`loop`, kind
  `doWhile`; fires every iteration)
- `create-for-initialize-event.ts` — for-loop setup phase (`loop`, event
  `setup`, kind `for`)
- `create-for-increment-event.ts` — for-loop update/increment phase (`loop`,
  event `increment`, kind `for`)

Each generator produces DOMAIN FIELDS ONLY (category, kind, event, payload); the
dispatcher stamps the base fields (step, semantics, nodePath, type, loc,
source).
