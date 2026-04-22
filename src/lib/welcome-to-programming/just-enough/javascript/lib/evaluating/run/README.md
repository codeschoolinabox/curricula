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
  returns are awaited before learner execution continues.
- **Native IO wrapper** — the default implementation of an IO hook,
  delegating to `window.prompt` / `window.alert` / `window.confirm`
  or the corresponding `console.*` method. Used for any hook the
  consumer omits.
- **Resolved IO** — the `{ prompt, alert, confirm, console }` table
  built once per invocation. Each slot is either the consumer's mock
  or the Native IO wrapper. The worker is unaware of which — it always
  sees the same event-emission path.
- **IO event** — a `RunEvent` whose generation involves an IO hook
  (`ConsoleEvent`, `AlertEvent`, `ConfirmEvent`, `PromptEvent`).
  `ErrorEvent` is not an IO event.
- **Shape-identical guarantee** — the sequence, event tags, and `args`
  structure of `RunEvent`s emitted by a run is unaffected by which
  slots in the Resolved IO are mocks vs. native wrappers. Return values
  may differ (they reflect actual IO interaction), but the event shape
  does not.
- **IO execution model** — ALL IO hooks (`prompt`, `alert`, `confirm`,
  and every `console` method) hold learner script execution until the
  hook's callback completes. There is no fire-and-forget category.
  Async mocks let the platform (DOM, network, etc.) do its work without
  the learner's script noticing the difference from a native call.

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

### IO execution model

All IO hooks — `prompt`, `alert`, `confirm`, and every `console` method
— hold learner script execution until the hook's callback completes.
There is no fire-and-forget category. An async mock pauses the worker
until the Promise resolves; the learner's script does not continue until
then. This is the same model as a native `prompt()` call that waits for
the user to click OK.

If a mock throws (sync error or async rejection), the error is caught
and an `ErrorEvent` with `name: 'InternalError'` is surfaced in the
learner's event stream. Native IO hooks do not throw; if a mock does,
the runtime owns the failure so the learner sees an internal error, not
an exception from their own code. The worker is terminated cleanly.

### Order for a `prompt` call

1. Learner code calls `prompt("name?")`.
2. Worker trap posts an `io-request` message to the main thread and
   blocks on `Atomics.wait`.
3. Main thread invokes `resolvedIo.prompt("name?", undefined)` and
   awaits the result. (Sync callbacks resolve in one microtask; async
   callbacks resolve when the consumer's UI completes.)
4. Main thread writes the response to the SharedArrayBuffer and calls
   `Atomics.notify`.
5. Worker unblocks, reads the response, constructs a `PromptEvent`
   carrying the return value, and posts it.
6. Main thread yields the `PromptEvent` to the generator consumer.

`alert` and `confirm` follow the same order.

### Order for a `console.*` call

1. Learner code calls (e.g.) `console.log("hello")`.
2. Worker trap posts a `console-event` message to the main thread and
   blocks on the SAB pause flag (`Atomics.wait`).
3. Main thread invokes `resolvedIo.console.log("hello")` and awaits
   the result.
4. Main thread yields the `ConsoleEvent` to the generator consumer.
5. On the consumer's next `next()` call, the main thread releases the
   SAB pause (`Atomics.notify`).
6. Worker unblocks and continues execution.

Console methods do not require a SAB response-slot write (they return
`void`; nothing is delivered back to the worker). The worker is still
held until step 5 — learner code does not proceed past the `console`
call until the callback completes.

**All IO callbacks are awaited.** Sync callbacks cost one microtask;
async callbacks pause the worker for however long the Promise takes
to resolve. The cumulative timer pauses during each callback await so
consumer UI interactions (custom dialogs, typewriter animations) do not
count against execution time.

## Trapped globals

All traps are always defined in the worker — there is no
config-driven trap selection. Which implementation fires on the main
thread is determined by the Resolved IO table.

| Global               | Event produced                              |
| -------------------- | ------------------------------------------- |
| `console.*` (all 19) | `ConsoleEvent` — method, args, line         |
| `alert`              | `AlertEvent` — args, line                   |
| `confirm`            | `ConfirmEvent` — args, return value, line   |
| `prompt`             | `PromptEvent` — args, return value, line    |

The 19 trapped `console` methods: `log`, `debug`, `info`, `warn`,
`error`, `assert`, `table`, `dir`, `dirxml`, `group`, `groupCollapsed`,
`groupEnd`, `count`, `countReset`, `time`, `timeEnd`, `timeLog`,
`trace`, `clear`. (`console.trace` is the stack-trace dumper, not our
semantic trace engine — different namespace, no conflict.)

## How it works

1. Build the **Resolved IO** table from `options.io` + Native IO wrappers.
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
9. Handle `io-request` by awaiting `resolvedIo.{prompt|alert|confirm}`
   and writing the response to the SAB; on throw, surface `ErrorEvent`
   with `name: 'InternalError'` and terminate.
10. Handle console events by awaiting `resolvedIo.console[method]` (if
    any) before yielding; on throw, same `InternalError` path.
11. Timeout tracks cumulative execution time: paused while yielded
    AND while awaiting any IO callback.
12. Return frozen `RunResult` on completion, timeout, or iteration
    limit.

## Key design decisions

- **Resolved IO table**: consumer-provided mocks are merged with
  Native IO wrappers at invocation time. The worker is unaware — it
  sees the same event-emission path regardless. This is what gives
  us the shape-identical guarantee.
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
  worker via `Atomics.wait` while the main thread runs the Resolved IO
  callback (mock or native). Console methods use the existing SAB pause
  flag — no separate response-slot write needed (void return). Requires
  COOP/COEP headers. Returns an error event if SAB is unavailable.
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
