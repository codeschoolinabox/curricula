# evaluating/debug — Architecture & Decisions

## Why an AsyncGenerator (minimal)

The debug engine is rewritten as an async generator for API consistency with run
and trace. However, the generator is minimal:

- Yields 0-1 events (only on error — RangeError from loop guard or iframe
  access error)
- No SAB pause protocol (iframe, not Worker)
- Returns when the iframe's completion `postMessage` arrives
- Empty/whitespace code: yields nothing, returns immediately

The generator is wrapped by `createExecution` at the `api/` layer for
PromiseLike backward compatibility.

## Why no SAB pause

The debug engine uses an iframe that shares the main thread's event loop. There
is no Worker to pause — the learner's code runs synchronously on the same thread
as the generator consumer. `debugger` statements are the pause mechanism, and
they are controlled by DevTools, not by this engine.

## Why iframe, not Web Worker

`debugger` statements only pause execution when DevTools is open on the main
thread. Workers have no DevTools access — `debugger` is silently skipped. Since
the entire purpose of this engine is interactive step-through debugging, an
iframe is the only viable isolation model.

The iframe provides its own global scope (no variable collisions with the host
page) and is disposable — when removed, everything it allocated is
garbage-collected.

## Why two module script tags

Module scripts inserted into the same document execute in insertion order. The
second script (`postMessage` back to parent) cannot run until the first script
(learner code + `debugger` statements) finishes — including any time the user
spends paused in DevTools.

This gives a reliable "done" signal without polling or timers. The `postMessage`
listener filters by both `event.source` (this iframe's window) and `event.data`
(a unique `callId`), so concurrent `debug()` calls don't interfere.

## Why body-injection loop guards (not comma-in-condition)

The debug engine keeps the body-injection strategy for loop guards:

```text
let loopN = 0;
while (condition) {
  if (++loopN > maxIterations) throw new RangeError(...);
  // learner code
}
```

This is different from the run engine's comma-in-condition approach. The reason:
learners see their code in the DevTools Sources panel during debugging. Separate
`let loopN` declarations and `if (++loopN > max)` checks are readable and easy
to understand. The compact comma-in-condition form (`while (++loop1 > max &&
guard(1), cond)`) would be confusing to see mid-debug.

The line-number shift from body injection is acceptable here because debug error
messages are less critical — the learner is stepping through code in DevTools and
can see exactly where things are.

Loop guard injection uses the shared `guard-loops/` module from
`../shared/guard-loops/`, which supports both injection strategies.

## Why DevTools must be open

`debugger` statements are no-ops when DevTools is closed — the browser skips
them silently and the code runs straight through. This is browser behavior, not
something this engine can change. The `api/debug` wrapper should inform the UI
layer, which should prompt the learner to open DevTools before clicking "debug".

## Why formatCode is removed from the debug pipeline

Previously, the learner's code was run through Prettier after loop guard
injection to restore readability in DevTools. This is no longer needed because:

1. **Formatting is now a pipeline gate** — code must be formatted before
   execution. The `api/debug` wrapper checks format compliance before calling
   this engine. The learner's code is already formatted when it arrives here.
2. **Guard injection preserves formatting** — recast prints guard lines cleanly.
   The learner sees their already-formatted code plus clean guard declarations.
3. **Learners should see their own code** — showing prettier-reformatted code in
   DevTools would differ from what they wrote. Since they already formatted it
   (pipeline gate), what they see in DevTools matches what they submitted.

The `format/` directory is extracted to the top-level `formatting/` module.
