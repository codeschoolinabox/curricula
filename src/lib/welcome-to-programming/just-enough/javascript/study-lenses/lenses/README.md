# lenses

Lens-module implementations for the study-lenses orchestrator. Each
subdirectory is one lens — a default-export `LensModule` that takes a
code string and returns a `LensMount` (a framework-agnostic detachable
DOM handle). Lenses are always **terminal**: exactly one per pipeline,
never chained.

> **Status — Increment 9 in progress.** Currently ships:
> [`editor`](./editor/) — a **stub** that fills the default and
> unknown-name fallback role until the CodeMirror replacement lands in
> Increments 15+. Increment 9 Pre-work C-2 adds a `highlight/` sibling
> (also a stub) so the lens-picker has a second option to switch
> between. Real lens implementations land in Increments 15–18 per
> [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).

## What lives here

| Subdir                       | Lens name   | Tier              | Status                                                            |
| ---------------------------- | ----------- | ----------------- | ----------------------------------------------------------------- |
| [`editor/`](./editor/)       | `editor`    | text-only static  | Stub. CodeMirror lands in Increment 15+.                          |
| `highlight/` (Inc-9 setup)   | `highlight` | text-only static  | Stub will land during [Increment 9 setup](../../.planning-handoffs/03-orchestrator-and-contracts.md), before the toolbar TDD cycles. Real Shiki/Prism in Increment 15+. |

`blanks/`, `parsons/`, `trace-table/` and the remaining trial lenses
land per the Increment 15–18 schedule. Each new lens follows the
contract described below — no orchestrator change is required when a
new lens is registered.

## Module shape

Every lens here exports default a frozen `LensModule`:

```typescript
type LensModule = {
  name: string;                                                 // unique across registry
  lens: (code, config?) => LensMount | Promise<LensMount>;      // terminal — code in, DOM out
  config: (overrides?) => LensConfig;                           // hashable, primitive-only
  recommend: (analysis) => ReadonlyArray<Recommendation>;       // self-describing relevance
};
```

The contract is enforced at the type level in
[`../types.ts`](../types.ts). `LensConfig` is restricted to
`Record<string, SerializableValue>` so cache keys hash deterministically;
callbacks and instance state belong on `LensMount` or the EventBus, not
in config.

## Three-tier classification

Authoritative table lives in
[`../README.md`](../README.md) §Three-tier-lens-classification. Quoted
verbatim here for navigation:

| Tier                  | Requires                  | Examples                       | Error behavior                  |
| --------------------- | ------------------------- | ------------------------------ | ------------------------------- |
| Text-only static      | Raw text (no parse)       | parsons, highlight, copy-type  | Always available                |
| AST-dependent static  | Valid parse (no execution) | blanks, variables, ask        | Syntax errors → relevance 0     |
| Dynamic               | Valid parse + execution   | run, trace, debug, trace-table | Syntax errors → relevance 0     |

Tier informs `recommend()`: a parse-failed snippet drops AST-dependent
and dynamic lenses to relevance 0. The `editor` stub is text-only
static at the runtime level; the real CodeMirror replacement remains
text-only static (it does not require a successful parse to render).

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Subdirectory-specific rules:

- One subdir per lens, named `kebab-case`. Subdir name does NOT have
  to match the lens module's `name` field, but should match in
  practice for navigability.
- Each lens subdir owns its own `tests/`, `README.md`, and `DOCS.md`.
- A lens module is reachable through the default registry only after
  it is imported and registered in
  [`../orchestrator/default-registry.ts`](../orchestrator/default-registry.ts).

## Navigation

- **Parent:** [`../README.md`](../README.md) — study-lenses overview
- **Architectural sketch:** [`../DOCS.md`](../DOCS.md)
- **Types:** [`../types.ts`](../types.ts) (`LensModule`, `LensMount`,
  `LensConfig`, `Recommendation`)
- **Migration plan:** [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md)
