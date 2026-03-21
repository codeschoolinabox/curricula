# evaluating/run

Executes JeJ code in a Web Worker with language-level validation and
enforcement. Traps `console.log`, `console.assert`, `alert`, `confirm`, and
`prompt`, returning a structured event log.

## Structure

| File                      | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `types.ts`                | Worker message protocol types              |
| `run.ts`                  | Public entry: `run(code, config)`          |
| `create-worker-script.ts` | Generates self-contained worker JS string  |
| `worker-protocol.ts`      | SharedArrayBuffer layout and encode/decode |

## How it works

1. Resolve `allow`/`block` config to LanguageLevel + AllowedConfig
2. Validate source against the resolved level (returns error event if invalid,
   does not throw)
3. Create a SharedArrayBuffer for synchronous I/O (prompt/confirm/alert)
4. Generate a worker script with trapped globals and enforcement
5. Run the worker, handle I/O requests via SAB, collect events
6. Return frozen `RunEvent[]` on completion or timeout

## Key design decisions

- **Errors are events**: validation errors (`phase: 'creation'`) and runtime
  errors (`phase: 'execution'`) appear in the returned array. The consumer
  always gets `RunEvent[]` back, never a thrown exception.
- **SharedArrayBuffer for I/O**: `prompt`/`confirm`/`alert` block the worker via
  `Atomics.wait` while the main thread shows native dialogs and writes
  responses. Requires COOP/COEP headers on the hosting site.
- **Module mode**: worker runs as module; user code wrapped in `new Function`
  with `"use strict"` prefix for equivalent strictness.
