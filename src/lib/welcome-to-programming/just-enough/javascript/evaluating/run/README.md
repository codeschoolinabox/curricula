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
run(code: string, maxSeconds: number): Promise<readonly RunEvent[]>
```

- **`code`** — JavaScript source to execute (assumed valid — no parsing or
  validation happens here)
- **`maxSeconds`** — timeout in seconds (human-intuitive). Execution is
  terminated if it exceeds this limit.
- **Returns** — frozen array of `RunEvent` objects. Never throws.

## How it works

1. Create a SharedArrayBuffer for synchronous I/O (prompt/confirm/alert)
2. Generate a self-contained worker script with trapped globals
3. Send a **setup** message (delivers SAB, worker defines traps)
4. Send an **execute** message (delivers learner code)
5. Collect events as the worker runs — handle I/O requests by showing real
   browser dialogs and writing responses back to the SAB
6. Return frozen `RunEvent[]` on completion or timeout

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

- **Errors are events**: runtime errors (`phase: 'execution'`) and construction
  errors (`phase: 'creation'`) appear in the returned array. The consumer always
  gets `RunEvent[]` back, never a thrown exception.
- **SAB+Atomics for I/O**: `prompt`/`confirm`/`alert` block the worker via
  `Atomics.wait` while the main thread shows native dialogs. Requires COOP/COEP
  headers on the hosting site. Returns an error event if SAB is unavailable.
- **Two-step protocol**: setup and execute are separate messages so the trap
  definition code does not affect learner code line numbers.
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
