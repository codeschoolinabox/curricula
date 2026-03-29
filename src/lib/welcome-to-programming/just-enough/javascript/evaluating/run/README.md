# evaluating/run

Executes JeJ code in a Web Worker with trapped globals, returning a structured
event log. This is the low-level execution engine — it does not validate or
enforce language levels. A higher-level wrapper handles config resolution and
static validation before calling `run`.

## Structure

| File                      | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `types.ts`                | Worker message protocol and event types   |
| `run.ts`                  | Public entry: `run(code, maxSeconds)`     |
| `create-worker-script.ts` | Generates self-contained worker JS string |
| `worker-protocol.ts`      | SharedArrayBuffer encode/decode utilities |

## Public API

```ts
run(code: string, config: EngineConfig): AsyncGenerator<RunEvent, readonly RunEvent[]>
```

- **`code`** — JavaScript source to execute (assumed valid — no parsing or
  validation happens here)
- **`config`** — `{ seconds?, iterations? }`. Program ends when the first limit
  is reached. `seconds` controls timeout; `iterations` triggers loop guard
  injection via comma-in-condition AST rewrite.
- **Yields** — `RunEvent` objects one at a time, pausing the Worker between
  events via SAB pause protocol
- **Returns** — frozen array of all `RunEvent` objects on completion

Wrapped by `createExecution` (from `../shared/`) at the `api/` layer to produce
an `Execution<RunEvent, RunResult>` with PromiseLike backward compatibility.

## How it works

1. If `config.iterations` is set, inject comma-in-condition loop guards into
   while loops via AST rewrite (zero line shift)
2. Create a SharedArrayBuffer for synchronous I/O and pause protocol
3. Generate a self-contained worker script with trapped globals + pause logic
4. Worker setup script declares loop counter globals + `guard()` function
5. Send a **setup** message (delivers SAB, worker defines traps)
6. Send an **execute** message (delivers learner code)
7. Worker posts each event, then pauses via `Atomics.wait` on pause flag
8. Generator `next()` resumes Worker via `Atomics.notify` — yields one event
9. Handle I/O requests (prompt/confirm/alert) by showing real browser dialogs
   and writing responses to the SAB
10. Timeout tracks cumulative execution time (pauses during SAB wait)
11. Return frozen `RunEvent[]` on completion, timeout, or iteration limit

## Trapped globals

All traps are always defined — there is no config-driven trap selection.

| Global           | Trap behavior                                            |
| ---------------- | -------------------------------------------------------- |
| `console.log`    | Records `LogEvent` with args and line number             |
| `console.assert` | Records `AssertEvent` with args and line number          |
| `alert`          | Blocks worker, shows real dialog, records `AlertEvent`   |
| `confirm`        | Blocks worker, shows real dialog, records `ConfirmEvent` |
| `prompt`         | Blocks worker, shows real dialog, records `PromptEvent`  |

## Key design decisions

- **AsyncGenerator**: yields events one at a time with SAB pause between each.
  Enables live streaming to UI. Wrapped by `createExecution` for PromiseLike
  backward compat.
- **Comma-in-condition loop guards**: `while (++loop1 > max && guard(1), cond)`
  — zero line shift. Counter globals declared in Worker setup, not per-loop.
- **Cumulative timeout**: tracks execution time only. Paused during SAB wait so
  learners can step through events indefinitely.
- **Errors are events**: runtime errors (`phase: 'execution'`) and construction
  errors (`phase: 'creation'`) appear in the returned array. The consumer always
  gets `RunEvent[]` back, never a thrown exception.
- **SAB+Atomics for I/O**: `prompt`/`confirm`/`alert` block the worker via
  `Atomics.wait` while the main thread shows native dialogs. Requires COOP/COEP
  headers on the hosting site. Returns an error event if SAB is unavailable.
- **SAB pause protocol**: Worker pauses after each event via `Atomics.wait` on
  control slot 4 (pause flag). Generator `next()` resumes via `Atomics.notify`.
- **Two-step protocol**: setup and execute are separate messages so the trap
  definition code does not affect learner code line numbers.
- **Console forwarding kept**: `forwardToConsole` fires alongside event
  emission. Console = authenticity (real browser behavior).
- **No validation or enforcement**: this module only executes. Language-level
  validation and config resolution belong to the wrapper above.

## Platform requirements

SharedArrayBuffer requires these HTTP headers on the hosting page:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If SAB is unavailable, `run` returns a single `ErrorEvent` with
`name: 'EnvironmentError'` rather than throwing.

## Sandbox

To test interactively, start the Vite dev server from the project root:

```sh
npx vite --config src/lib/just-enough-javascript/evaluating/run/vite.sandbox.config.ts
```

Then open `http://localhost:5173/sandbox.html`.
