# engine/testing

Engine-owned test support: the trivial reference logic the engine's own suites
run against, and the thin worker entry that wires it up. This is why the
engine's tests depend on no consumer — the reference logic stands in for the
evaluators without knowing anything about them.

## Structure

| Path                        | Purpose                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `reference-worker-setup.ts` | Config-driven worker logic: emit/call/getConfig globals, halt stamping |
| `reference-thread-logic.ts` | Drop-a-sentinel / yield-the-rest, echo calls, limit-shape refiner      |
| `test-worker-entry.ts`      | The thin-entry pattern: bootstrap wired to the reference setup         |
| `failing-worker-entry.ts`   | A deliberately-throwing entry: pins the worker-crash settlement path   |
| `fake-transport.ts`         | The same-thread reference double: clones every payload, sync calls     |

## Navigation

- [DOCS.md](./DOCS.md) — why the reference logic is config-driven
- [../README.md](../README.md) — the engine module: public API, glossary
- [../worker/README.md](../worker/README.md) — the transport internals it
  exercises
