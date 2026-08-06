<!-- TRANSITIONAL — pruned when the restoration campaign completes; before
pruning, promote the durable rulings (the HR-4 posture, HR-12's enrichment
mechanism, the pin dispositions the new region's docs rely on) into the new
region's end-state docs per DEV.md § Ruling provenance's promotion rule. -->

# evaluators — public-API restoration: AR-LOG

Region-level log for work that spans `evaluators/run` and `evaluators/intercept`
together. Opened 2026-08-05 after two fidelity audits established that the
greenfield port of the evaluating region delivered a substantially poorer public
surface than the implementation it replaced.

The per-evaluator logs stay where they are
(`.planning-handoffs/evaluators-{run,intercept}/AR-LOG.md`); this file exists
because the findings and the human's rulings are region-wide and have no home in
either.

**Plan of record for the campaign:**
`~/.claude/plans/read-and-execute-the-rosy-sky.md` (ExitPlanMode-approved
2026-08-06; context-free-validated). The earlier cold-start brief
`cold-start-evaluator-api-re-enrichment.md` is DISCHARGED — its § 8 deliverables
all exist (the § Human rulings HR-4..HR-15, the LOSS-LEDGER, the plan); read it
only as history.

---

## What happened

A multi-week campaign ported the evaluating region from `src/lib/embody/` to
`src/lib/study-lenses/`. The human's intent was a port that **preserved the
reference's carefully designed public API**. What was delivered is a greenfield
redesign with a much poorer surface, executed with full ceremony against the
wrong reference.

The ceremony was not skipped — it was aimed at the wrong target. Every increment
verified itself against the new contract; nothing ever diffed that contract
against the implementation it replaced, so no gate could have caught it. **The
missing artifact was a loss ledger.** Phase 0 produced a coherent new contract
and never asked what the old one did that the new one would not.

Three lineages, kept straight:

|              | Path                                                                          | Role                                                                                                              |
| ------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| REFERENCE    | `src/lib/embody/lib/evaluating/{shared,run,intercept,trace,adapter}`          | the real, working, rich implementation — read-only quarry                                                         |
| INTERMEDIATE | `src/lib/embody/lib/evaluating/evaluators/intercept/` (docs + types, no impl) | where the drops were licensed; arrived in the human's bulk commit `0fca239e` (2026-07-15, "migrate for refactor") |
| PORT         | `src/lib/study-lenses/lib/engine/`, `.../evaluators/{run,intercept,danger}`   | what exists now                                                                                                   |

The campaign treated the INTERMEDIATE as the design target and the REFERENCE as
a quarry to harvest shapes from.

---

## The audits

Two exhaustive multi-agent fidelity audits, 7 dimensions each, every finding
adversarially verified by a skeptic prompted to refute it.

- **run** — run id `wf_7cb9c40a-f4c`, 14 agents, complete.
- **intercept** — run id `wf_5c5b0dc6-37e`, 28 agents, complete.

Durable per-agent results: `journal.jsonl` under
`~/.claude/projects/-Users-master-Documents-…-0-curricula/39e6536d-…/subagents/workflows/<run-id>/`.
Records carry a `label` and, for verifier agents, `holdsUp` /
`refinedClassification` — a `holdsUp:false` record REFUTES a finding rather than
reporting one. Verify completeness by comparing the `"type":"started"` count
against `"type":"result"` before trusting either journal.

`[relayed: both audits]` — with the caveat that agent-supplied counts are
hypotheses. One was wrong on relay and was corrected: `LinkedInterceptEvent` was
reported as carrying 11 fields; it **adds eight** on top of the REFERENCE's base
event `[measured: grep -c "readonly " over link/types.ts:144-176]`. Mind the
baseline when you quote that number: measured against the PORT's
`InterceptEventBase` the delta is **seven**, because one of the eight is `loc`,
which the port has. The enumeration below is the seven.

---

## The core finding — one file never crossed

`src/lib/embody/lib/evaluating/shared/` had two halves.

The **transport half** became `src/lib/study-lenses/lib/engine/`. It came out
**richer**, and consolidated real duplication: in the reference, `run/` and
`intercept/` each carried their own `worker-protocol.ts` +
`create-worker-script.ts`. This part of the migration was good and must not be
undone.

The **consumer-contract half** was not ported at all:
`shared/create-execution.ts` (246 lines) + `Execution<TEvent, TResult>` at
`shared/types.ts:48` + 336 lines of tests.
`[measured: grep -rl createExecution over the port]` → **0 files.**

```ts
// shared/types.ts:48, verbatim
type Execution<TEvent, TResult> = AsyncIterable<TEvent> &
	PromiseLike<TResult> & {
		readonly result: Promise<TResult>;
		readonly cancel: () => void;
	};
```

Most per-evaluator losses are consequences of that single omission.

### Losses, verified

**intercept** — `[relayed: wf_5c5b0dc6-37e]` ZERO of the reference's 18 exported
type names survives into the port under the same name
`[measured: the export block at intercept/types.ts:394]`. Dropped:
`options.seconds`, `options.io`/`IoMocks`/`IoConsole`, `result.events`,
`.fail(reason?)`, `.ast`, `.code`, `.options`, `visitCounts`, the memoized
`.result` + `then()` delegate, the full `AsyncGenerator` surface, and the
exported protocol types. Entwining is the largest: `LinkedInterceptEvent`
(`link/types.ts:144-176`) adds `nodePath`, `nodePathSource`
(`'instrumented' | 'enclosing-fallback' | 'no-ast'`), `node` (a live `ASTNode`
reference carrying `events[]` back-refs), `prev`, `next`, `callee`, `calleePath`
— against the port's `step` + `loc`. the quarry `intercept/DOCS.md:24` names the
capability: _"Bidirectional navigation between events and source."_

**run** — `[relayed: wf_7cb9c40a-f4c]` `.options`/`ResolvedRunOptions`, `.code`,
a **synchronous** `.ast`, the memoized `.result`, `.cancel()` as a named method,
the `PromiseLike` `.then` delegate, `RunOptions.io` entirely, `rejections` and
the parse/formatting error arms, the `io-error` termination cause, and the
sandbox's IO toggles. Plus **error position**: the reference carried `line`,
`column` and `phase` on a JavaScript error (`run/types.ts:31-38`), extracted
worker-side (`extractLineFromError`, declared `run/create-worker-script.ts:230`)
and consumed downstream
(`study-lenses--deprecated-architecture/orchestrate/lib/error-interpreting/extract-context.ts:33-34`).
The port's `threw` arm carries name, message, `reason` and `iterationCount` only
(`run/types.ts:89-93`) — a learner throw no longer says WHERE. **`column` is the
exception and must be classified `drop`, not `restore`**: it was declared and
never populated — the extractor's regex `/:(\d+):\d+\)?$/` discards the column
group, and `column` appears exactly once in the whole reference run directory,
at its own declaration.

**Fair on both sides**: outcome classification largely survives in different
spelling (the reference's `outcome` maps onto `ended` × `reason`, except
intercept's `fail` arm), and the 5 ms-per-yield charge survived in the engine.

### How much is already built

The engine **already carries four of the losses; the evaluators do not forward
them** `[read: src/lib/study-lenses/lib/engine/types.ts]`:

| Dropped from the evaluator surface   | Already in the engine                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `.fail(reason?)`                     | `EngineHandle.fail` — `types.ts:133-137`                                                                              |
| `result.events`                      | `EngineResult.items` — "every yielded item, then how the run ended", `:141`                                           |
| `options.seconds`                    | `EvaluateSpec.seconds`, default 5 — `:51`                                                                             |
| the IO round-trip + its budget pause | `ThreadLogic.onCall` — "the time budget pauses while it runs", `:85-91`; run passes none (`create-run-stream.ts:131`) |

Genuinely not built: the handle/`Execution` contract layer, and `link/`
entwining.

`[measured: find -name '*.ts' ! -path '*/tests/*' ! -name '*.test.ts' | xargs wc -l]`
intercept 3096 ref → 2036 port; run 1297 ref → 722 port.
`[measured: vitest run --project unit <evaluators + engine>]` 32 files / 593
tests green. The port is lean, not hollow, and the riskiest code in the region
(SAB layout, worker lifecycle, pause protocol) works.

### Recommendation carried to the human, with its counter-argument

**Keep the engine and the machinery; rebuild the contract layer only.** The seam
is exactly where `shared/` was split: the transport half crossed and is good,
the contract half never crossed.

Counter-argument, stated not buried: the kind's `main() → stream` shape cannot
express a handle with eager fields, because `evaluators/types.ts` declares what
`main` returns and every evaluator satisfies it — so rich fields must be
declared on the kind, changing all three evaluators including `danger`. That
portion is a rebuild however it is labelled, and drags full Phase-0 ceremony
behind it (kind + both evaluators re-ratified, `ar-1`, `ar-2`, and the
index/stream test clusters rewritten — the internals clusters survive).

**One objection withdrawn.** An earlier statement of this counter-argument
claimed the reference's synchronous `.ast` structurally contradicts the port's
laziness. It does not, and the reference itself is the disproof: run's `.ast` is
SYNCHRONOUS (`run/types.ts:203`, `Program | undefined`) because run parses
eagerly, while intercept's is a PROMISE (`intercept/types.ts:315`,
`Promise<Readonly<Record<string, ASTNode>> | null>`) precisely because intercept
is lazy. Eager-versus-deferred is a per-evaluator choice the reference already
made both ways, not a conflict with the handle shape. Recorded because the
overstated version was carried to the human once.

### Why a handle, and why now — the blast radius is currently zero

`[measured: grep -rlE "from ['\"].*evaluators/(run|intercept|danger)" over src, all extensions]`
→ 2 files, and **neither imports the port**:
`embody/lib/evaluating/adapter/types.ts:39` and its deprecated-architecture twin
both resolve to `../evaluators/intercept/types.js`, i.e. the INTERMEDIATE
contract inside the quarry. **Nothing imports
`src/lib/study-lenses/evaluators/*`.** So the cost of changing the public shape
is confined to the evaluators and their own tests, and it only grows from here.

Two caveats kept because both were wrong on a first pass and re-measured:
`src/lib/study-lenses/lib/loop-guard/README.md` carries **four** links into
`evaluators/danger/` `[measured: grep -c]` — documentation a kind change may
need to touch, invisible to an imports-only grep; and a looser grep over
`src/lib/study-lenses` alone reports "0 files" only if it excludes that README.
State which grep you ran when you re-measure this.

A handle is a strict SUPERSET of the current stream, not an alternative to it:
`Execution = AsyncIterable & PromiseLike & { result, cancel }`. Iteration
survives untouched, so intercept's consumer-paced pull design is unaffected;
what is gained is `await handle` for batch consumption, an explicit named
`cancel()`, a memoized result, and a place to hang eager fields. Uniform
dispatch also survives: declare the common core on the kind and let each
evaluator widen it, which is exactly what the reference did
(`InterceptHandle = AsyncGenerator<…> & Execution<…> & { code, options, ast, fail }`).

The concrete smell the current shape produces:
`RunStream = AsyncIterable<never>` (`run/types.ts:127`) — an iterable that
yields nothing, which a consumer must nevertheless pull to start, and whose
`settled` alone starts nothing. That type exists only to satisfy a uniform
interface it does not benefit from.

---

## Human rulings — 2026-08-05

Given directly by the human in session. Canonical here; the cold-start brief
mirrors them in its § 0.

- **HR-1 — `danger/` is OUT OF SCOPE.** The concern is `run` and `intercept`
  only. `danger`'s synchronous-only IO mocks (`danger/backend/types.ts:63`, with
  the documented constraint at `:57` that a real `<script>` cannot `await`) are
  expected and correct. **Corollary**: `danger` having mocks does NOT excuse
  `run` not having them — the audit's "recovered elsewhere" reasoning is
  re-partitioning, and run's IO question stands on its own. Note `danger` still
  implements the kind, so a kind change breaks it even though it is out of scope
  for repair.
- **HR-2 — replay stays OUT.** The port's non-goal at
  `lib/engine/DOCS.md:174-175` — _"Replay by re-iterating a settled handle — the
  result's items array is the cache; each evaluate call is a fresh run"_ — is
  AFFIRMED. Not a restoration candidate; record it in the loss ledger as
  `supersede`, rationale = ratified and human-affirmed. **Knock-on**: the
  re-iteration machinery in `create-execution.ts` is therefore NOT part of the
  migration — the handle contract is wanted, the replay cache is not.
- **HR-3 — GO BACK TO A HANDLE.** `main()` returns a handle, not a bare stream.
  The target shape is the reference's:
  `AsyncIterable & PromiseLike & { result, cancel }`, widened per evaluator with
  its own eager fields. Ruled after the human asked whether a handle is more
  useful for consumers and was given the three grounds recorded above — zero
  current consumers, the handle being a strict superset that leaves
  consumer-paced iteration intact, and `AsyncIterable<never>` being a shape that
  exists only to satisfy an interface it does not benefit from.

  **Consequences, all ruled in by implication — do not re-litigate them:**
  - `src/lib/study-lenses/evaluators/types.ts` (the shared `Evaluator` kind)
    CHANGES. It declares `main`'s return type, so eager fields cannot be added
    evaluator-side.
  - `danger` is touched. It implements the kind, so a kind change reaches it,
    even though HR-1 keeps it out of scope for REPAIR. Update it to compile and
    keep its tests green; do not enrich it.
  - This is a Phase-0 contract redesign, with the ceremony that implies: kind +
    both evaluators' README/types/DOCS re-ratified, `ar-1` and `ar-2`. The
    index/stream test clusters are rewritten; the internals clusters (wrap,
    narrowing, settlement mapping, worker setup) survive.
  - Two things HR-3 does NOT settle, both load-bearing, both now open questions
    for the planning agent: whether intercept widens its base to a full
    `AsyncGenerator` as the reference did (`intercept/types.ts:261`, exposing
    `.next`/`.return`/`.throw`), and whether `await handle` DRAINS when nobody
    iterates. The second collides with a PINNED port assertion —
    `intercept/tests/create-intercept-stream.test.ts:118` pins "nothing
    engine-side exists before the first pull" while
    `shared/create-execution.ts:30` promises "an internal drain loop consumes
    all events so `.result` resolves". Inverting a PINNED row needs human
    sign-off; neither reading follows from "use a handle". [CLOSED 2026-08-06:
    HR-5 settles the generator surface; HR-6/HR-7 settle drain-on-await — §
    Human rulings below.]
  - Eager-versus-deferred is a per-evaluator choice, not a global one — the
    reference made it both ways (`run/types.ts:203` synchronous,
    `intercept/types.ts:315` a Promise). Choose per evaluator against its own
    laziness posture; the port's "nothing runs before the first pull" rows are
    not automatically invalidated.

---

## Open — for the next agent, before any planning [CLOSED 2026-08-06 — every question below is ANSWERED in § Human rulings HR-4..HR-15 and § Ledger ratification; kept as history, do not re-ask]

Carried in the cold-start brief § 6. With HR-1…HR-3 settled, **seven** remain.
Two of them come out of HR-3 itself and are the brief's Q1 and Q2, because
neither follows from "use a handle": whether intercept's handle widens to a full
`AsyncGenerator` (`intercept/types.ts:261`, exposing
`.next`/`.return`/`.throw`), and whether `await handle` DRAINS when nobody
iterates — the latter needing human sign-off if it inverts the PINNED row at
`intercept/tests/create-intercept-stream.test.ts:118` (`DEV.md:1490` § Pinned
expectations, `:1499`). The other five: how faithful the naming must be
(reproduce the reference's exported names and result vocabulary, or keep the
port's `ended`/`reason` spelling inside the handle shape); whether `run` regains
a caller-supplied `io` option; scope beyond run + intercept (`trace/` is the
largest thing never ported in the region and has never been audited, `adapter/`
likewise); what happens to the existing unpushed Phase-1 work; and whether
entwining is restored wholesale from `link/` or re-derived against embody's
Facts — noting embody parses with `ranges: true`
(`src/lib/study-lenses/embody/derive-ast.ts:59`) and no `locations`, so its
indices are offset-keyed while the port's events carry line/column.

**The deliverable that must not be skipped again is the loss ledger**: every
reference public-API member classified `restore` / `supersede (with rationale)`
/ `drop (with human sign-off)`. Its absence is the root cause of this entire
entry.

---

## Human rulings — HR-4..HR-15 (2026-08-05/06, planning session, ratified at plan approval)

Given by the human across three `AskUserQuestion` rounds, the plan-approval
round, and one mid-execution directive. Plan of record:
`~/.claude/plans/read-and-execute-the-rosy-sky.md` (ExitPlanMode-approved;
context-free-validated, verdict COULD START, must-fix applied). Canonical HERE;
the plan mirrors them. Campaign AR-5 baseline:
`1b516bd4e20df34c3573dcd08eabb9abe919cc74`
`[measured: git rev-parse HEAD at the first post-approval write]` — the review
changeset is the campaign's own SHA list, never `baseline..HEAD`. Research
evidence: `research-digests-2026-08-05.json` beside this log (byte-identical
copy of the 7-agent planning research `[measured: cmp — identical]`).

- **HR-4 — fidelity-first.** The task is to port the REFERENCE signature and
  behavior (`src/lib/embody/lib/evaluating/`). A port-side deviation survives
  ONLY where demonstrably stronger, each named explicitly in the loss ledger.
  Ledger default = `restore`; every `supersede` carries its strength argument;
  `drop` only with human sign-off. (Human wording: "the task was to port the
  reference signature and behavior … the handoff should say which aspects of the
  engine and signature are stronger, anything else should be ported over.")
- **HR-5 — intercept widens to the full generator surface** —
  `.next`/`.return`/`.throw` plus `{ fail, code, options, ast }` per reference
  `intercept/types.ts:261`. Where the reference's own semantics were accidental
  or engine-incompatible (`.throw` was the NATIVE generator method — only
  next/return were overridden; verbatim `.return()` would deadlock on a
  suspended ask), the plan § 4 specifies them and the ledger records each delta.
- **HR-6 — both consumption modes.** `for await` step-through AND `await handle`
  → the complete result. PROPOSED port-stronger carve-out, ratify at gate G1:
  [RATIFIED 2026-08-06 — § Ledger ratification below; G1 keeps only its
  design-review role] creation stays inert — the run starts at first consumption
  (first pull OR first await), never at construction. (The reference
  queueMicrotask-auto-started at creation, `create-execution.ts:107-117`; the
  carve-out also kills its one-microtask claim race.)
- **HR-7 — drain-on-await cancel policy.** An intercept ask nobody answers
  CANCELS the run at that ask (settles with the events so far). "Unanswered" is
  STRUCTURAL — no mock supplied for that verb — never temporal. Mocks (HR-9)
  answer first when supplied.
- **HR-8 — reference names and values wholesale.** `Execution`, `RunHandle`,
  `RunResult`, `InterceptHandle`, `InterceptResult`,
  `outcome: 'complete'|'cancel'|'fail'|'timeout'|'iteration-limit'|'error'`,
  `ok`, result fields (`events`, `code`, `options`, `ast`, `visitCounts`),
  reference event-field spellings. Port enrichments ride as ADDITIONS:
  machinery-defect discrimination as an added error kind, `loc` + offset pair on
  events, the pending-interaction arm, the `trip` record.
- **HR-9 — io mocks on BOTH evaluators.** run: worker dialog traps over the
  engine `onCall` seam; mock answers; no mock → classified io-error outcome
  (supersedes today's bare `ReferenceError`; the reference's native
  main-thread-dialog fallback is a `supersede` ledger row carrying the D5b
  rescission history). intercept: mocks answer at the `serveAsk` seam BEFORE a
  pending-interaction is minted; no mock → pending-interaction (named
  port-stronger carve-out); `io.console` per-method callbacks return.
- **HR-10 — scope.** run + intercept rebuild + the trace/variables port in this
  campaign; variables gets its own fidelity audit BEFORE its Phase 0, staged
  strictly later so it cannot block run/intercept. trace/semantics,
  trace/syntax, adapter/: future campaigns. The kind is designed against the 14
  tracer forward-compat requirements (research digests, key `tracers`).
- **HR-11 — build forward; deprecate and rebuild in new directories.** New
  commits only, no reverts; the current port evaluators are marked DEPRECATED
  and the rebuild happens in new directories, with the quarry AND the current
  port as references.
- **HR-12 — entwining re-derived against the CURRENT
  `src/lib/study-lenses/embody/`** (the reference's event signatures and
  entwining predate it and are stale — human PS). Events gain an offset pair
  stamped from the wrap's original-text parse; enrichment happens thread-side
  inside `onMessage` before the engine's shallow freeze-at-yield; the result
  carries `eventsByNode` + `visitCounts`; `link/`'s shadow tree is NOT ported.
  Mechanism (ratify at G1) [RATIFIED 2026-08-06 — § Ledger ratification below]:
  enumerable event fields are plain data (`step`, `loc`, offsets, `nodePath`);
  `node`/`prev`/`next`/`callee` are NON-ENUMERABLE ACCESSORS resolving through
  `facts.entwined.byPath` — the quarry's own newer precedent
  (`trace/semantics/tracing/types.ts:836-843`), keeping events/results JSON-safe
  while `event.node` still answers with the real EntwinedNode. The
  mutable-pointer accessor is a NAMED exception to the no-mutable-closures rule,
  scoped: installed inside `onMessage` before return, never written after yield.
  [CITATION CORRECTED 2026-08-06 after a measured staleness audit: the accessor
  precedent at :836-843 covers `prev`/`next` ONLY — the quarry's newer tracer
  explicitly DECLINES a `.node` reference (:845-849, "There is no `.node`
  reference — attribute via `event.nodePath`"). The `.node`/`.callee` accessors
  therefore EXTEND the precedent rather than follow it; their warrant is HR-4
  fidelity (the reference had `.node`) plus the mechanism answering the quarry's
  two stated reasons for declining (non-enumerable → JSON-safe; resolving the
  REAL entwined graph → no shadow identity). P0-K/P0-I's ar-1 must challenge
  this extension on exactly those terms.]
- **HR-13 — `ceremony: full`** for the whole campaign (set at plan approval):
  AR-1 · AR-2 · AR-3 (every un-skip) · AR-4 (every increment) · AR-5. Uniform
  within the level.
- **HR-14 — directories, Option A** (set at plan approval):
  `git mv src/lib/study-lenses/evaluators src/lib/study-lenses/evaluators-deprecated`
  (single-dash, kebab-legal), rebuild `evaluators/` fresh under the canonical
  name. Stale-doc references re-derived and fixed at execution
  (`git grep -n 'evaluators/' -- '*.md'` clean is the W0.3 doc gate); coordinate
  the move with the human's in-flight `.ls-lint.yml` session first. The
  deprecated region stays in tsc + vitest, frozen (compile-and-green only); its
  exit condition is danger's future migration-onto-the-new-kind campaign.
- **HR-15 — sandbox cadence and sandbox fidelity** (mid-execution directive,
  2026-08-06): "stop regularly for sandbox checks so I can know all features are
  migrated and supported" — sandbox pages are built EARLY in each evaluator
  chain and extended per increment, so every user-observable increment fires its
  own 🔍 checkpoint rather than one end-of-chain check; the declared 🔍 skip for
  variables is OVERRIDDEN — it gets a sandbox page and checkpoints too. And:
  "the sandboxes in the deprecated codebase were carefully crafted, migrate them
  too with the same attention to fidelity" — the DEPRECATED PORT's sandbox pages
  are fidelity targets alongside the reference's: the ledger's sandbox section
  inventories BOTH lineages' page features (reference: IO toggles, styled
  dialogs, slow-mock cancel rig, console dumps, presets; deprecated port: the C2
  card flows, the full-data serializer rendering present-but-`undefined` and
  live `respond`, per-arm presets) and the rebuilt pages carry the union, member
  by member.

### HR-3 consequence 2 — SUPERSEDED in mechanism

HR-3 recorded "danger gets touched: update it to compile with its tests green".
Under HR-11/HR-14 the old kind `types.ts` is never edited — it rides into
`evaluators-deprecated/` untouched — so danger keeps compiling with ZERO edits
(verified: zero importers outside the region, no engine imports, inside tsc +
vitest). The obligation is discharged by the old kind's immutability, not by
performing an edit. danger is thereby stranded on a deprecated kind; its
migration onto the new kind is a named FUTURE campaign (with trace/semantics,
trace/syntax, adapter/).

### Per-pin disposition table (all 27 PINNED rows in the two rewrite-target files)

New-directory builds never trip the pinned-guard on these pins, so this table is
the record that prevents re-litigation. Inventory
`[measured: grep -n "// PINNED" over create-run-stream.test.ts (9 rows) and create-intercept-stream.test.ts (18 rows)]`.
Disposition vocabulary (closed): **retained** — the behavior carries into the
new region and the pin's authority travels with it; **re-scoped(HR-6)** — true
of the iteration path once the await path exists; **superseded(HR-n)** — the new
region deliberately contradicts it. No pin fell outside the vocabulary; nothing
bubbled.

| file:line     | pinned claim (short)                                                     | disposition         | authority                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| run:103       | nothing engine-side before the first pull; result access starts a run    | retained            | HR-6 keeps it — await counts as consumption, not an earlier start                                                                                                 |
| run:140       | teardown answers OUT OF BAND, never via generator return queueing        | retained            | carried into the new handle design (plan § 4 .return() sequencing)                                                                                                |
| run:154       | a pull after teardown never starts a fresh run                           | retained            | —                                                                                                                                                                 |
| run:208       | guard increments before comparing; cap N trips at N+1                    | retained            | iteration-guard transports byte-identical                                                                                                                         |
| run:217       | guards splice on the ORIGINAL source; trip span faithful                 | retained            | HR-12 relies on it                                                                                                                                                |
| run:235       | iterations rides through unchanged (no clamp/default/gate)               | retained            | —                                                                                                                                                                 |
| run:272       | engine refinement hook unused; halt authored at the raw throw            | retained            | —                                                                                                                                                                 |
| run:289       | R-2: no machine ran → no machinery cause is honest                       | retained            | defect taxonomy rides as an HR-8 ADDITION                                                                                                                         |
| run:300       | H-7 restart guard: handle-only guard misses the defect route             | retained            | H-7                                                                                                                                                               |
| intercept:118 | nothing engine-side before the first pull                                | retained            | HR-6, as run:103                                                                                                                                                  |
| intercept:173 | both sources join ONE arrival queue in worker post order                 | retained            | carried into I6                                                                                                                                                   |
| intercept:200 | the wrap stamps the innermost call site, end to end                      | retained            | —                                                                                                                                                                 |
| intercept:208 | statement-level throw outside any wrap → loc null; NO stack parse        | superseded          | **superseded(ledger ratification 2026-08-06)** — enclosing-fallback attribution restored AST-side via `entwined.byOffset` at halt time; still NEVER a stack parse |
| intercept:250 | the fake rejects an async round-trip (property of the double)            | retained            | engine + fake untouched                                                                                                                                           |
| intercept:265 | a pull after teardown never starts a fresh run                           | retained            | —                                                                                                                                                                 |
| intercept:292 | teardown out of band, never through the engine's stream exit             | retained            | plan § 4 .return() builds ON it                                                                                                                                   |
| intercept:309 | teardown LATCHES; a later pull is inert                                  | retained            | aligns with HR-2                                                                                                                                                  |
| intercept:337 | the stream must be pulled for every event; one pull starts, not finishes | **re-scoped(HR-6)** | true of the ITERATION path; the await path drains without consumer pulls                                                                                          |
| intercept:356 | guards splice FIRST on the original text                                 | retained            | —                                                                                                                                                                 |
| intercept:361 | splice order not interchangeable (columns shift)                         | retained            | —                                                                                                                                                                 |
| intercept:394 | iterations rides through unchanged                                       | retained            | —                                                                                                                                                                 |
| intercept:443 | R-2 inherited                                                            | retained            | —                                                                                                                                                                 |
| intercept:456 | assemble-defect settlement frozen outside the mapper                     | retained            | —                                                                                                                                                                 |
| intercept:465 | H-7 restart guard, both modules                                          | retained            | H-7                                                                                                                                                               |
| intercept:480 | an outstanding pull completes as the stream's end, any route             | retained            | —                                                                                                                                                                 |
| intercept:495 | H-2: yield charge named; loop safety rests on iterations                 | retained            | W1.a's D4 opt-out is the narrow fix H-2 itself anticipated, not a contradiction                                                                                   |
| intercept:504 | H-2: flat charge arithmetic; floor of 500 meaningful                     | retained            | same note                                                                                                                                                         |

### Routing

HR-5, HR-7, HR-12, HR-15 (intercept-relevant halves) are mirrored into
[`../evaluators-intercept/AR-LOG.md`](../evaluators-intercept/AR-LOG.md); HR-9
into both evaluator logs (the H-7 mirror-note precedent). Everything else is
region-wide and canonical here alone.

---

## Ledger ratification — 2026-08-06, one pass (human)

The LOSS-LEDGER's one-pass ratification, given via two `AskUserQuestion` rounds
in the planning session. Every row now carries its ruling or sign-off date in
the ledger itself; this entry is the ruling record.

- **Bulk** — every PROPOSED row confirmed as written, including the drop rows'
  sign-off AND the two G1-earmarked mechanisms (HR-6's creation-inert carve-out;
  HR-12's non-enumerable-accessor enrichment). **G1's ratification list is now
  EMPTY** — G1 remains as the Phase-0 design review gate only.
- **Error `line`** — restore on intercept (already wrap-style, richer than the
  reference); DEFERRED on run — run-side call-site instrumentation is a named
  future increment, not this campaign's. Never a stack parse.
- **`phase` / E2** — IN SCOPE: the engine's one try/catch splits and the worker
  stop record gains the creation/execution discriminant. Additive; its own AR
  pair; serialized after W1.a in the engine.
- **Clean-arm `iterationCount`** — ADDED (reference-plus, rides the results, not
  the settlement floor).
- **In-stream `ErrorEvent`** — RESTORED: intercept's event union gains an error
  arm (step + loc); the settlement keeps the structured form.
- **Enclosing-fallback** — RESTORED, AST-side via `entwined.byOffset` at stop
  time; supersedes pin intercept:208 (disposition table updated).
- **Gate arms (rejections + formatting)** — resolved by the CURRENT
  architecture, verified this session, correcting the agent's lens-owns-it
  proposal: level marking is the ORCHESTRATOR's (live-wired: screening +
  language-levels validate + orchestrate marking) and embody is level-blind by
  contract
  `[read: embody/DOCS.md:101-105 — "a language level decides what is ALLOWED"]`;
  formatting is level-shipped editor-support DATA
  (`[read: language-levels/README.md:46-48 — "completion, hover documentation, format options"]`)
  consumed by the orchestrator's editor adapter
  (`[read: orchestrate/README.md:113]`). The assignments were already recorded
  in the regions' own docs — no new doc line owed; nothing returns to
  evaluators.
- **`.fail` on run** — NOT added: the reference asymmetry is kept (fail is the
  mid-stream consumer stop; run yields nothing, cancel covers its one stop; fail
  rides intercept + the tracers).

Plan-impact deltas (folded into the campaign): E2 joins the engine chain after
W1.a; P0-I's spec gains the ErrorEvent arm and the enclosing-fallback lookup;
the results gain the clean-arm count; run's line deferral is a named non-goal
this campaign.
