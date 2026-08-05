# evaluators — public-API restoration: AR-LOG

Region-level log for work that spans `evaluators/run` and `evaluators/intercept`
together. Opened 2026-08-05 after two fidelity audits established that the
greenfield port of the evaluating region delivered a substantially poorer public
surface than the implementation it replaced.

The per-evaluator logs stay where they are
(`.planning-handoffs/evaluators-{run,intercept}/AR-LOG.md`); this file exists
because the findings and the human's rulings are region-wide and have no home in
either.

Cold-start brief for the next agent:
`~/.claude/plans/cold-start-evaluator-api-re-enrichment.md` (validated by a
context-free agent, which found twelve errors; all corrected before handoff).

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
reported as carrying 11 fields; it **adds eight** on top of the base event
`[measured: grep -c "readonly " over link/types.ts:144-176]`.

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
— against the port's `step` + `loc`. `intercept/DOCS.md:26` names the
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
    sign-off; neither reading follows from "use a handle".
  - Eager-versus-deferred is a per-evaluator choice, not a global one — the
    reference made it both ways (`run/types.ts:203` synchronous,
    `intercept/types.ts:315` a Promise). Choose per evaluator against its own
    laziness posture; the port's "nothing runs before the first pull" rows are
    not automatically invalidated.

---

## Open — for the next agent, before any planning

Carried in the cold-start brief § 6. With HR-1…HR-3 settled, five remain: how
faithful the naming must be (reproduce the reference's exported names and result
vocabulary, or keep the port's `ended`/`reason` spelling inside the handle
shape); whether `run` regains a caller-supplied `io` option; scope beyond run +
intercept (`trace/` is the largest thing never ported in the region and has
never been audited, `adapter/` likewise); what happens to the existing unpushed
Phase-1 work; and whether entwining is restored wholesale from `link/` or
re-derived against embody's Facts — noting embody parses with `ranges: true`
(`src/lib/study-lenses/embody/derive-ast.ts:59`) and no `locations`, so its
indices are offset-keyed while the port's events carry line/column.

**The deliverable that must not be skipped again is the loss ledger**: every
reference public-API member classified `restore` / `supersede (with rationale)`
/ `drop (with human sign-off)`. Its absence is the root cause of this entire
entry.
