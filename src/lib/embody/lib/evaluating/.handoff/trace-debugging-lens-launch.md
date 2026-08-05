# Cold-start handoff — trace-debugging lens (consumes the variables tracer)

> A fresh agent reads this top-to-bottom. It points at canon rather than
> restating it. Mission-specific facts are inline; everything else is a pointer.

## Mission

Build a **trace-debugging lens**: a thin UI consumer that runs a learner's
Just-Enough-JavaScript through the now-complete **variables tracer** and **dumps
the raw typed lifecycle events + the settlement to the DOM**. This is a
_debugging / smoke_ lens — the readable proof that the tracer works in the real
study-lenses UI — NOT the polished pedagogical quiz lens (that is a separate,
later effort). Keep it minimal and honest: show what the tracer emits, verbatim.

It must be a genuine exercise of the full infrastructure — wire a **Stop
button** (`handle.cancel()`) and a **time-limit input** (`{ seconds }`), because
the tracer genuinely supports both (verified: cancel → `cancelled`; budget
exhaustion → `timed-out`). Don't fake the run; consume the real handle.

## Governance (do this first)

Read `CLAUDE.md` at the repo root → follow its routing for YOUR model generation
(model id with `fable` → AGENTS.fable.md; Opus/Sonnet/Haiku/other → AGENTS.md) →
DEV.md (ceremony, the per-increment TDD chain, the AR protocol + sub-model
dispatch — never pass a `model` param to `ar-N`). **Plan-mode before any edits**
(standing user rule: ExitPlanMode approval required). The lens is a new concern,
so it likely warrants a short Phase-0 (what is a lens here? what does it own?)
before TDD — decide scope with the user in plan mode. AR baseline SHA: record
HEAD at plan approval.

Repo root:
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`.

## The tracer you consume (the contract — do NOT re-implement)

Primary export (the ONLY thing the lens touches):
`src/lib/study-lenses/embody/lib/evaluating/tracers/variables/trace-variables.ts`

```ts
traceVariables(code: string, options?: { seconds?: number }): VariablesTraceHandle
```

`VariablesTraceHandle` (see `…/variables/types.ts` for exact shapes — read it,
don't guess):

- `AsyncIterable<VariablesTraceEvent>` — `for await (const event of handle)`
  streams the events:
  `scope-push | scope-pop | initialize | read | assign | increment`. **Breaking
  the loop ≡ `cancel()`.**
- `result: Promise<VariablesTraceResult>` — `{ events, settlement }`. Awaiting
  it WITHOUT iterating drains and gives every event + the settlement (the
  simplest dump path).
  `VariablesSettlement = { outcome, halt, engineError?, failReason?, durationMs }`;
  `outcome ∈ completed | errored | cancelled | failed | timed-out`.
- `cancel(): void` — wire to a Stop button.
- `fail(reason?): void` — structured consumer stop (`outcome: 'failed'`,
  `failReason` carried).

**Two error channels — the lens must handle both:**

1. The CALL throws **synchronously** on inadmissible input (non-JEJ,
   unparseable, or an instrumenter-rejected construct — labels,
   expression-target for-of). So `try/catch` the `traceVariables(...)` call and
   render the message.
2. A program that runs then fails surfaces in the SETTLEMENT, never as a throw:
   runtime error → `outcome:'errored'` + a stamped `halt`
   (`{natural:false, errorName, message, nodePath}`); budget exhausted →
   `outcome:'timed-out'` + `engineError.cause:'timeout'`, `halt:null`;
   cancel/fail → those outcomes, `halt:null`.

Conceptual lens core (consumes the public handle directly — no adapter):

```js
let handle;
try {
	handle = traceVariables(code, { seconds });
} catch (admissionError) {
	/* render: not runnable — admissionError.message */ return;
}
stopButton.onclick = () => handle.cancel();
for await (const event of handle) appendToDom(JSON.stringify(event));
const { settlement } = await handle.result;
appendToDom('SETTLEMENT: ' + JSON.stringify(settlement));
```

## ⚠️ The two real risks (where this gets hard — not the lens code)

1. **Cross-origin isolation (COOP/COEP).** The engine runs a real Worker over
   SharedArrayBuffer + Atomics, which requires the page to be
   `crossOriginIsolated` (`Cross-Origin-Opener-Policy: same-origin` +
   `Cross-Origin-Embedder-Policy: require-corp`). If the study-lenses runtime
   (the Docusaurus site) does NOT serve these headers, `SharedArrayBuffer` is
   undefined and the run settles `errored` with
   `engineError.cause:'worker-error'` (EngineEnvironmentError) — NOT a crash, a
   degraded settlement. **First verify the live site is cross-origin-isolated**
   (the vitest browser project fakes this with a `coop-coep-headers` Vite plugin
   in `vitest.workspace.ts`; the real site needs the same at its server/CDN).
   See the engine README/DOCS for the requirement.
2. **Worker-entry bundling under the production bundler.** The facade resolves
   the worker via `new URL('./variables-worker-entry.ts', import.meta.url)` and
   the engine does `new Worker(url, {type:'module'})` in a SEPARATE module. This
   bundles correctly under **Vite/vitest** (the committed browser smoke proves
   it). The study-lenses site builds with **Docusaurus/webpack** — confirm
   webpack detects and emits the worker chunk when `new URL` and `new Worker`
   are split across modules (webpack 5's worker detection usually wants them
   syntactically together). This is unproven for this tier under webpack and may
   be the hardest part. If it fails, that's a bundler-config problem, not a
   tracer bug.

These two are the make-or-break. The lens JS is trivial; the runtime/bundler
plumbing is the work.

## Testing the lens (two tiers, mirroring the engine — read this before you hunt)

There is **NO Node real-engine**: the engine's real transport is the **Web
Worker** API (`engine/worker/transport.ts` — `new Worker(url, {type:'module'})`,
browser-only); Node has only the same-thread **fake**. Don't waste time looking
for a `worker_threads` engine — there isn't one, by design
(`engine/README.md § Conformance testing`: "the fake exists so consumer logic is
Node-testable, not to certify the transport"). So:

- **Logic, in Node (fast):** inject the fake into the tracer via its test-only
  3rd param —
  `traceVariables(code, opts, createFakeTransport(variablesWorkerSetup, variablesThreadLogic))`
  (from `…/variables/variables-worker-setup.js`,
  `…/variables/variables-thread-logic.js`,
  `lib/engine/testing/fake-transport.js`). Exercises the real pipeline
  same-thread, no Worker. Use for the lens's render/wiring logic.
- **Fidelity, in the browser (real Worker + SAB):** a `*.browser.test.ts`
  calling `traceVariables(code)` with the default transport. The ONLY place the
  real worker, COOP/COEP, and production-bundler worker resolution are proven —
  and the only honest proof the lens works in the live site. Don't skip it.

## First task: discover where lenses live

NOT yet explored: how study-lenses authors, registers, and mounts a lens in the
UI; how a lens receives the source to run; the lens lifecycle (mount/unmount →
must call `handle.cancel()` on unmount so a running worker is torn down).
Explore the study-lenses lens area before designing. The tracer tier explicitly
disowns the lens (`…/variables/README.md § Bounded context` — "The quiz lens …
is out of scope"), so the lens is a pure downstream consumer.

## Out of scope (do NOT build)

- The embody adapter (`AnyNMEvent`/`RunInstance`/`EndReport` mapping). The debug
  lens consumes the tier's OWN typed handle directly — that is the whole point.
- The polished quiz/prediction lens.
- Any change to the tracer tier (`tracers/variables/`). It is complete and
  AR-5'd; treat it as a stable dependency. If you find a tracer bug, surface it,
  don't patch it inside the lens.

## State of the dependency (the tracer)

COMPLETE — I1–I5 shipped + AR-5'd. Commits: I1 `a8af477`, I2 `095dcbc`, I3
`7c8e0eb`, I4 `039a964`, I5 `f742a70`, AR-5 cleanup `4312797`, browser fidelity
`139b2ca`. 129 tier unit tests + a 4-case real-worker browser suite (completed /
errored / cancelled / timed-out) green. Full state + every locked decision is in
the canonical plan's RESUMPTION POINT:
`/Users/master/.claude/plans/launch-the-variables-tracer-workflow-flickering-bonbon.md`
(the "✅ TIER COMPLETE" block + the engine-ergonomics findings ledger). The
tracer's contract is `…/variables/types.ts`; the engine it rides is
`src/lib/study-lenses/lib/engine/` (README/DOCS pin the handle + cross-origin
requirement).

Sanity-eyeball of the tracer output (a Node dump produced during the build) for
`let total = 0; for (let i = 0; i < 3; i = i + 1) { total = total + i; }`:
`total` walks 0→0→1→3, `i` across one `for` scope instance, a const-error
attributes its `TypeError` to `$.body.1.expression`. That is the data your lens
renders.

## Landmines (campaign-verified)

- Shared working tree: stage explicit paths, verify the staged diff is only
  yours, expect HEAD to move, never `git add .`, never amend, `--no-verify` OK.
- cspell SKIPPED (Node 20.11 < 20.18) — declare the skip per commit; run gates
  individually, never `npm run validate`.
- `npx`/tests only at the repo root. A Claude-Code-Mapper Read hook returns
  cached maps for code files — bypass with Read `offset`/`limit`.
- vitest: read ALL THREE summary lines (Test Files / Tests / Errors).
- Browser tests: Playwright chromium is now installed; the browser project runs
  `fileParallelism:false`, `retry:2`, COOP/COEP via a Vite plugin.
  `*.browser.test.ts` is the glob. A lens that mounts a worker needs a browser
  test (jsdom has no real Worker/SAB).
- Lint traps already mapped: see [[project_curricula_arrow_noop_lint_traps]] and
  the other 0-curricula lint memories.

## Definition of done (debug lens)

A learner pastes/loads JEJ in the study-lenses UI, the lens runs it through
`traceVariables`, and the DOM shows the streamed events + the settlement; a Stop
button cancels a running trace; an inadmissible program shows its admission
error; a runaway loop times out cleanly. Verified in the real site
(cross-origin-isolated, worker bundled), not just a test.
