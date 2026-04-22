# Freeze Bug Handoff

## Status
Pre-existing deadlock in SAB pause protocol — revealed by our removal of the 5s timeout fallback.
**Not yet fixed.** Static analysis exhausted. Next step: instrument the code and run it.

---

## Exact Symptom

- Load `[io + error]` snippet, disable all limits, hit run
- First `prompt()` dialog appears → user answers → promptEvent IS logged in the events panel
- Then: frozen. No more events. No error. No `[run result]` in DevTools console.
- **Same freeze in stepping mode** (step + user checkboxes on)
- Both native (`window.prompt`) and styled (custom overlay) reproduce it

The sandbox's `await gen.next()` (second call, after receiving promptEvent) never resolves.

---

## What Changed (Our Session)

Two changes made this visible — they did NOT introduce the bug, they removed the mask:

1. **`sandbox.html`**: Added `seconds: Infinity` when stepping is active (`stepping || !maxSecondsEnabledEl.checked`)
2. **`run.ts`**: Reverted broken timer revert (removed `pauseTimeout()`/`startTimeout()` from event-yield path)

**The mask that was hiding this**: With `seconds: 5`, the 5-second `setTimeout` fires `wakeDequeue()`:
```ts
function wakeDequeue(): void {
    if (resolveWaiting !== null) {
        queue.push({ type: 'complete' } as QueueMessage); // sentinel
        resolveWaiting();
        resolveWaiting = null;
    }
}
```
This pushes a sentinel `complete` to the queue, resolves the stuck `dequeue()`, and causes the generator to exit with a TimeoutError — masking the deadlock as a timeout.

---

## The Deadlock

**Worker side** (`create-worker-script.ts`, `checkPause` function, ~line 52):
```js
function checkPause() {
  while (Atomics.load(controlView, PAUSE_INDEX) === PAUSE_PAUSED) {
    Atomics.wait(controlView, PAUSE_INDEX, PAUSE_PAUSED);  // ← STUCK HERE
  }
}
```
Worker sets `PAUSE=1` before posting each event, then calls `checkPause()`. It waits for `PAUSE` to become `0`.

**Main thread side** (`run.ts`, ~line 331):
```ts
const msg = await dequeue();  // ← STUCK HERE
```
Generator is waiting for the next message from the worker. But worker won't post a message until `PAUSE=0`.

**The chain that SHOULD break the deadlock** (runs after each yielded event):
```ts
yield event;
await new Promise<void>(resolve => setTimeout(resolve, 0));  // macrotask
writeResumeSignal(views);  // PAUSE=0 + Atomics.notify(PAUSE_INDEX) — wakes worker
continue;
await dequeue();  // worker now posts next event
```

**Unknown**: Whether `writeResumeSignal` IS being called but the notify doesn't reach the worker,
OR whether `setTimeout(0)` itself is not firing.

---

## Key Files

| File | Path |
|------|------|
| run.ts | `src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/run.ts` |
| create-worker-script.ts | same dir |
| worker-protocol.ts | same dir |
| sandbox.html | same dir |
| vite config | `vite.sandbox.config.ts` same dir |

**Critical line numbers in run.ts:**
- Line 199–200: `createBufferViews(sab)` + worker creation
- Line 316–322: `worker.postMessage({ type: 'setup' })` + `worker.postMessage({ type: 'execute' })`
- Line 324: `writePauseEngaged(views)` — sets PAUSE=1 at startup
- Lines 348–373: event-path (yield → setTimeout → writeResumeSignal)
- Lines 376–387: io-request path (handleIoRequest → Atomics.notify(CONTROL_INDEX))
- Line 331: `await dequeue()` — where main thread freezes

**Critical lines in create-worker-script.ts:**
- Lines 52–56: `checkPause()` — where worker freezes
- Lines 159–168: `trappedConsole` — sets PAUSE=1 before posting
- Lines 200–213: `trappedPrompt` — io-request path, then PAUSE=1 before posting promptEvent

---

## SAB Layout (for reference)

```
control[0] = CONTROL (io handshake): 0=idle, 1=waiting, 2=responded
control[1] = RESPONSE_TYPE: 0=string, 1=boolean, 2=void
control[2] = NULL_FLAG: 0=has value, 1=null
control[3] = PAYLOAD_LEN (bytes)
control[4] = PAUSE: 0=running, 1=paused  ← THE STUCK FLAG
control[5] = EVENT_READY (unused in current impl)
```

---

## What Was Tried

- Static analysis of full event flow (multiple times, multiple angles)
- Two Explore agents investigating run.ts and sandbox.html separately
- Neither found root cause — the code looks correct on paper
- Hypothesis: environment/timing issue that only manifests at runtime

---

## Recommended Next Steps

### Step 1: Instrument and run

Add temporary `console.log` debugging to `create-worker-script.ts` (inside the string template):

```js
// In checkPause(), after Atomics.wait returns:
function checkPause() {
  while (Atomics.load(controlView, PAUSE_INDEX) === PAUSE_PAUSED) {
    self.postMessage({ type: 'debug', msg: 'checkPause: waiting' });
    Atomics.wait(controlView, PAUSE_INDEX, PAUSE_PAUSED);
    self.postMessage({ type: 'debug', msg: 'checkPause: woke, PAUSE=' + Atomics.load(controlView, PAUSE_INDEX) });
  }
  self.postMessage({ type: 'debug', msg: 'checkPause: exited' });
}
```

Add in `run.ts` before `writeResumeSignal`:
```ts
console.log('[run.ts] writeResumeSignal about to fire, PAUSE=', 
  Atomics.load(views.control, 4));
writeResumeSignal(views);
console.log('[run.ts] writeResumeSignal fired');
```

Also in the `worker.onmessage` handler:
```ts
worker.onmessage = function onWorkerMessage(e) {
    console.log('[run.ts] onmessage:', e.data.type, e.data.event?.event ?? '');
    enqueue(e.data);
};
```

### Step 2: Serve and test

```bash
cd /Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula
npx vite --config src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/vite.sandbox.config.ts
```

Open `http://localhost:5173/lib/evaluating/run/sandbox.html` in Chrome.
Open DevTools. Load `[io + error]` snippet, disable all limits, run.

### Step 3: What to look for in DevTools

- If `[run.ts] writeResumeSignal about to fire` appears but `checkPause: woke` never appears → `Atomics.notify` is not waking the worker
- If `[run.ts] writeResumeSignal about to fire` never appears → `setTimeout(0)` is not firing or generator never resumed from yield
- If `[run.ts] onmessage: event prompt` appears but nothing after → generator is stuck at `await dequeue()` after the promptEvent

---

## Sandbox Consumer Pattern (for reference)

```js
// sandbox.html ~line 663
while (true) {
    const { value, done } = await gen.next();  // FREEZES HERE on 2nd call
    if (done) { result = value; break; }
    if (currentGen !== gen) break;
    eventsEl.appendChild(renderEvent(value));
    eventsEl.scrollTop = eventsEl.scrollHeight;
}
if (currentGen === gen) {
    statusEl.textContent = `done — ${eventCount} event(s)`;
    if (result) console.log('[run result]', result);  // NEVER REACHED
}
```

The sandbox uses raw `createRunGenerator` (not the api/run.ts Execution wrapper).
Uses manual `gen.next()` loop, not `for await...of`.

---

## Other Work Pending (separate from bug)

- Documentation review for `/run` (README.md, DOCS.md, types.ts) — LLM consumption improvements
  - Interrupted by this bug investigation
  - Notes: IoMocks, RunOptions, ConsoleEvent types need better examples
- **Coverage gap: `buildResolvedIo` / `run.ts` engine has no unit tests**
  - Only `worker-protocol.test.ts` and `create-worker-script.test.ts` exist in `run/tests/`
  - `buildResolvedIo` is pure (no SAB, no worker) — ideal leaf-level unit target
  - ZOMBIES shape for each slot (prompt/alert/confirm/console): undefined → native fallback; sync mock → works; async mock → works; throwing sync → InternalError; rejecting async → InternalError
  - Deferred — do not interleave with freeze-bug fix
