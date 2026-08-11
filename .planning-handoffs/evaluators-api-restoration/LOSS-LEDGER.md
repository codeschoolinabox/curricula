<!-- TRANSITIONAL — pruned when the restoration campaign completes. -->

# Evaluator public-API restoration — LOSS LEDGER

Every reference public-API member, classified. This artifact's absence is the
recorded root cause of the original failure — a multi-week port verified every
increment against its own new contract and never once diffed that contract
against the implementation it replaced, so no gate could catch the loss; its
per-increment discharge rule is the campaign's anti-failure mechanism (plan § 1:
every Phase-1 increment names the rows it discharges).

**Classification vocabulary** (HR-4): `restore` (the default — the member
returns, reference-faithful) · `supersede` (a port-side or new design wins —
ONLY with a named strength argument) · `drop` (the member does not return — ONLY
with human sign-off). **RATIFIED 2026-08-06 in one pass** (human ruling
2026-08-06, § Rulings of record below: one bulk confirm of every proposed row
plus eight individual escalated decisions): no row remains open; each carries
its ruling or its sign-off date. Evidence cites the reference/port files
directly; the full audit trail with per-member verification is
`research-digests-2026-08-05.json` — recoverable via
`git show a8a0128d:.planning-handoffs/evaluators-api-restoration/research-digests-2026-08-05.json`
(the working-tree copy was retired with the ruling logs, 2026-08-11; the audit
keys are nested under `.result` — `.result.runAudit`, `.result.interceptAudit`)
`[relayed: the two fidelity audits wf_7cb9c40a-f4c and wf_5c5b0dc6-37e, re-verified per row by the planning research agents]`.

## Shared handle contract (`shared/`)

| member                                                                       | classification                          | rationale                                                                                                                                                                                     | evidence                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `Execution<TEvent,TResult>` (AsyncIterable & PromiseLike & {result, cancel}) | restore (ruled HR-3/HR-8)               | the contract half that never crossed; the campaign's centerpiece                                                                                                                              | `shared/types.ts:48`                                        |
| `.then` / `await handle` batch mode                                          | restore (ruled HR-6)                    | both consumption modes return                                                                                                                                                                 | `create-execution.ts:29-30`                                 |
| `.result` memoized, always-settles                                           | restore (ruled HR-3)                    | —                                                                                                                                                                                             | `shared/types.ts:52`                                        |
| `.cancel()` named, idempotent                                                | restore (ruled HR-3)                    | a consumer outside the `for await` (Stop button) can stop the run again                                                                                                                       | `shared/types.ts:55-56`                                     |
| creation-time auto-start (queueMicrotask drain)                              | supersede (ruled — ratified 2026-08-06) | STRENGTH: creation-inert start-at-first-consumption keeps both modes byte-equivalent from first consumption on, adds hold-without-running, and kills the reference's one-microtask claim race | `create-execution.ts:107-117`                               |
| replay / re-iteration (`===`-identity re-yield, `.result.logs` cache)        | supersede (ruled HR-2)                  | human-affirmed non-goal; the engine's items array is the record                                                                                                                               | `create-execution.ts:166-190`                               |
| `createExecution`'s test suite                                               | restore ~16 of 21 (ruled HR-4)          | 3 replay rows drop per HR-2; ~2 adapt (cancel-before-iteration's `undefined` result contradicts the restored typed contract — adapted row, this table is its record)                          | `shared/tests/create-execution.test.ts` (21 tests measured) |

## run — handle

| member                                                       | classification                | rationale                                                                                                                                         | evidence                                                       |
| ------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `RunHandle` name + shape                                     | restore (ruled HR-8)          | —                                                                                                                                                 | `run/types.ts:199-205`                                         |
| `.code` eager                                                | restore (ratified 2026-08-06) | HR-4 default; trivial echo of `spec.facts.source.value`; "caller already holds it" is redundancy, not strength                                    | `run/types.ts:202`                                             |
| `.ast` SYNC (`Program \| undefined`)                         | restore (ratified 2026-08-06) | echo of gate-guaranteed `facts.ast`; the `undefined`-iff-parse-failed arm is unreachable under the gate — documented at the field, not re-modeled | `run/types.ts:203`                                             |
| `.options` / `ResolvedRunOptions` (seconds always populated) | restore (ruled HR-8/HR-9)     | —                                                                                                                                                 | `run/types.ts:166-170, :204`                                   |
| handle `Object.freeze`                                       | restore (ratified 2026-08-06) | port returned a bare literal with no recorded rationale; both neighbors hardened                                                                  | quarry `run.ts:452-459` vs port `create-run-stream.ts:118-123` |

## run — options

| member                                                                       | classification                  | rationale                                                                                                                                                                                                                                                                                                                                      | evidence                                              |
| ---------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `seconds` (default 5, settable)                                              | restore (ruled HR-4 round)      | engine already carries `EvaluateSpec.seconds`; this row is the recorded authority overturning the ratified no-seconds kind ruling (the two `carries no seconds budget` test rows ride into the deprecated region unedited)                                                                                                                     | `run/types.ts:153`; engine `types.ts:50-51`           |
| `iterations`                                                                 | already survives                | renamed through `workerConfig.iterationLimit`; no loss row                                                                                                                                                                                                                                                                                     | `run/types.ts:154`                                    |
| "iterations omitted = no guard injection" (source-runs-unmodified guarantee) | supersede (ratified 2026-08-06) | STRENGTH: always-splice is iteration-guard's documented commitment; guard-still-counts is the safer default; the run total is then real on every halt                                                                                                                                                                                          | quarry `run/types.ts:148-149`                         |
| `io` / `IoMocks` (3 dialog slots, sync-or-Promise)                           | restore (ruled HR-9)            | worker dialog traps over the engine's existing `onCall` seam; the evaluator's onCall wrapper validates/classifies ITSELF (plan § 4 closure-flag pattern)                                                                                                                                                                                       | `run/types.ts:134-141`; engine `types.ts:85-91`       |
| native-dialog fallback for unmocked verbs                                    | supersede (ruled HR-9)          | STRENGTH: no mock → classified io-error outcome beats a main-thread-blocking native dialog AND beats today's bare worker `ReferenceError`. History carried so this is never re-litigated blind: the reference's own DOCS record the no-dialog posture as tried, tested, and RESCINDED (D5b) — HR-9 re-decides it WITH that record on the table | quarry `run.ts:510-522`; quarry DOCS D5b              |
| cancel-waits-for-in-flight-mock                                              | supersede (ratified 2026-08-06) | STRENGTH (structural): the port engine's uninterruptible-call + discard-on-stop design cannot express it; a transported slow-mock cancel test would fail — adapted, with the discard semantics documented                                                                                                                                      | quarry `run.ts:214-216`; engine `evaluate.ts:319-353` |
| `io-error` termination cause (mock failure as a classified run outcome)      | restore (ruled HR-9)            | live again the moment io returns; classified consumer-side via the closure flag, no engine change                                                                                                                                                                                                                                              | quarry `run.ts:274-289`, `types.ts:130-133`           |

## run — result and error taxonomy

| member                                      | classification                                           | rationale                                                                                                                                                                                                                                                                                                                                          | evidence                                                                              |
| ------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `RunResult` name; `outcome` 5-value; `ok`   | restore (ruled HR-8)                                     | reference vocabulary wholesale; the port's ended×reason retires with the deprecated region; map-settlement translates at the engine seam (spec = table T1, committed into P0-K README)                                                                                                                                                             | `run/types.ts:91-96, :117-120`                                                        |
| machinery-defect discrimination             | ADDITION (ruled HR-8)                                    | port-stronger, rides as an added error kind — the reference disguised machinery failure as `{kind:'javascript', name:'WorkerError'}`                                                                                                                                                                                                               | port `run/types.ts:64-68`                                                             |
| `result.ast` on every parsed outcome        | restore (ratified 2026-08-06)                            | echo; rides the result per HR-8                                                                                                                                                                                                                                                                                                                    | quarry `run/types.ts:117-120`                                                         |
| `rejections` (JeJ violations)               | drop-as-loss (resolved 2026-08-06)                       | the ORCHESTRATOR already owns level marking (screening `Violation` + language-levels `validate` + orchestrate marking, live-wired), and embody is level-blind by contract [read: embody/DOCS.md:101-105 — "a language level decides what is ALLOWED"] — the assignment is already recorded in the regions' own docs; nothing returns to evaluators | `validating/types.ts:160-164`                                                         |
| parse error arm                             | supersede (ratified 2026-08-06)                          | STRENGTH: the kind's gate-guaranteed facts make a parse arm unreachable — genuine re-partition upstream (embody `StageCause`); residue noted: error `name` has no home, offset optional-vs-guaranteed                                                                                                                                              | quarry `run/types.ts:67-72`; embody `types.ts:63-70`                                  |
| formatting error arm                        | drop (resolved 2026-08-06 — no doc line needed)          | formatting is level-owned editor-support DATA (the `format` channel [read: language-levels/README.md:46-48]) consumed by the orchestrator's editor adapter [read: orchestrate/README.md:113]; it is not a run gate anywhere in the current architecture — the assignment was already recorded, so the drop was never silent                        | `validating/types.ts:130-132`                                                         |
| error `line` on a learner throw             | restore on intercept; DEFERRED on run (ruled 2026-08-06) | intercept's threw arm already carries the wrap-style loc — richer than the reference's line; run has NO wrap layer, so run-side call-site instrumentation is a NAMED future increment, not this campaign's; wrap-style per the region ruling — NEVER a stack parse; the reference's untested numbers are not the conformance target                | quarry `run/types.ts:35`, `create-worker-script.ts:219-237`                           |
| error `column`                              | drop (ruled — human-supplied prior, re-measured)         | declared-never-populated in the reference itself: the extractor regex discards the column group; 1 occurrence = the declaration                                                                                                                                                                                                                    | quarry `run/types.ts:36` `[measured: grep -n column over reference run/*.ts → 1 hit]` |
| `phase: 'creation' \| 'execution'`          | restore (ruled 2026-08-06 — E2 IN SCOPE)                 | pedagogically real (didn't-construct vs ran-then-threw); E2 splits the engine's one try/catch + adds a halt field — additive, its own AR pair under ceremony full                                                                                                                                                                                  | quarry `run/types.ts:37`; engine bootstrap single-try                                 |
| `TimeoutResultError.limit` (+ `durationMs`) | restore (ratified 2026-08-06)                            | once seconds is settable, echoing the budget on the timeout arm follows; `durationMs` is computed by the engine and currently discarded — free                                                                                                                                                                                                     | quarry `run/types.ts:41-47`; engine `types.ts:193`                                    |
| `IterationLimitResultError.limit`           | drop (signed 2026-08-06)                                 | caller supplied `spec.iterations` and holds its own copy; the trip record (loop index + span) is strictly richer                                                                                                                                                                                                                                   | quarry `run/types.ts:50-57`                                                           |
| clean-arm `iterationCount`                  | ADDITION (ruled 2026-08-06)                              | surfaced on the clean arm: cost already paid under always-splice; reference-plus in reference style (rides RunResult/InterceptResult, not the settlement floor); the old kind's withholding ruling retires with the deprecated region                                                                                                              | port `run/types.ts:107-113`                                                           |

## run — protocol and infrastructure

| member                                                                    | classification                       | rationale                                                                                                                                                                                     | evidence                            |
| ------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| dialog io-request round-trip protocol (3 typed SAB writers, worker traps) | supersede (ruled HR-3)               | STRENGTH: transport re-homed into the generic engine call channel; the consumer-visible loss is entirely the io-option row, restored above                                                    | engine `types.ts:222-234`           |
| exported worker-protocol surface (19 symbols)                             | drop (signed 2026-08-06)             | engine internals are deliberately private; zero external importers ever existed; FLAG: the quarry trace/semantics WAS a real cross-module consumer — resurfaces at that future port, not here | engine `worker/types.ts:5-6`        |
| tagged `IoResult` union                                                   | drop (audit-refuted NOT_A_LOSS)      | port wire self-describes finer (4 codes vs 3) and validates what the reference silently coerced                                                                                               | Appendix A                          |
| Blob-URL worker script (source-as-a-value)                                | supersede (ratified 2026-08-06)      | STRENGTH: static module URL is the bundler-supported path; per-run variation is pinned unsupported. FLAG carried: no test catches a bundler regression — prose + eslint-disable only          | port `create-run-stream.ts:149-153` |
| per-round-trip budget charge on the SAB handshake                         | drop (signed 2026-08-06)             | engine charges per-yield, zero per-call — deliberate (calls pause the budget); a call-heavy program pays no synthetic fee                                                                     | engine `evaluate.ts:339`            |
| D5b decision record engagement                                            | restore-as-doc (ratified 2026-08-06) | the new run DOCS must cite and answer the reference's io rescission note — cheapest row in the ledger, closes the "re-took a rescinded posture without engaging the record" finding           | quarry run DOCS D5b                 |
| README runnable commands (sandbox launch, 2 test-tier commands)           | restore (ratified 2026-08-06)        | docs-only, cheap                                                                                                                                                                              | quarry `run/README.md`              |

## intercept — handle

| member                                                                      | classification                                 | rationale                                                                                                                                                                                                                                                                                                                            | evidence                                                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `InterceptHandle` name; full generator surface (`.next`/`.return`/`.throw`) | restore (ruled HR-5)                           | —                                                                                                                                                                                                                                                                                                                                    | quarry `intercept/types.ts:261`                                                  |
| the lib-`AsyncGenerator` TYPE token                                         | supersede (ratified 2026-08-06)                | STRENGTH: TS 5.9's `AsyncGenerator` drags in `AsyncDisposable` + a required `return()` argument; an explicit interface reproduces the reference's MEMBER signatures faithfully instead                                                                                                                                               | the TS lib's `AsyncGenerator` + `AsyncDisposable` declarations (es2018 + esnext) |
| reference `.throw` semantics                                                | supersede (ratified 2026-08-06)                | the reference never specified it — `.throw` was the NATIVE generator method (only next/return overridden), a latent defect that skipped teardown; spec: `.throw(e)` ≡ `fail(e)` + settle `outcome:'fail'`, `reason: e`                                                                                                               | quarry `intercept.ts:735-894`                                                    |
| reference `.return()` drain-through-`origNext`                              | supersede (ratified 2026-08-06)                | STRENGTH: verbatim it deadlocks on a suspended ask against the engine's out-of-band teardown (pin intercept:292, retained); spec: latch → release ask → engine stop → settlement → resolve with the full result. Stated behavior change: `for await`-break now awaits settlement (reference behavior) where the port broke instantly | plan § 4                                                                         |
| `.fail(reason)` + `outcome:'fail'` + `result.reason`                        | restore (ruled HR-8 — outcome includes `fail`) | the only structured consumer-stop channel; both quarry tracers carry it too                                                                                                                                                                                                                                                          | quarry `intercept/types.ts:282`, README § Fail                                   |
| `.code`, `.options` eager                                                   | restore (ratified 2026-08-06)                  | HR-4 default; trivial echoes                                                                                                                                                                                                                                                                                                         | quarry `intercept/types.ts:289, :296`                                            |
| `.ast` promise on the handle                                                | restore, re-derived (ruled HR-12)              | resolves to the CURRENT embody's entwined record (`facts.entwined.byPath`), not a link/ shadow record                                                                                                                                                                                                                                | quarry `intercept/types.ts:315`; port embody `types.ts:191-215`                  |
| `then`/`result`/`cancel`                                                    | restore (ruled HR-3/HR-6)                      | drain-on-await cancels at the first STRUCTURALLY-unanswered ask (ruled HR-7)                                                                                                                                                                                                                                                         | shared rows above                                                                |

## intercept — options

| member                                           | classification                    | rationale                                                                                                                                                                                  | evidence                            |
| ------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `InterceptOptions` name; `seconds`               | restore (ruled HR-8 / HR-4 round) | as run's seconds row                                                                                                                                                                       | quarry `intercept/types.ts:226-230` |
| `io` dialog mocks                                | restore (ruled HR-9)              | answered at the `serveAsk` seam BEFORE a pending-interaction is minted; no mock → pending-interaction (the named port-stronger carve-out — lens-rendered interaction beats native dialogs) | quarry `intercept/types.ts:201-209` |
| `io.console` / `IoConsole` per-method callbacks  | restore (ruled HR-9)              | callbacks awaited before the program continues, per reference                                                                                                                              | quarry `intercept/types.ts:177-181` |
| `iterations` `Infinity`/omitted = skip injection | drop (signed 2026-08-06)          | as run's always-splice row                                                                                                                                                                 | quarry `intercept/types.ts:216-224` |

## intercept — result

| member                                               | classification                      | rationale                                                                                                                                               | evidence                            |
| ---------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `InterceptResult` name; `events` array on the result | restore (ruled HR-8)                | kills the awaiting-without-pulling-stalls regression; replay identity NOT restored (HR-2)                                                               | quarry `intercept/types.ts:154-162` |
| `outcome` 6-value incl. `fail`; `ok`                 | restore (ruled HR-8)                | —                                                                                                                                                       | quarry `intercept/types.ts:114-120` |
| `reason?: unknown`                                   | restore (ruled HR-8, rides `.fail`) | —                                                                                                                                                       | quarry `intercept/types.ts:157`     |
| `code` / `options` echoes                            | restore (ratified 2026-08-06)       | HR-4 default                                                                                                                                            | quarry `intercept/types.ts:158-159` |
| `ast` record on the result                           | restore, re-derived (ruled HR-12)   | the entwined record (real graph), not a shadow tree                                                                                                     | quarry `intercept/types.ts:160`     |
| `visitCounts`                                        | restore (ruled HR-12)               | accumulated thread-side by resolved `nodePath`; null-key policy decided in P0-I (loc-null events excluded or sentinel-bucketed — named, not accidental) | quarry `intercept/types.ts:161`     |
| `eventsByNode`                                       | ADDITION (ruled HR-12)              | the §13-clean replacement for `node.events[]` back-refs                                                                                                 | semantics-tracer precedent          |

## intercept — entwining

| member                                                  | classification                                                    | rationale                                                                                                                                                                                                       | evidence                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `nodePath` per event                                    | restore (ruled HR-12)                                             | enumerable plain string, joined thread-side via offsets → `entwined.byOffset` → deepest-exact-span ascent                                                                                                       | quarry `link/types.ts:145`                                             |
| offset pair on events                                   | ADDITION (ruled HR-12)                                            | stamped near-free from the wrap's original-text parse; the coordinate valid in both spaces — answers the I8 carried-forward question                                                                            | wrap parse `start`/`end`                                               |
| `node` live reference                                   | restore-as-accessor (ruled HR-12 — mechanism ratified 2026-08-06) | NON-ENUMERABLE accessor resolving the REAL `EntwinedNode` — JSON-safe, §13-clean; an enumerable own-property ref would re-create the shadow-graph/cycle problems the quarry's own newer tracer abandoned        | quarry `link/types.ts:147`; `trace/semantics/tracing/types.ts:845-850` |
| `prev` / `next` timeline links                          | restore-as-accessors (ruled HR-12)                                | installed inside `onMessage` before yield; mutable-pointer closure = the NAMED no-mutable-closures exception                                                                                                    | quarry `link/types.ts:152, :162`                                       |
| `callee` / `calleePath`                                 | restore-as-accessor/derived (ruled HR-12)                         | resolved off the joined CallExpression node                                                                                                                                                                     | quarry `link/types.ts:170, :175`                                       |
| `node.events[]` back-refs                               | supersede (ruled HR-12)                                           | STRENGTH: embody's graph is frozen and cannot grow arrays; `eventsByNode` on the result carries the same join, JSON-safe                                                                                        | quarry `link/types.ts:100`                                             |
| `nodePathSource` 3-state provenance                     | drop (audit-refuted)                                              | 2 of 3 values unreachable in the port architecture; `'instrumented'` ≡ `loc !== null`                                                                                                                           | Appendix A                                                             |
| `loc === node.loc` identity                             | drop (signed 2026-08-06)                                          | loc survives as a fresh per-event span; identity served replay-adjacent navigation                                                                                                                              | quarry `link/types.ts:148`                                             |
| `'enclosing-fallback'` (stack → deepest enclosing node) | restore (ruled 2026-08-06 — AST-side)                             | deepest-enclosing-node via `entwined.byOffset` at halt time — cheap, exact, §13-clean, NEVER a stack parse; supersedes pin intercept:208 (disposition flipped in § Pin dispositions below by this ratification) | quarry `link/lookup-node-path.ts:45,:79`                               |
| link/ shadow AST tree (456 lines)                       | supersede (ruled HR-12)                                           | STRENGTH: duplicates `entwined` nearly field-for-field, mints a second node-identity space, and its post-freeze mutation pattern conflicts with DEV.md §13                                                      | `link/build-location-index.ts` vs embody `types.ts:191-215`            |

## intercept — error taxonomy and stream

| member                                                              | classification                     | rationale                                                                                                                                                                                             | evidence                                                         |
| ------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| streamed `ErrorEvent` (errors as step-stamped events IN the stream) | restore (ruled 2026-08-06)         | in-timeline error rendering returns — the event union gains an error arm (step + loc stamped, landing in order); the settlement keeps the structured form. Both, as the reference had                 | quarry shared `types.ts:188-195`                                 |
| `phase` on error events                                             | drop (signed 2026-08-06)           | near-constant under the gate architecture                                                                                                                                                             | quarry `intercept/types.ts:52-55`                                |
| `ValidationResultError` + violations                                | drop-as-loss (resolved 2026-08-06) | relocated live (screening `Violation` + language-levels validate + orchestrate marking); behavioral delta recorded: intercept no longer gates execution on level — sanctioned (level-agnostic ruling) | port `lib/screening`                                             |
| `ExecuteMessage.scriptMode` (sloppy/`with`)                         | supersede (ratified 2026-08-06)    | STRENGTH: the kind's execution axis is a recorded deliberate collapse                                                                                                                                 | port `src/lib/study-lenses/evaluators-deprecated/types.ts:44-49` |
| `createWorkerScript(): string`                                      | drop (signed 2026-08-06)           | replaced by an importable module + fake transport; 27 string tests became 170 behavioral tests                                                                                                        | audit digest                                                     |

## sandbox pages (BOTH lineages per HR-15)

| member                                                                                                                                                                                          | classification        | rationale                                                                                                                                                                      | evidence                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| REFERENCE run sandbox: IO toggles, styled dialogs, console dumps (`[run handle]`/`[run result]`), unexpected-throw catch, presets (+ timeout preset), max-seconds control                       | restore (ruled HR-15) | the reference pages are fidelity targets; the slow-mock cancel rig returns ADAPTED (cancel-waits-for-mock is superseded — the rig demonstrates discard-on-stop instead)        | quarry `run/sandbox.html`                         |
| DEPRECATED-PORT sandboxes: intercept C2 card flows (5 checkpoint items), full-data serializer (present-but-`undefined` rendered, live `respond` shown), per-arm presets; run's page equivalents | restore (ruled HR-15) | "carefully crafted — migrate them too with the same attention to fidelity"; full feature inventory of both deprecated pages taken at R6/I8 execution and appended here as rows | port `run/sandbox.html`, `intercept/sandbox.html` |
| sandbox cadence                                                                                                                                                                                 | ruled HR-15           | pages built EARLY in each chain, extended per increment; every user-observable increment fires its own 🔍; variables' declared skip OVERRIDDEN — it gets a page                | human ruling 2026-08-06 (HR-15) below             |

## docs-only rows

| member                                                                          | classification                    | rationale                                                                                      | evidence                                          |
| ------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| cancel-mechanics 6-phase table + promptness commitment                          | drop (signed 2026-08-06)          | docs density; the new DOCS states the sequenced teardown instead                               | quarry run README                                 |
| engine docs "three arms" sentence + links into `evaluators-deprecated/types.ts` | restore-accuracy (W1.d increment) | goes stale under HR-8/HR-14; architectural-contract edit with human approval, never a drive-by | engine `types.ts:163-166`, README:203/413, DOCS:6 |

## Appendix A — refuted findings (NOT losses; barred from classification rows)

Recorded so nobody re-audits them:

- **async-mock arm** (Promise-returning mocks, rejection mapping,
  cancel-during-mock semantics, per-pause charge): all limbs live in the shared
  engine (`onCall` sync-or-Promise, rejection → call-error,
  uninterruptible-call + discard-on-stop, per-yield charge). The original
  finding scoped its greps to danger/intercept and missed the engine.
- **`nodePathSource`**: 2 of 3 values unreachable in the port architecture; the
  real residue is the enclosing-fallback row above (now ruled restore).
- **`IoResult`**: the port wire is strictly finer and validates what the
  reference silently coerced (e.g. `undefined`→`false` on confirm).

## Appendix B — trace/variables (pending the W1.b fidelity audit)

trace/variables was never audited; its rows land here after W1.b and are
ratified at gate G3. Known already, for orientation: quarry shape is code-first
`traceVariables(code, {seconds})` → reshaping it onto the kind is a full Phase-0
redesign; handle already `AsyncIterable & {result, cancel, fail}`; result
`{events, settlement}`; events carry `nodePath`/`scopeInstanceId` under
conventions that MATCH current embody (verified); its settlement speaks the
engine's five outcomes — its vocabulary under HR-8 is P0-V's design question,
not silently inherited.

---

## Rulings of record

The campaign's binding decisions, each dated at the turn the human gave it. This
section is the home; the plan of record
(`~/.claude/plans/read-and-execute-the-rosy-sky.md` § ②) mirrors them for
execution and never holds one alone.

### Scope and posture

- **Fidelity-first (human ruling 2026-08-06, HR-4).** The task is to port the
  REFERENCE signature and behavior (`src/lib/embody/lib/evaluating/`). A
  port-side deviation survives ONLY where demonstrably stronger, and every such
  exception is named in this ledger with its strength argument. The default
  classification is `restore`.
- **`danger/` is out of scope for repair (human ruling 2026-08-05, HR-1).** Its
  synchronous-only IO mocks (`danger/backend/types.ts:63`, with the constraint
  at `:57` that a real `<script>` cannot `await`) are expected and correct.
  Corollary: danger having mocks does NOT excuse run not having them — that
  reasoning is re-partitioning, and run's IO question stands on its own.
- **Replay stays out (human ruling 2026-08-05, HR-2).** The port's non-goal at
  `lib/engine/DOCS.md:174-175` — _"Replay by re-iterating a settled handle — the
  result's items array is the cache; each evaluate call is a fresh run"_ — is
  affirmed. The re-iteration machinery in `create-execution.ts` is therefore NOT
  part of the migration: the handle contract is wanted, the replay cache is not.
- **Scope (human ruling 2026-08-06, HR-10):** run + intercept rebuild plus the
  trace/variables port; variables was never audited, so its own fidelity pass
  precedes its Phase 0 and is staged strictly later so it cannot block
  run/intercept. trace/semantics, trace/syntax and adapter/ are future
  campaigns. The kind is designed against the fourteen tracer
  forward-compatibility requirements (`research-digests-2026-08-05.json` —
  recoverable via
  `git show a8a0128d:<this directory>/research-digests-2026-08-05.json`, key
  `.result.tracers`).
- **Build forward; deprecate and rebuild (human ruling 2026-08-06, HR-11 +
  HR-14).** New commits only, no reverts. The current port evaluators are
  renamed to `src/lib/study-lenses/evaluators-deprecated` (single-dash,
  kebab-legal) and `evaluators/` is rebuilt fresh under the canonical name, with
  the quarry AND the deprecated port both serving as references. The deprecated
  region stays in tsc and vitest, frozen — compile-and-green only; its exit
  condition is danger's future migration onto the new kind.

### The contract

- **A handle, not a bare stream (human ruling 2026-08-05, HR-3).** `main()`
  returns the reference's shape —
  `AsyncIterable & PromiseLike & { result, cancel }` — widened per evaluator
  with its own eager fields. Ruled on three grounds: zero current consumers, the
  handle being a strict superset that leaves consumer-paced iteration intact,
  and `AsyncIterable<never>` being a shape that exists only to satisfy an
  interface it does not benefit from. Consequences ruled in by implication: the
  shared kind's `types.ts` changes (it declares `main`'s return type, so eager
  fields cannot be added evaluator-side); it is a Phase-0 contract redesign with
  `ar-1` and `ar-2`; and eager-versus-deferred is a per-evaluator choice, which
  the reference itself made both ways (`run/types.ts:203` synchronous,
  `intercept/types.ts:315` a Promise).
  - **Its consequence 2 is superseded in mechanism (2026-08-06).** HR-3 said
    danger gets touched to keep compiling. Under HR-11/HR-14 the old kind's
    `types.ts` is never edited — it rides into `evaluators-deprecated/`
    untouched — so danger keeps compiling with ZERO edits (zero importers
    outside the region, no engine imports, inside tsc and vitest). The
    obligation is discharged by the old kind's immutability, not by an edit.
- **The full generator surface (human ruling 2026-08-06, HR-5).** intercept's
  handle widens to `.next`/`.return`/`.throw` plus
  `{ fail, code, options, ast }` per the reference (`intercept/types.ts:261`).
  Where the reference's own semantics were accidental or engine-incompatible —
  `.throw` was the NATIVE generator method, only next/return were overridden —
  this ledger specifies the replacement and records the delta as its own row.
- **Both consumption modes (human ruling 2026-08-06, HR-6).** `for await`
  step-through AND `await handle` → the complete result. Creation stays inert:
  the run starts at first consumption (first pull OR first await), never at
  construction. This is the campaign's one laziness carve-out against the
  reference, which queueMicrotask-auto-started at creation
  (`shared/create-execution.ts:107-117`); it also kills that design's
  one-microtask claim race.
- **Drain-on-await cancels at an unanswered ask (human ruling 2026-08-06,
  HR-7).** Under a batch drain, an intercept ask nobody answers cancels the run
  at that ask, settling with the events so far. "Unanswered" is STRUCTURAL — no
  mock supplied for that verb — never temporal.
- **Reference names and values, wholesale (human ruling 2026-08-06, HR-8).**
  `Execution`, `RunHandle`, `RunResult`, `InterceptHandle`, `InterceptResult`,
  `outcome: 'complete'|'cancel'|'fail'|'timeout'|'iteration-limit'|'error'`,
  `ok`, the result fields (`events`, `code`, `options`, `ast`, `visitCounts`),
  and the reference's event-field spellings all return. Port enrichments ride as
  ADDITIONS in reference style: machinery-defect discrimination as an added
  error kind, `loc` plus an offset pair on events, the pending-interaction arm,
  and the `trip` record on iteration-limit.
- **IO mocks on both evaluators (human ruling 2026-08-06, HR-9).** run gains
  worker dialog traps over the engine's existing `onCall` seam; a supplied mock
  answers, and no mock settles a classified io-error outcome. intercept answers
  mocks at its `serveAsk` seam BEFORE a pending interaction is minted; no mock
  yields the pending interaction as today. `io.console` per-method callbacks
  return.
- **Entwining re-derived against current embody (human ruling 2026-08-06,
  HR-12).** The reference's event signatures predate today's
  `src/lib/study-lenses/embody/`, so fidelity here targets the CAPABILITY, not
  the mechanism. Events gain an offset pair stamped from the wrap's
  original-text parse; enrichment happens thread-side inside `onMessage`, before
  the engine's shallow freeze-at-yield (`lib/engine/evaluate.ts:275`); the
  result carries `eventsByNode` and `visitCounts`; `link/`'s shadow AST tree is
  NOT ported. **Mechanism:** enumerable event fields stay plain data (`step`,
  `loc`, offsets, `nodePath`); `node`, `prev`, `next` and `callee` are
  NON-ENUMERABLE ACCESSORS resolving through `facts.entwined.byPath` and a
  thread-side pointer, so `JSON.stringify` stays safe while `event.node` answers
  with the real `EntwinedNode`. The mutable-pointer accessor is a NAMED
  exception to the no-mutable-closures rule, scoped: installed inside
  `onMessage` before return, never written after yield. **Caveat carried
  deliberately:** the quarry precedent at
  `trace/semantics/tracing/types.ts:836-843` covers `prev`/`next` ONLY — that
  tracer explicitly DECLINES a `.node` reference (`:845-849`, _"There is no
  `.node` reference — attribute via `event.nodePath`"_). The `.node`/`.callee`
  accessors therefore EXTEND the precedent rather than follow it; `ar-1` must
  challenge that extension on its own terms.
- **Tracer config fidelity targets git history (human ruling 2026-08-10,
  HR-16).** The trace config surfaces were painstakingly crafted with the
  creator of Aran, and the working-tree quarry copy is itself a descendant — so
  the fidelity target is the RICHEST revision in history, not the current
  checkout. Anchors
  `[measured: git log --follow over the quarry's semantics/config.types.ts; git log --diff-filter=A over '*trace*/config*']`:
  a full `configuring/` pipeline (ajv schema validation, expand-shorthand,
  fill-defaults, prepare-config, validate-config, tests, README) exists at
  `68fa9981` and `c969412b` under
  `src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/`.
  Consequences: every tracer fidelity audit sweeps history (`git log --follow`
  plus `git show <sha>:<path>`) and may cite `SHA:path` as reference evidence;
  the kind must not foreclose that config richness; and the semantics port's
  future audit opens with this archaeology.

### Ceremony and sandboxes

- **`ceremony: full` (human ruling 2026-08-05, HR-13):** AR-1 · AR-2 · AR-3 on
  every un-skip · AR-4 on every increment · AR-5. Uniform within the level — no
  agent-side lightening.
- **AR-5 changeset form and baseline (human ruling 2026-08-05).** The review
  changeset is the campaign's OWN SHA LIST, never `baseline..HEAD` — foreign
  commits interleave faster than any range survives (DEV.md § Shared-worktree
  git mechanics). Baseline `1b516bd4`
  `[relayed: the retired AR-LOG's baseline record — recover via git show 7c93080c^:.planning-handoffs/evaluators-api-restoration/AR-LOG.md — which carried [measured: git rev-parse HEAD at the first post-approval write]]`.
  The SHA list accumulates in each commit body as it lands (the durable
  primary), mirrored in `~/.claude/plans/read-and-execute-the-rosy-sky.md` § ②
  RESUMPTION POINT.
- **Sandbox cadence and sandbox fidelity (human ruling 2026-08-06, HR-15):**
  sandbox pages are built EARLY in each evaluator chain and extended per
  increment, so every user-observable increment fires its own 🔍 checkpoint
  rather than one end-of-chain check; the declared 🔍 skip for variables is
  overridden. And the DEPRECATED port's sandbox pages are fidelity targets
  alongside the reference's — both lineages' page features are inventoried in
  this ledger's sandbox section, and the rebuilt pages carry the union.

### The ratification, and what it settled (human ruling 2026-08-06)

One pass over every row. The bulk confirm covered all proposed rows, including
the two mechanisms that had been earmarked for the Phase-0 design gate — the
creation-inert carve-out and the accessor-based enrichment — so that gate keeps
only its design-review role. The eight escalated decisions:

- **Error `line`** — restore on intercept, which already carries a wrap-style
  `loc` richer than the reference's line; DEFERRED on run, which has no wrap
  layer, so run-side call-site instrumentation is a named future increment.
  Never a stack parse; the reference's own untested numbers are not the
  conformance target.
- **`phase: 'creation' | 'execution'`** — IN SCOPE as its own engine increment:
  the engine's single try/catch splits and the worker stop record gains the
  discriminant. Additive, with its own AR pair.
- **Clean-arm `iterationCount`** — ADDED, reference-plus: the total is already
  computed under always-splice, and it rides the results rather than the
  settlement floor.
- **In-stream `ErrorEvent`** — RESTORED: intercept's event union gains an error
  arm carrying `step` and `loc`, landing in stream order; the settlement keeps
  the structured form. Both, as the reference had.
- **Enclosing-fallback attribution** — RESTORED AST-side, via
  `entwined.byOffset` at stop time: cheap, exact, and never a stack parse.
- **Gate arms (`rejections`, formatting)** — resolved by the current
  architecture rather than restored: level marking is the ORCHESTRATOR's
  (screening plus the language level's validate plus orchestrate marking,
  live-wired) and embody is level-blind by contract (`embody/DOCS.md:101-105`,
  _"a language level decides what is ALLOWED"_); formatting is level-shipped
  editor-support DATA (`language-levels/README.md:46-48`) consumed by the
  orchestrator's editor adapter (`orchestrate/README.md:113`). Already recorded
  in those regions' own docs — nothing returns to evaluators.
- **`.fail` on run** — NOT added. The reference asymmetry is kept: fail is the
  mid-stream consumer stop, run yields nothing, and cancel covers its one stop;
  fail rides intercept and the tracers.

## Pin dispositions

The rebuild happens in a new directory, so a new-region build never trips the
pinned-guard on the deprecated region's settled expectations. This table is what
prevents their re-litigation. Inventory
`[measured: grep -n "// PINNED" over create-run-stream.test.ts (9 rows) and create-intercept-stream.test.ts (18 rows)]`,
paths relative to `src/lib/study-lenses/evaluators-deprecated/`. Disposition
vocabulary (closed): **retained** — the behavior carries into the new region and
the pin's authority travels with it; **re-scoped** — true of the iteration path
once the await path exists; **superseded** — the new region deliberately
contradicts it. No pin fell outside the vocabulary.

| file:line     | pinned claim (short)                                                                            | disposition | authority                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| run:103       | nothing engine-side before the first pull; result access starts a run                           | retained    | HR-6 keeps it — await counts as consumption, not an earlier start                                                                    |
| run:140       | teardown answers OUT OF BAND, never via generator return queueing                               | retained    | carried into the new handle design (the `.return()` sequencing)                                                                      |
| run:154       | a pull after teardown never starts a fresh run                                                  | retained    | —                                                                                                                                    |
| run:208       | guard increments before comparing; cap N trips at N+1                                           | retained    | iteration-guard transports byte-identical                                                                                            |
| run:217       | guards splice on the ORIGINAL source; trip span faithful                                        | retained    | HR-12 relies on it                                                                                                                   |
| run:235       | iterations rides through unchanged (no clamp/default/gate)                                      | retained    | —                                                                                                                                    |
| run:272       | the engine's refinement hook goes unused; the stop record is authored where the raw throw lives | retained    | —                                                                                                                                    |
| run:289       | no machine ran → no machinery cause is honest                                                   | retained    | defect taxonomy rides as an HR-8 addition                                                                                            |
| run:300       | restart guard: a handle-only guard misses the defect route                                      | retained    | human ruling 2026-08-05 (H-7)                                                                                                        |
| intercept:118 | nothing engine-side before the first pull                                                       | retained    | HR-6, as run:103                                                                                                                     |
| intercept:173 | both sources join ONE arrival queue in worker post order                                        | retained    | carried into the stream factory's rebuild                                                                                            |
| intercept:200 | the wrap stamps the innermost call site, end to end                                             | retained    | —                                                                                                                                    |
| intercept:208 | statement-level throw outside any wrap → loc null; NO stack parse                               | superseded  | ledger ratification 2026-08-06 — enclosing-fallback attribution restored AST-side via `entwined.byOffset`; still NEVER a stack parse |
| intercept:250 | the fake rejects an async round-trip (property of the double)                                   | retained    | engine + fake untouched                                                                                                              |
| intercept:265 | a pull after teardown never starts a fresh run                                                  | retained    | —                                                                                                                                    |
| intercept:292 | teardown out of band, never through the engine's stream exit                                    | retained    | the `.return()` sequencing builds ON it                                                                                              |
| intercept:309 | teardown LATCHES; a later pull is inert                                                         | retained    | aligns with HR-2                                                                                                                     |
| intercept:337 | the stream must be pulled for every event; one pull starts, not finishes                        | re-scoped   | HR-6 — true of the ITERATION path; the await path drains without consumer pulls                                                      |
| intercept:356 | guards splice FIRST on the original text                                                        | retained    | —                                                                                                                                    |
| intercept:361 | splice order not interchangeable (columns shift)                                                | retained    | —                                                                                                                                    |
| intercept:394 | iterations rides through unchanged                                                              | retained    | —                                                                                                                                    |
| intercept:443 | no machine ran → no machinery cause is honest, inherited                                        | retained    | —                                                                                                                                    |
| intercept:456 | assemble-defect settlement frozen outside the mapper                                            | retained    | —                                                                                                                                    |
| intercept:465 | restart guard, both modules                                                                     | retained    | human ruling 2026-08-05 (H-7)                                                                                                        |
| intercept:480 | an outstanding pull completes as the stream's end, any route                                    | retained    | —                                                                                                                                    |
| intercept:495 | yield charge named; loop safety rests on iterations                                             | retained    | the engine's yield-charge opt-out is the narrow fix that ruling anticipated, not a contradiction                                     |
| intercept:504 | flat charge arithmetic; a floor of 500 is meaningful                                            | retained    | same note                                                                                                                            |

## Open items carried into execution

- **The engine's yield-charge opt-out** — raised first by the semantics tracer,
  re-raised by intercept (human ruling 2026-08-04): the engine deducts a flat
  charge per yielded event against a 5-second default, so a densely emitting
  program times out with almost no real runtime. The ruling was "budget for it,
  and treat the narrow fix as the engine's": emit everything, name the cost,
  rest loop safety on the iterations cap. The opt-out on the engine spec is this
  campaign's first engine increment; both intercept and trace/variables qualify
  for it.
- **`evaluators-deprecated/PHASE-1-HANDOFF.claude-delete-if-stale.md` is KEPT**
  (human ruling 2026-08-04). Untracked and never committed at ruling time, so
  deletion would have been unrecoverable (now TRACKED — swept into the human's
  `90c31797` checkpoint, 2026-08-11); 29 of its 148 lines are tracer material —
  quarry prior art, the variable/binding/environmentDiff event design, and open
  decisions for later sprints. It rides any region move untouched, and the
  variables phase is its natural reader.
