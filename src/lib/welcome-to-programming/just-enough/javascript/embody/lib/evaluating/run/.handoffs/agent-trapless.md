# Trapless Run Engine — Handoff

## Your role

You are building the third evaluation engine: **`run`** — a
trapless variant that just runs the program and returns a final
status object. No event stream. No logs. No async generator. Plain
async function.

This sits alongside two existing engines that you will mirror, not
modify:

- **`intercept`** (`lib/evaluating/intercept/`) — Web Worker, traps
  console + dialogs, streams `InterceptEvent`, returns
  `InterceptResult` with logs.
- **`trace`** (`lib/evaluating/trace/`) — Aran AST instrumentation,
  streams expression/control-flow events.

Three engines, distinct observation depths:

| Engine      | Returns            | Watches                              |
| ----------- | ------------------ | ------------------------------------ |
| `run`       | final status only  | nothing — native I/O, native console |
| `intercept` | `InterceptResult`  | I/O dialogs + console (event stream) |
| `trace`     | `TraceResult`      | every AST step                       |

`run` is `intercept` minus events / logs / console traps / async-
generator surface. Use `intercept` as your reference implementation.

## Required reading (in order)

1. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/AGENTS.md`
2. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/DEV.md`
3. `lib/evaluating/DOCS.md` — three-engine architecture overview
4. `lib/evaluating/intercept/README.md` — your API parallel
5. `lib/evaluating/intercept/DOCS.md` — your implementation parallel
6. `lib/evaluating/intercept/intercept.ts` — reference engine code
7. `lib/evaluating/intercept/worker-protocol.ts` — SAB protocol helpers
8. `lib/evaluating/intercept/create-worker-script.ts` — Worker template
9. `lib/evaluating/intercept/guard-loops/` — loop-guard module (reusable)

Path-from-repo-root: `src/lib/welcome-to-programming/just-enough/javascript/`

## Public API contract

```ts
async function run(
    code: string,
    options?: {
        seconds?: number;     // default 5; user-perceived runtime budget
        iterations?: number;  // optional loop-guard limit
        io?: {
            prompt?: (message: string, defaultValue?: string) => Promise<string | null>;
            alert?: (message: string) => Promise<void>;
            confirm?: (message: string) => Promise<boolean>;
        };
    }
): Promise<RunResult>;
```

Critically:

- **Returns a Promise**, not an `AsyncGenerator` or `Execution`.
  Consumer pattern is `const result = await run(code, ...)`. No
  `for await`, no `.cancel()`, no `.fail()`, no `.then` interceptor.
- **No `console` in `io`.** The trapless engine does not trap
  console — programs that call `console.log` write to the worker's
  native console, which surfaces in the browser dev tools. Console
  output is intentionally invisible to the consumer; that's what
  `intercept` is for.
- **`io` only carries prompt/alert/confirm.** Web Workers don't
  have native `prompt`/`alert`/`confirm`. If the program calls one
  and the consumer didn't provide a mock, the engine throws
  (surfaces as `outcome: 'error'`). The same SAB-based synchronous
  I/O protocol that `intercept` uses applies here — copy it.
- **`seconds` honors user-perceived runtime.** Mirror the
  `intercept` semantic from `intercept/DOCS.md` § Timer-vs-yield:
  flat per-pause charge `YIELD_CHARGE_MS`. Without a yield path
  (no event stream), the only places the timer pauses are I/O
  callback awaits — keep that branch only.
- **Same upstream gates as intercept**: parse → JeJ validate →
  checkFormat → execute. Reuse `lib/validating/validate.js` and
  `lib/formatting/check-format.js`. A gate failure short-circuits
  to `ok:false` without spawning a worker.

## Result shape

```ts
type RunOutcome =
    | 'complete'         // worker reached natural end-of-program
    | 'timeout'          // seconds budget exhausted
    | 'iteration-limit'  // guard-loops threw RangeError
    | 'error';           // runtime error or worker error

type RunResult = BaseResult<ResultError> & {
    readonly outcome: RunOutcome;
};
```

- **`ok: true`** when `outcome === 'complete'`.
- **`ok: false`** when outcome is `timeout` / `iteration-limit` /
  `error`. Carries `error: ResultError` discriminated by `kind`.
- **No `logs` field.** No `reason` field (no `fail()` API). Deep-
  freeze the result before returning per AGENTS.md convention.

`RunResult` and `RunOutcome` should live in `api/types.js` alongside
`InterceptResult` / `InterceptOutcome`. Add export in
`/javascript/index.ts`:

```ts
export { default as run } from './lib/evaluating/run/run.js';
export type { RunResult, RunOutcome } from './api/types.js';
```

## Suggested module layout

Mirror intercept's structure where possible:

```text
lib/evaluating/run/
  run.ts                  ← public entry; default export is `run` async fn
  types.ts                ← internal types (worker-protocol messages, IoMocks shape)
  worker-protocol.ts      ← copy + trim from intercept; no event protocol slots
  create-worker-script.ts ← copy + trim; no console trap, no event postMessage
  sandbox.html            ← hand-test page (mirror intercept/sandbox.html)
  vite.sandbox.config.ts  ← Vite dev-server config (mirror intercept/vite.sandbox.config.ts)
  README.md               ← public API description (mirror intercept/README.md)
  DOCS.md                 ← architecture + decisions (mirror intercept/DOCS.md)
  tests/
    *.test.ts             ← unit tests (no Worker)
    *.browser.test.ts     ← browser tests (Worker + SAB available)
```

## Sandbox requirements

Build `lib/evaluating/run/sandbox.html` based on the intercept
sandbox at `lib/evaluating/intercept/sandbox.html`. It must
exercise the full public API:

- Code textarea + `[run]` button.
- `seconds` enable + numeric input (default 5).
- `iterations` enable + numeric input (default empty).
- IO Hook Toggles for `prompt`, `alert`, `confirm` only
  (native vs. styled). **No console toggle** — console is not
  trapped by this engine; programs that call `console.log` hit
  the browser's native console.
- Snippet buttons for: trivial complete, infinite loop (timeout),
  iteration-bounded loop, runtime error, prompt+alert+confirm.
- Status line that surfaces the final `RunResult` —
  `outcome`, `ok`, `error.kind`/`error.message` if any. Logs the
  full result object via `console.log('[run result]', result)`.

Drop everything from the intercept sandbox that's stream/step-
specific:

- No `[cancel]` button — `await run(...)` returns a Promise; the
  consumer cannot interrupt.
- No `[step]` mode, no dev/user/predict-logs sub-toggles, no
  `[next]` button, no prediction input, no fail-on-wrong checkbox.
- No event log panel — the engine yields nothing to render.

Add a Vite config (`vite.sandbox.config.ts`) mirroring intercept's,
swapping the entry HTML path. Document the launch command in the
sandbox section of `run/README.md`.

Reuse `intercept/guard-loops/` directly — do not duplicate. Decide
whether to extract guard-loops up to `evaluating/shared/` (shared by
both engines now) or import across engines via relative path. The
existing decision in `evaluating/shared/DOCS.md` § "Why guard-loops
is in shared (not debug)" notes that it lives in `intercept/` because
intercept was its sole consumer. With `run` as a second consumer,
re-evaluate — moving it back to `shared/` is a clean refactor if you
do it as a separate commit before the engine work starts.

## Worker isolation: same as intercept

Same Worker + SAB sandbox. Same termination semantics. The
differences are subtractive:

- Strip the event-postMessage path (no `EVENT_READY` writes from
  worker, no event queue on main thread).
- Strip the console-trap setup in the worker preamble. Programs
  that call `console.log` hit the worker's native console.
- Strip `EVENT_READY_INDEX` and the timer's reschedule branch that
  uses it (no events ever pending → never reschedule on event).
- Keep `PAUSED` flag for I/O dialog pauses (`Atomics.wait` while
  the main thread awaits the consumer's `prompt`/`alert`/`confirm`
  resolver).
- Keep timeout semantics: cumulative worker time + flat charge per
  I/O pause. Worker-active time is the dominant term in this engine
  since there's no rendering between events.

You may discover the per-pause charge feels different here because
the only pauses are I/O callbacks, which already have wall-clock
weight. Keep the constant for symmetry with `intercept`; if your
testing shows it materially over-counts a typical `prompt` modal,
flag it for discussion before changing.

## What's explicitly NOT in scope

- Event streaming, async generator surface, `Execution` PromiseLike
  trick.
- `.cancel()` / `.fail()` / replay.
- Console traps.
- Touching `intercept/` or `trace/` code.
- Renaming anything. The directories you need (`run/`, `intercept/`,
  `trace/`) already exist and are correctly named.
- Wiring the new engine into a higher-level dispatcher. Just export
  it from `index.ts`.

## Verification

```bash
cd /Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

# tsc — only your files should produce errors during development;
# pre-existing baseline errors in trace/snippetry/handoffs are not
# your responsibility (see AGENTS.md baseline notes).
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "lib/evaluating/run/"

# Tests
node ./node_modules/vitest/vitest.mjs run --project unit \
    src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/tests/
node ./node_modules/vitest/vitest.mjs run --project browser \
    src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/tests/
```

Smoke-test the engine via a minimal browser test that exercises:

1. `await run('console.log(1)')` → `outcome:'complete'`, no logs surfaced.
2. `await run('while(true){}')` → `outcome:'timeout'` within ~budget.
3. `await run('while(true){}', { iterations: 100 })` → `outcome:'iteration-limit'`.
4. `await run('null()')` → `outcome:'error'` with `error.kind:'execution'`.
5. `await run("let x = prompt('?')", { io: { prompt: async () => 'x' } })`
   → `outcome:'complete'` (prompt mock fires once, no logs returned).

## AR protocol

Follow AR-3 / AR-4 / AR-5 per AGENTS.md:

- **AR-3** — pre-coding: review your test plan against ZOMBIES /
  triangulation before writing implementation.
- **AR-4** — post-implementation: spawn a reviewer to audit the
  diff for narrowing bugs, SAB ordering, doc-code sync.
- **AR-5** — pre-merge: full-diff review focused on contract
  parity with `intercept` (subtractive only — no behavioral
  divergence in the shared bits).

## Coordination notes

- `--no-verify` on commits is approved (pre-existing broken pre-
  commit hooks; see AGENTS.md).
- Batch small fixes into the current commit per user's standing
  preference.
- `lib/evaluating/run/.handoffs/` (this directory) is yours to use
  for sub-agent coordination if you spawn helpers.
- The `intercept` engine just got a public-API rename in commit
  `f83a234` — you're working post-rename, so all your imports of
  `intercept` should target `lib/evaluating/intercept/intercept.js`,
  the type names are `Intercept*`, etc. Do not reintroduce `Run*`
  identifiers for the intercept layer; reserve the `Run*`
  namespace for your engine.
