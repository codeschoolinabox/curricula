# Control Flow Event Generators

Seven generators for control flow events. See [DOCS.md](./DOCS.md) for design
decisions.

## Files

- `create-test-event.ts` — condition evaluation (all constructs). Includes
  optional `coercion` field showing `Boolean(value)` when value is not already
  boolean.
- `create-branch-event.ts` — if/else path selection
- `create-iteration-event.ts` — loop iteration start (with forOf-specific
  fields)
- `create-jump-event.ts` — break/continue
- `create-do-event.ts` — do-while body-before-test marker (fires every
  iteration)
- `create-for-initialize-event.ts` — for-loop initialization phase
- `create-for-increment-event.ts` — for-loop update/increment phase
