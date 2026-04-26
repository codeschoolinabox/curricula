# transforms

Transform-module implementations for the study-lenses orchestrator.
Each subdirectory will be one transform — a default-export
`TransformModule` that maps a code string to a code string. Transforms
are pure (no DOM, no async, no side effects), continue the pipeline
(never terminal), and never produce UI.

> **Status — empty in Phase 1.** No transform modules ship today. The
> first transforms (`format`, `loopGuard`, `translate`) land during
> WS4 lens migration per
> [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).
> Until then, every shipped pipeline is `transforms: []` + a single
> terminal lens.

## What will live here

| Planned subdir | Transform name | Purpose                                                                | `onFailure` mode |
| -------------- | -------------- | ---------------------------------------------------------------------- | ---------------- |
| `format/`      | `format`       | Prettier-driven cosmetic reformat. Untransformed code is still safe.   | `'fallthrough'`  |
| `loop-guard/`  | `loopGuard`    | AST instrumentation that aborts runaway loops at execution time.       | `'abort'`        |
| `translate/`   | `translate`    | JS ↔ pseudocode translation. Failure means the rewrite did not apply.   | `'abort'`        |

The `onFailure` column captures the orchestrator's behavior when the
transform throws — see [`../DOCS.md`](../DOCS.md) §Execution phases /
2. Pipeline and §Structural constraints for the contract.

## Module shape

```typescript
type TransformModule = {
  name: string;                                 // unique across registry
  transform: (code, config?) => string;         // pure, code in → code out
  config: (overrides?) => TransformConfig;      // hashable, primitive-only
  onFailure?: 'abort' | 'fallthrough';          // default 'abort' at orchestrator
};
```

The contract is enforced at the type level in
[`../types.ts`](../types.ts). `TransformConfig` is restricted to
`Record<string, SerializableValue>` (primitives + readonly arrays of
primitives) so config hashes are deterministic; callbacks and instance
state belong on the EventBus, not in transform config.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Subdirectory-specific rules:

- One subdir per transform, named `kebab-case`.
- A transform module is reachable through the default registry only
  after it is imported and registered in
  [`../orchestrator/default-registry.ts`](../orchestrator/default-registry.ts).
- **No DOM imports, no React, no async.** Transforms are pure
  string-to-string functions and must be testable in vitest **without**
  `jsdom`. This is the single most-load-bearing constraint that
  separates transforms from lenses — break it and the orchestrator's
  cache invariants no longer hold.

## Navigation

- **Parent:** [`../README.md`](../README.md) — study-lenses overview
- **Architectural sketch:** [`../DOCS.md`](../DOCS.md) §Execution phases (2. Pipeline)
- **Types:** [`../types.ts`](../types.ts) (`TransformModule`,
  `TransformConfig`, `TransformFailureMode`)
- **Migration plan:** [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md)
