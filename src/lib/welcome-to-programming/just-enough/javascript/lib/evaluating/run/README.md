# evaluating/run

Executes JeJ code in a Web Worker with trapped globals, emitting an
event stream and resolving to a structured result. This is the
low-level execution engine — it does not validate or enforce language
levels. A higher-level wrapper (`api/run`) handles config resolution
and static validation before calling this function.

## Structure

| File                      | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `types.ts`                | Worker message protocol, event types, `IoMocks`             |
| `run.ts`                  | Public entry: `run(code, { seconds?, iterations?, io? })`   |
| `create-worker-script.ts` | Generates self-contained worker JS string                   |
| `worker-protocol.ts`      | SharedArrayBuffer encode/decode utilities                   |

## Glossary (ubiquitous language)

These terms propagate into types, JSDoc, DOCS.md, tests, and this
README. Use them consistently.

- **IO mock** — consumer-provided replacement for one of the
  runtime's IO hooks (`prompt`, `alert`, `confirm`, or a `console`
  method). Each mock is async-compatible — sync returns work, async
  returns are awaited before execution continues.
- **Native IO wrapper** — the default implementation of an IO hook,
  delegating to `window.prompt` / `window.alert` / `window.confirm`
  or the corresponding `console.*` method. Used for any hook the
  consumer omits.
- **Effective IO** — the resolved `{ prompt, alert, confirm, console }`
  table used for a single invocation. Each slot is either the
  consumer's mock or the native wrapper. Built once at the start of a
  run.
- **IO event** — a `RunEvent` whose generation involves an IO hook
  (`LogEvent`, `AssertEvent`, `AlertEvent`, `ConfirmEvent`,
  `PromptEvent`, or `ConsoleEvent` for other console methods).
  `ErrorEvent` is not an IO event.
- **Identical-stream guarantee** — the sequence and shape of
  `RunEvent`s emitted by a run is unaffected by which slots in the
  Effective IO are mocks vs. native wrappers. A consumer observing
  only the event stream cannot distinguish a mocked IO call from a
  native one.

## Public API

```ts
run(
  code: string,
  options?: {
    seconds?: number;    // default 5 — cumulative execution time
    iterations?: number; // optional loop-guard limit
    io?: IoMocks;        // per-hook mocks; unspecified slots use natives
  }
): AsyncGenerator<RunEvent, RunResult>
```

- **`code`** — JavaScript source to execute (assumed valid — no
  parsing or validation happens here).
- **`options.seconds`** — cumulative execution time limit. Pauses while
  the generator is suspended at a `yield` AND while an IO callback is
  being awaited. Learners can examine events indefinitely without
  triggering a timeout.
- **`options.iterations`** — when set, injects comma-in-condition loop
  guards into while loops via AST rewrite (zero line shift).
- **`options.io`** — optional mocks for IO hooks. Each slot is
  independently overridable; omitted slots fall back to the Native IO
  wrapper. See § IO mocking.
- **Yields** — `RunEvent` objects one at a time, pausing the worker
  between events via the SAB pause protocol.
- **Returns** — `RunResult` (frozen `{ ok, error?, logs: RunEvent[] }`)
  on completion.

Wrapped by `createExecution` (from `../shared/`) at the `api/` layer
to produce an `Execution<RunEvent, RunResult>` with `PromiseLike` +
`AsyncIterable` + `.cancel()`.

## IO mocking

The consumer overrides any subset of IO hooks; the rest fall back to
Native IO wrappers:

```ts
run(code, {
  io: {
    prompt: async (message, defaultValue) =>
      showStyledDialog(message, defaultValue),
    // alert, confirm, console.* omitted → Native IO wrappers used
  },
});
```

### Order for a `prompt` call

1. Learner code calls `prompt("name?")`.
2. Worker trap posts an `io-request` message to the main thread and
   blocks on `Atomics.wait`.
3. Main thread invokes `effectiveIo.prompt("name?", undefined)` and
   awaits the result. (Sync callbacks resolve in one microtask; async
   callbacks resolve when the consumer's UI completes.)
4. Main thread writes the response to the SharedArrayBuffer and calls
   `Atomics.notify`.
5. Worker unblocks, reads the response, constructs a `PromptEvent`
   carrying the return value, and posts it.
6. Main thread yields the `PromptEvent` to the generator consumer.

`alert` and `confirm` follow the same order. `console.*` methods
follow a simpler path: the callback fires before the event is yielded
(no SAB round-trip, since console hooks have no return value to
deliver back to the worker).

**All IO callbacks are awaited.** Sync callbacks cost one microtask;
async callbacks pause the worker for however long the Promise takes
to resolve. The cumulative timer pauses during each await so consumer
UI interactions (custom dialogs, typewriter animations) do not count
against execution time.

## Trapped globals

All traps are always defined in the worker — there is no
config-driven trap selection. Which implementation fires on the main
thread is determined by the Effective IO table.

| Global                | Event produced                                |
| --------------------- | --------------------------------------------- |
| `console.log`         | `LogEvent` — args, line                       |
| `console.assert`      | `AssertEvent` — args, line                    |
| `console.*` (others)  | `ConsoleEvent` — method, args, line           |
| `alert`               | `AlertEvent` — args, line                     |
| `confirm`             | `ConfirmEvent` — args, return value, line     |
| `prompt`              | `PromptEvent` — args, return value, line      |

## How it works

1. Resolve **Effective IO** from `options.io` + Native IO wrappers.
2. If `options.iterations` is set, inject comma-in-condition loop
   guards into while loops via AST rewrite (zero line shift).
3. Create a SharedArrayBuffer for synchronous IO and pause protocol.
4. Generate a self-contained worker script with trapped globals +
   pause logic.
5. Send a **setup** message (delivers SAB; worker defines traps).
6. Send an **execute** message (delivers learner code).
7. Worker posts each event, then pauses via `Atomics.wait` on the
   pause flag.
8. Generator `next()` resumes the worker via `Atomics.notify` — yields
   one event to the consumer.
9. Handle `io-request` by awaiting `effectiveIo.{prompt|alert|confirm}`
   and writing the response to the SAB.
10. Handle streamed events by awaiting the matching
    `effectiveIo.console.{method}` (if any) before yielding.
11. Timeout tracks cumulative execution time: paused while yielded
    AND while awaiting any IO callback.
12. Return frozen `RunResult` on completion, timeout, or iteration
    limit.

## Key design decisions

- **Effective IO table**: consumer-provided mocks are merged with
  Native IO wrappers at invocation time. The worker is unaware — it
  sees the same event-emission path regardless. This is what gives
  us the identical-stream guarantee.
- **AsyncGenerator**: yields events one at a time with SAB pause
  between each. Enables live streaming to UI and step-through
  consumption. Wrapped by `createExecution` for `PromiseLike`
  (batch) compatibility.
- **Comma-in-condition loop guards**:
  `while (++loop1 > max && guard(1), cond)` — zero line shift.
  Counter globals declared in worker setup, not per-loop.
- **Cumulative timeout**: tracks execution time only. Paused during
  SAB wait AND during IO-callback await so learners can examine
  events — or drive a styled dialog — indefinitely.
- **Errors are events**: runtime errors (`phase: 'execution'`) and
  construction errors (`phase: 'creation'`) appear in the logs
  array. The consumer always gets `RunEvent[]`, never a thrown
  exception.
- **SAB + Atomics for IO**: `prompt` / `confirm` / `alert` block the
  worker via `Atomics.wait` while the main thread runs the Effective
  IO callback (styled or native). Requires COOP/COEP headers on the
  hosting site. Returns an error event if SAB is unavailable.
- **SAB pause protocol**: worker pauses after each event via
  `Atomics.wait` on control slot 4 (pause flag). Generator `next()`
  resumes via `Atomics.notify`. See `../shared/DOCS.md` for the full
  6-slot layout.
- **Two-step worker protocol**: `setup` and `execute` are separate
  messages so trap-definition code does not affect learner-code line
  numbers.
- **No validation or enforcement**: this module only executes.
  Language-level validation and config resolution belong to the
  wrapper above.

## Platform requirements

SharedArrayBuffer requires these HTTP headers on the hosting page:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If SAB is unavailable, `run` returns a single `ErrorEvent` with
`name: 'EnvironmentError'` rather than throwing.

## Sandbox

To test interactively, start the Vite dev server from the project
root:

```sh
npx vite --config src/lib/just-enough-javascript/evaluating/run/vite.sandbox.config.ts
```

Then open `http://localhost:5173/sandbox.html`.
