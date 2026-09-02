# HANDOFF — settlement mappers must read `haltOrigin` before shape-narrowing

One unit, for a fresh session. Repo:
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`

> Written 2026-09-02 at HEAD `4caba21c` by the session that ran the Fable review
> HR-27 owed over the `'script'` axis's Phase 0. The human ruled
> `[relayed: AskUserQuestion answer, 2026-09-02 — "create a handoff for another session to update the existing evaluators"]`.
> Every number below was measured in that session; every one carries its re-run
> command — **run the command, do not trust the number**, because the evaluators
> tree had LIVE peer work in it when this was written.

## 0. Orient — read these first, in this order

1. Repo-root `CLAUDE.md` router → `AGENTS.principal.md` (model ids `fable`,
   `opus-5`) or `AGENTS.md`. Read whichever matches you.
2. `DEV.md § Shared-worktree git mechanics` — this tree is SHARED and busy;
   pathspec commits only; never `git add -A`. Do not trust any older brief's
   "exclusively yours" phrasing.
3. `src/lib/study-lenses/lib/engine/types.ts` — the JSDoc on
   `EngineSettlement.haltOrigin`, on `EngineHalt`, AND on `HaltPhase` (which
   carries HR-26's abstain rule and the three named residuals § 2 leans on; the
   whole contract this unit consumes, ~90 lines).
4. `src/lib/study-lenses/evaluators/run/map-settlement.ts` — end to end (~260
   lines).
5. Rulings of record:
   `git grep -n "HR-25\|HR-26" -- .planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`.
   Cite, never re-litigate.

HEAD will have moved since this was written (it moved twice during the handoff's
own validation) — the mapper's history, not the HEAD pin, is what matters;
re-measure rather than stopping on the mismatch.

## 1. The defect, mechanically

The engine's settlement gained two things (HR-25, HR-26; encoded at
`lib/engine/types.ts` and committed at `b0525f13`):

- `haltOrigin?: 'worker' | 'engine'` — present exactly when `halt` is; says
  which SIDE authored the payload. `'engine'` means the creation gate refused
  the program on the thread and **the consumer's `serializeHalt` never ran**.
- `EngineHalt` — the engine's own payload shape,
  `{ name, message, phase?, line?, column? }`, exported, what `halt` IS whenever
  `haltOrigin` is `'engine'`.

The gate itself is NOT implemented yet — it lands with the `'script'` axis's
Phase 1, and it parses **both** the module goal and the script goal. The
`'module'` path is live in evaluators today, so when Phase 1 lands,
engine-origin halts become reachable through the existing evaluators with **no
code change on their side**.

`evaluators/run/map-settlement.ts` predates the field and never reads it
`[measured: git grep -c "haltOrigin" -- src/lib/study-lenses/evaluators/ → zero hits]`.
Its one narrowing site, `narrowHalt` (line ~221), destructures
`{ natural, errorName, message, trip, iterationCount, phase }` and requires
`natural: boolean` and `iterationCount: number`. An `EngineHalt` has none of
those, so it fails narrowing → `null` → falls through the mapper's steps 2–4 →
step 5, `unreachableOutcome`: a `console.warn` saying "This is a machinery
defect, not a learner error" and a result arm
`{ kind: 'defect', cause: 'unreachable-outcome' }`
`[read: run/map-settlement.ts:190-208, 221-241 — re-read; lines drift under live peer work]`.

## 2. Why the wrong arm is ALMOST right — the nuance that shapes the fix

Through `run`, a learner's unparseable program never reaches the engine:
`mapSettlement`'s `ast` parameter is "the facts' parsed root, gate-guaranteed"
`[read: run/map-settlement.ts JSDoc @param ast]` — the kind's own contract
requires parsed facts, and the engine receives the INSTRUMENTED source. So an
engine-origin halt arriving through `run` is genuinely an **instrumentation
defect** (the splice broke the code), and § 7.13 of
`.planning-handoffs/engine-script-axis/BRIEF.md` says exactly that: such a
failure "is an instrumentation defect, not a learner error."

So the DEFECT ARM is the right destination for `run` — but it must be **chosen
by a `haltOrigin` read, deliberately, with an honest cause and message**, never
reached by narrowing fallthrough. Today's message ("run received an engine
settlement it cannot map") is false — the `EngineHalt` is well-formed and typed;
the mapper simply predates it. And the arm's name, "unreachable", becomes a lie
the day the gate lands. Two further engine facts bound the work:

- HR-26: the gate **abstains** when acorn fails without a verdict, so an
  abstained program's genuine syntax error still arrives worker-side as an
  ordinary `haltOrigin: 'worker'` halt with `phase: 'evaluation'` — the existing
  narrowing path, unchanged.
- The discrimination is structural, never payload-shape sniffing —
  `engine/DOCS.md § Structural constraints` forbids shape inspection by name,
  and `haltOrigin` exists precisely so no consumer needs it (HR-25).

## 3. The task, as behavior (not implementation)

For every settlement mapper whose kind can pose an execution path the gate
parses — today that means **`'module'`** (`'script'` stays unrequestable while
`ExecutionAxis` is closed). A mapper whose kind poses only `'function'` can
never receive an engine-origin halt (the gate does not run on that path — the
`HaltPhase` JSDoc in `engine/types.ts` is the authority), and a DOCUMENTED
deliberate non-consult is a valid answer there, not a gap. For each in-scope
mapper:

1. Read `settlement.haltOrigin` structurally BEFORE any shape-narrowing of
   `settlement.halt`.
2. Route `haltOrigin: 'engine'` to a deliberate arm chosen by that evaluator's
   own vocabulary — for `run`, a defect-class arm with an honest message naming
   what happened (the engine's creation gate refused the instrumented source;
   `EngineHalt.line`/`column` are available and 1-based/0-based per acorn's
   convention, pinned in `engine/types.ts`). Whether that is the existing defect
   arm with a new cause, or a new arm, is the unit's design call inside its own
   kind's contract.
3. Keep each mapper's narrowing single-sited; `'worker'`-origin halts keep the
   existing path byte-identical.
4. Red test first, per increment: a test handing the mapper a settlement with
   `haltOrigin: 'engine'` and an `EngineHalt` payload must fail against today's
   code before the change, and the ZOMBIES cluster around it follows house
   testing rules (`DEV.md § Testing Strategy`). The example settlement to test
   against — pinned so the red fires at the right step: `outcome: 'errored'`
   (the engine's banked row _'settles errored when the parser refuses a
   module-goal program'_ in `lib/engine/tests/evaluate.test.ts` pins it), `halt`
   an `EngineHalt` such as
   `{ name: 'SyntaxError', message: 'Unexpected token (1:8)', phase: 'creation', line: 1, column: 8 }`,
   `haltOrigin: 'engine'`, **no `error` field** (a gate refusal is not an
   engine-made termination — the `EngineError` cause enum has no gate value),
   plus `durationMs: 0`, and call the mapper with `ioFlag: null` (a non-null
   flag preempts at its io step, the same misfire species). A mistaken `error`
   field makes the red fire at the mapper's engine-error step, so the eventual
   green would come through that path instead of the new `haltOrigin` read — red
   for the wrong reason, then green for the wrong reason.

**Discovery sweep — do not trust this file's inventory**:

```bash
# plain grep, NOT git grep — untracked peer files (§ 4) are invisible to git grep
grep -rn "narrowHalt\|settlement\.halt\|haltOrigin" src/lib/study-lenses/evaluators
```

Adjudicate every hit; a mapper this file does not name may exist by the time you
run.

## 4. The peer hazard — measure before you plan

When this was written, a peer session was ACTIVELY working in the region
`[measured 2026-09-02: git status --short -- src/lib/study-lenses/evaluators/ → M intercept/types.ts, M run/tests/run.browser.test.ts, ?? intercept/map-settlement.ts, ?? intercept/tests/map-settlement.test.ts, ?? lib/guarded-worker-base/build-halt-author.ts, ?? lib/guarded-worker-base/read-cap.ts]`.
The untracked `intercept/map-settlement.ts` is a SECOND settlement mapper — and
its in-flight author has ALREADY adjudicated this question, the other way: its
file-doc says the engine-authored halt is unreachable under intercept's
`'function'` axis and `haltOrigin` is "deliberately not consulted"
`[read: the untracked file, 2026-09-02 — re-read whatever version exists when you arrive]`.
That ground is defensible under § 3's scope rule (the gate never runs on
`'function'`). On arrival:

- Re-measure: `git status --short -- src/lib/study-lenses/evaluators/` and
  `git log --oneline -5 -- src/lib/study-lenses/evaluators/`. Note `git grep`
  cannot see untracked files — use plain `grep -rn` when sweeping a region with
  peer work in flight.
- Whatever its landed/untracked state, intercept's documented non-consult STANDS
  unless intercept's kind gains a gate-parsed execution path — do not "fix" a
  peer's recorded design position. If intercept ever poses `'module'` or
  `'script'`, its mapper enters § 3's scope at that moment; say so to the human
  rather than editing.
- Never edit or stage a peer's dirty or untracked file, in any case.

## 5. Scope boundaries

- **Out of scope**: `lib/engine/` in its entirety (the contract is settled —
  HR-25/HR-26 — and the axis campaign owns its Phase 1);
  `evaluators-deprecated/` (frozen); any peer-dirty or peer-untracked file.
- `ExecutionAxis` at `evaluators/types.ts:81` stays CLOSED with its tsc tripwire
  armed — this unit is about halts arriving on the LIVE `'module'` path, not
  about requesting `'script'`.
- Timing: the change is safe to land BEFORE the engine's gate exists —
  `haltOrigin` is optional, absent on every settlement today, so the new arm is
  simply unreachable until Phase 1 lands. Landing first is the point: the mapper
  stops being a blocked dependency of the axis.

## 6. Governance for the receiving session

- Work routing: software work · **twin-doc: the subject module's standing
  value** — `run`'s is `machine` `[measured: git log body of c2f857e2]`, and
  intercept's is ALSO `machine` (its Phase-0 commit `e2a49291` and
  `intercept/notional-machine.md`, tracked — an earlier draft of this handoff
  said `none` and was wrong); cite, never re-ask outside Phase 0 (human ruling
  2026-08-13). This is a correction inside an existing contract, NOT a Phase-0
  unit — unless the mapper's PUBLIC shape changes (a new exported arm kind in
  `run/types.ts` may qualify): then stop and surface before proceeding.
- **Ceremony is the human's for that session. Do NOT inherit HR-13** — it names
  the evaluators-api-restoration campaign, and this unit is its own. Ask the
  human at launch; if no answer comes, ship `ceremony: unset` in the settings
  line — the honest greppable gap `DEV.md § Work routing and ceremony`
  prescribes (there is no agent-suppliable default for this axis).
- ARs: invoke `ar-3` after the first failing test and `ar-4` after
  implementation, per the declared level; `ar-5` before the close. Never
  self-skip.
- Baselines to expect [measured 2026-09-02, re-measure on arrival]:
  `npx tsc --noEmit` → 13 errors, all in `embody/.../aithor` and
  `lib/local-llm`, none in `evaluators/run/`; a new one is yours. `cspell` is
  retired; its absence is not breakage. markdownlint runs FROM THE REPO ROOT
  with `--no-globs` or it invents MD013 errors.

## 7. Model guidance (for the human launching this)

Implementation against a settled contract with one design decision (which arm,
what cause vocabulary): **Opus 5 is the right tier**. Sonnet 5 is defensible if
the run is scoped to `run`'s mapper alone with the arm shape pre-decided by the
human. Note the inheritance cost either way: `ar-2` (if a contract change
triggers it) and `ar-5` carry no model pin and inherit the session's tier —
launching on Sonnet means the pre-merge review runs on Sonnet too.
