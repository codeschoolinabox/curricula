# scaffold

The scaffolding level: a trivially conforming language level that tests and
sandbox pages inject to exercise the level machinery — the selector, the fit
marks, the enforcement mask — without any real curriculum. It is
**injected-only**: never on the built-in roster, so it can never enter a
production selector.

The region [README](../README.md) owns the level contract; this document owns
what this level curates — which is deliberately almost nothing.

## The slice

The scaffold level admits modules only, and its validator flags exactly one
thing: `debugger` statements. That one rule is chosen so every fit mark is
reachable with trivial programs:

- **fits** — any parsing module without a `debugger` statement.
- **does-not-fit** — add a `debugger` statement.
- **not-applicable-for-type** — toggle the snippet type to script.
- **undetermined** — break the parse.

Each violation carries the node type, a plain message, the parser's own
character offsets, and the node's path — the full `Violation` contract, honestly
populated.

## What it ships

The complete spine, minimally: `key: 'scaffold'`; a display label; the
deterministic `validate`; `snippetTypes: ['module']`; short reference and
notional-machine docs strings (enough for hover to show something real); stub
editor-support channels; an empty model-builders record. A level ships no lenses
— this one especially.

## Navigation

- Region root: [`../README.md`](../README.md) — the level contract and the
  recipe this directory follows.
- [`DOCS.md`](./DOCS.md) — why this slice is shaped this way.
- Sibling: [`../jej/`](../jej/README.md) — the first real level.
