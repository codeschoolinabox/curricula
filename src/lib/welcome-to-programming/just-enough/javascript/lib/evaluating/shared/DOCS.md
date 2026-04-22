# evaluating/shared — Architecture & Decisions

## Why one AsyncGenerator per engine

Each engine needs to produce events incrementally (for live UI rendering) while
also supporting batch consumption (for backward compatibility). An AsyncGenerator
satisfies both: `for await` pulls events one at a time, while `await execution`
drains everything and resolves to the final result.

Alternatives considered:

- **Callback/EventEmitter**: no backpressure, consumer cannot control pacing.
  The generator's pull-based model lets the consumer decide when to advance.
- **ReadableStream**: heavier API surface, less ergonomic for `for await`, and
  the PromiseLike backward-compat trick wouldn't work naturally.
- **Observable**: not built into the language, would add a dependency.

## Why Execution is PromiseLike

`Execution` implements `.then()` by delegating to `.result`. This means
`await run(code, { seconds: 5 })` resolves to the same `RunResult` as today's
`await run(code, 5)`. Existing consumers work unchanged — no silent breakage.

The `.result` Promise is created eagerly. If nobody iterates the generator,
an internal drain loop consumes all events and resolves `.result`. This prevents
the generator from hanging indefinitely.

## Why re-iteration replays from cache

After the generator completes, events are stored in `.result.logs`. A second
`for await` iterates over the cached array rather than re-executing. This
supports use cases like: render events live, then analyze them afterward —
without running the learner's code twice.

## SAB pause protocol

The Worker must pause between events so the main-thread generator can yield them
one at a time. Without pause, events would queue up in the message channel and
arrive in bulk — defeating the purpose of streaming.

### Buffer layout

The control array uses 6 `Int32` slots. `PAYLOAD_BYTE_OFFSET` is 24.

```text
control = Int32Array(sab, 0, 6)    →  bytes 0-23
  [0]: I/O control (0=idle, 1=waiting, 2=responded)
  [1]: response type (0=string, 1=boolean, 2=void)
  [2]: null flag
  [3]: payload byte length
  [4]: pause flag (0=running, 1=paused)
  [5]: event-ready flag (0=not ready, 1=ready)
payload = Uint8Array(sab, 24)      →  bytes 24+
```

### Why Atomics.wait for pause (not message-based)

Message-based pause (posting "pause"/"resume" messages) would require the Worker
to poll its message queue — `onmessage` fires asynchronously and cannot block
synchronous code mid-execution. `Atomics.wait` truly freezes the Worker thread
at the exact instruction, guaranteeing no events leak past the pause point.

### Pause/resume flow — two engines, two patterns

The SAB layout is shared but the two engines use the pause protocol
differently. This section documents both; unification is planned for
the `api/run` → `evaluating/run` merge task.

#### Trace module (worker-managed pause, uses EVENT_READY)

1. Worker posts an event via `postMessage`
2. Worker stores `PAUSED` to control[4], `EVENT_READY` to control[5], notifies [5]
3. Worker calls `Atomics.wait(control, 4, 1)` — blocks while flag is 1
4. Main thread's timeout handler checks control[5] — if event-ready, reschedules
   (Worker is paused, not stuck)
5. Main thread receives `postMessage`, processes event
6. Main thread clears control[5], sets control[4] to 0, `Atomics.notify(4)` — wakes
7. Worker continues execution until the next event

#### Run module (main-thread-managed pause, no EVENT_READY)

1. Main thread writes `PAUSED=1` at startup (`writePauseEngaged`)
2. Worker's trapped global (console.*, prompt, alert, confirm) fires:
   - Sets `PAUSED=1` (idempotent — main thread already set it)
   - `postMessage(event)` to main thread
   - Calls `checkPause()` — blocks while `PAUSED=1`
3. Main thread's `onmessage` enqueues event; consumer iterates
4. Consumer calls `.next()` → generator yields event, then writes
   `PAUSED=0` + `Atomics.notify` → worker unblocks, continues

Run does not consume `EVENT_READY` today. Its timeout handler relies
on a `timedOut` flag set by a wall-clock `setTimeout` — not on
differentiating paused-with-event from stuck-no-event. One consequence:
time spent waiting for the consumer to iterate (e.g. stepping mode)
still counts against the `seconds` limit. The `run.ts` JSDoc says
otherwise; the code doesn't match. Resolution pending the merge task.

For batch mode (`.then()` / `.result`), an internal drain loop calls
`next()` rapidly — the Worker barely pauses.

### Why EVENT_READY flag (control[5])

Used by the trace engine. The timeout handler needs to distinguish
"Worker paused with pending event" from "Worker stuck in infinite
loop." The Worker writes EVENT_READY to SAB (instant) before blocking,
so the timeout handler has a reliable signal that doesn't depend on
`postMessage` delivery timing. The slot is reserved in the SAB layout
for cross-engine consistency; run will adopt it in the merge task.

### Why timedOut flag instead of queued timeout message

With instrumented `while(true){}`, a queued `{ type: 'timeout' }` message sits
behind thousands of entry messages in the FIFO queue. The `timedOut` flag is
checked directly on every loop iteration, bypassing the queue.

## Why cumulative timeout, not wall-clock

Timeout tracks execution time only, not pause time. When the Worker pauses
(waiting for the consumer to call `next()`), the timeout is cleared. When it
resumes, `setTimeout(remainingMs)` restarts. This means a learner stepping
through events can take as long as they want — only actual code execution counts
toward the limit.

## Why create-execution is a factory function, not a class

Per AGENTS.md convention: no classes in this codebase. The factory returns a
plain object with closure-captured state. The generator function and cancel
callback are injected — `createExecution` knows nothing about Workers, SABs, or
engines. Each engine builds its own async generator and passes it to the factory.

## Why guard-loops moved to shared

Both run and debug engines need loop guard injection. Previously guard-loops
lived inside `debug/` — run didn't have its own guards (it relied on timeout
only). With the refactor, run also injects loop guards when `config.iterations`
is set. Moving to `shared/` reflects this shared dependency.

The two engines use different injection strategies from the same module:

- **run**: comma-in-condition (`while (++loop1 > max && guard(1), cond)`) — zero
  line shift, errors report correct line numbers
- **debug**: body-injection (`if (++loopN > max) throw ...`) — visible and
  readable in DevTools

## What this module deliberately does NOT do

- Does not validate user code — that's `validating/`'s job
- Does not execute code — that's the individual engine's job
- Only provides shared infrastructure (types, Execution factory, SAB protocol,
  loop guards)
