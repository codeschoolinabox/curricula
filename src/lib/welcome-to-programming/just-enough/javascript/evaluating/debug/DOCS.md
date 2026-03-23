# evaluating/debug — Architecture & Decisions

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

## Why loop guards are AST transforms

Infinite loops in an iframe freeze the entire page (they share the main thread's
event loop). Unlike the `run` and `trace` engines, there's no
`worker.terminate()` available.

Loop guards are injected as AST transforms before execution:

```text
// Before each while loop body:
let loopN = 0;
if (++loopN > maxIterations) throw new RangeError(...);
```

This is simpler and more reliable than runtime wrappers — it works at the
statement level, requires no state management beyond a counter, and the
`RangeError` is caught by the `api/debug` wrapper as an `iteration-limit` error.

See [guard-loops/README.md](./guard-loops/README.md) for the AST transform
details.

## Why DevTools must be open

`debugger` statements are no-ops when DevTools is closed — the browser skips
them silently and the code runs straight through. This is browser behavior, not
something this engine can change. The `api/debug` wrapper should inform the UI
layer, which should prompt the learner to open DevTools before clicking "debug".

## Why code is formatted before injection

The learner's code is run through Prettier (`prettier/standalone`) after loop
guard injection and before iframe injection. Loop guards add variable
declarations and if-statements that disrupt the learner's original formatting —
formatting restores readability so the code in DevTools Sources panel is clean
and inspectable.
