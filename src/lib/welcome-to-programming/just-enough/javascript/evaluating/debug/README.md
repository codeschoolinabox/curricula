# evaluating/debug

Execute learner JavaScript in a hidden iframe with `debugger` breakpoints before
and after their code. The learner steps through their program in DevTools.

## API

```ts
function debug(code: string, config: EngineConfig): AsyncGenerator<DebugEvent, readonly DebugEvent[]>
```

- `config` — `{ iterations? }`. `seconds` is not supported (iframe shares main
  thread — no `worker.terminate()`). `iterations` triggers body-injection loop
  guards that throw `RangeError`.
- **Yields** — 0-1 `DebugEvent` (only on error: RangeError from loop guard or
  iframe access error)
- **Returns** — frozen array of all `DebugEvent` objects on completion

Wrapped by `createExecution` at the `api/` layer to produce an
`Execution<DebugEvent, DebugResult>` with PromiseLike backward compatibility.

No SAB pause protocol — the iframe runs on the main thread, so there is no
Worker to pause.

## How It Works

1. Each call creates a fresh wrapper `<div>` + hidden `<iframe>`
2. Two `<script type="module">` tags are injected into the iframe:
   - **Script 1**: `debugger; <learner code> debugger;`
   - **Script 2**: `postMessage` back to parent signaling completion
3. Module scripts execute in order — Script 2 runs only after Script 1 completes
4. Parent receives the message, removes the wrapper from the DOM, and resolves
   the Promise

No DOM artifacts remain after execution completes.

## Structure

| Path             | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `index.ts`       | Debug generator engine entry point                 |
| `types.ts`       | DebugEvent type (imported from `../shared/types`)  |

Loop guard injection uses `guard-loops/` from `../shared/guard-loops/` — the
body-injection strategy (visible in DevTools).

## Sandbox

To test interactively, start the Vite dev server from the project root:

```sh
npx vite --config src/lib/just-enough-javascript/evaluating/debug/vite.sandbox.config.ts
```

Then open `http://localhost:5173/sandbox.html`.
