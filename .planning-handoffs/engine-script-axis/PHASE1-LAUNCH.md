# PHASE 1 LAUNCH — the `'script'` axis builds on its approved contract

The build handoff for the axis's Phase 1, written 2026-09-02 by the session that
ran the Fable review HR-27 owed. Repo:
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`

> **The owed Fable review RAN and Phase 0 is fully discharged.** Verdict: Phase
> 1 may start on the contract as it stands — no contract defect found; every
> measured claim in the Phase-0 artifacts reproduced. Its findings were ruled on
> by the human and executed at `4caba21c` (the flip-constraint header and the
> BRIEF § 12 corrections), `b6ac51c5` (the settlement-mapper handoff, a SEPARATE
> unit — not yours), and `f6ebb449` (governance, unrelated to you). Nothing
> about Phase 0 remains open.

## 0. Orient — read these first, in this order

1. Repo-root `CLAUDE.md` router → your governance file. Then
   `DEV.md § Shared-worktree git mechanics` — pathspec commits, never
   `git add -A`; the tree is shared and busy.
2. The contract you build against, end to end:
   `src/lib/study-lenses/lib/engine/` — `README.md` (§ The creation gate, §
   Public API), `types.ts`, `DOCS.md` (§ Execution phases, § Structural
   constraints), `notional-machine.md`, `worker/README.md`, `worker/DOCS.md`,
   `worker/types.ts`.
3. `.planning-handoffs/engine-script-axis/BRIEF.md` — **`## 11` before the
   body** (it supersedes the body), then **`## 12`**, which is your obligation
   list: every deferral there names the step that owes it, and several are owed
   by YOUR increments.
4. Rulings of record — cite, never re-litigate:
   `git grep -n "HR-23\|HR-24\|HR-25\|HR-26\|HR-27" -- .planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`.
5. The banked suite you will un-skip: `tests/evaluate.test.ts` (19 gate rows),
   `tests/fake-transport.test.ts` (6), and
   `tests/conformance/transport/script-execution.browser.test.ts` (17 + 1 live)
   — **read its header comment first; it now carries the flip constraint.**

HEAD will have moved since this was written; the campaign SHA ledger and the
engine's own history are what matter, not any HEAD pin.

## 1. What still gates you — two things, neither optional

- **Prerequisite 2, the classic-worker test tier, gates the script-running half
  of Phase 1** — the 13 script rows (increment 4, and the flip in increment 6):
  no classic worker, no red test for those (HR-27 — its ledger text states the
  gate without a per-increment scope; the scope here is this handoff's, derived
  from which rows need the tier). Its launch brief is § B of the resumption file
  `~/.claude/plans/claude-plans-read-the-repo-root-claude-peaceful-possum.md`
  (outside the repo — if it is gone, the tier's settled shape is recorded in
  `BRIEF.md § 6` + `§ 11.7`: esbuild-IIFE the engine's own
  `testing/test-worker-entry.ts`, spawn it classic in the existing browser
  vitest project; acceptance = a spawned classic worker where `importScripts` is
  callable). The 25 stub-transport rows (19 + 6) do NOT wait on it — the gate
  sits above the transport seam.
- **Prerequisite 1's Phase 1 — the worker built-ins latch, 27 skipped rows —
  must be GREEN before any axis code commits** (HR-23, restated at HR-24). Check
  its state on arrival:
  `grep -c "it.skip(" src/lib/study-lenses/lib/engine/tests/latched-built-ins*.test.ts`
  — sum the two printed counts; a non-zero sum means it has not run and the
  axis's code commits are blocked behind it. **As of 2026-09-02 the sum is 27:
  this gate is CLOSED, and it is the first wall you hit.** It has no dedicated
  launch brief — its spec IS its approved Phase 0 (`8621bfa5`, `0547a734`,
  approved at HR-24): the committed skipped suite, `worker/README.md § Realms`
  (the rule and per-module capture sets), and `worker/DOCS.md § Latching`
  (capture order, what counts as compliant). Whether this session executes it
  first or the human launches it separately is the **human's sequencing call at
  launch** — it is independent of prerequisite 2 and can run before or alongside
  it. Model note for the human: it is mechanical TDD against a pinned, committed
  row set — Opus 5, or Sonnet 5 workers under an Opus orchestrator, with the
  ar-5 inheritance caveat from § 5.

## 2. The build, increment by increment (ZOMBIES order within each cluster)

Un-skip cadence: **batch-per-cluster AR-3** is RATIFIED (ledger, human ruling
2026-08-26) — one `ar-3` over a cluster's complete enumerated row set before
implementing, a FRESH round whenever rows change. `ar-4` stays per increment.

1. **The creation gate, thread-side** — the 19 `evaluate.test.ts` rows plus the
   6 fake rows (stub transport; no tier dependency). Insertion point is ruled:
   `startRun`'s pre-start short-circuit, NOT `evaluate()` — laziness is contract
   (HR-23; `DOCS.md § Execution phases` item 2 is the landmark: the gate
   precedes every run resource). Acorn at `ecmaVersion: 'latest'`, both goals,
   abstain per HR-26 (catch a no-verdict parser failure; the gate never throws
   at its caller). The gate authors `EngineHalt` with acorn's verbatim position
   and stamps `haltOrigin` — `types.ts` is the single home of that literal.
   **The exact acorn pin `^8.16.0` → `8.16.0` rides your FIRST gate commit**
   (HR-24: shared `package.json` config, human approval, in the same commit as
   the first code that depends on it, suites measured not assumed).
2. **`SetupMessage.execution` reaches the worker** — the wire change HR-23
   ruled. ⚠ **THREE construction sites, not one** (BRIEF § 12, corrected
   2026-09-02): `worker/transport.ts`, plus the direct-drive harnesses in
   `tests/bootstrap.browser.test.ts` and
   `tests/latched-built-ins.browser.test.ts` — annotate and pass at all three,
   or a bootstrap reading `setup.execution` meets `undefined` from the two test
   harnesses and nothing complains.
3. **The capability probe at setup** — the 4 probe rows run on TODAY'S
   module-worker tier (two prove refusal, two prove the probe stays quiet).
   Cheapest browser increment; proves the axis reaches setup.
4. **The script path in `bootstrap.ts`** — the 13 script rows, gated on
   prerequisite 2. `importScripts` on a blob, revoke in `finally` (same-turn:
   `worker/DOCS.md § Capture order`'s amended enumeration), the documented
   `postMessage`-style cast for `importScripts` (tsconfig serves DOM types —
   precedent and comment discipline at `bootstrap.ts`'s file header). ⚠ **THE
   FLIP ORDER**: before repointing `scriptRun` at the classic tier, give the two
   refusing probe rows their own module-worker helper or `workerFactory`
   override — the suite header and BRIEF § 12's pin bullet both carry this now;
   the override wins because `scriptRun` spreads `...overrides` last.
5. **The shared default-halt-payload author extracted into `worker/`** (BRIEF §
   12; placement ruled in the ENGINE-ROOT
   `DOCS.md § One author for the engine's own payload`) — ⚠ it costs THREE edits
   into prerequisite 1's committed suite, and that same DOCS section both
   enumerates them and carries the extraction's second-lander inheritance
   clause. (The separate `importScripts` capture-row inheritance — increment 6's
   concern — is the one recorded at `worker/README.md § Discharges`, last
   block.)
6. **Close** — `worker/README.md § Realms` capture table already lists
   `importScripts`; the latch row that pins it as an exact array must agree. **A
   built-bundle run, performed manually at least once, is a named gate at the
   Phase-1 close** (BRIEF § 12, last bullet) — its observed output rides that
   commit's body under `[measured:]`.

## 3. Review carry-forwards from the Fable review (name them in your ARs)

- The two "parser cannot reach a verdict" rows (`evaluate.test.ts` ~:581,
  `fake-transport.test.ts` ~:303) cannot distinguish "abstained" from "parsed" —
  green either way if a future runtime parses 60k nested parens. Today they DO
  exercise abstention [measured 2026-09-02: acorn 8.16.0 under node v20 and v22
  → `RangeError`, `loc undefined`]. Say so in that cluster's `ar-3` rather than
  redesigning.
- The contract is silent on `allowHashBang`; at `'latest'` a hashbang parses
  without it [measured: acorn 8.16.0]. The banked hashbang row is the tripwire
  once live. Passing the flag anyway is harmless; changing `ecmaVersion` is not
  yours to do.
- Every acorn expectation in the banked rows was re-measured 2026-09-02 and
  matches (`let x = ;` → `{line:1, column:8}`; `return`/`new.target` refused at
  the script goal; `let NaN` parses; top-level await parses at the module goal).

## 4. Governance for the receiving session

- The axis unit is INSIDE the evaluators-api-restoration campaign: **ceremony:
  full (HR-13), cited — never restated as your own choice.** Settings line
  precedent: the `4185f9d0`/`b0525f13` bodies.
- Engine standing twin-doc: `machine` — amendments to `notional-machine.md` ride
  the increments that change machine behavior.
- `evaluators/` stays CLOSED to you: `ExecutionAxis` at `evaluators/types.ts:81`
  keeps its tsc tripwire; the widening is a later, separate unit. The
  settlement-mapper unit (`b6ac51c5`'s handoff) is also separate — do not absorb
  it.
- Commit ledger discipline: campaign SHA list, never `baseline..HEAD`; every
  commit announced; push is the human's.
- Baselines to expect [measured 2026-09-02 — re-measure on arrival]: engine
  suites unit **171 passed / 33 skipped**, browser **89 passed / 36 skipped**,
  zero Errors (grep all three summary lines); `npx tsc --noEmit` → 13 errors,
  all foreign (aithor + local-llm); markdownlint FROM THE REPO ROOT with
  `--no-globs`; `cspell` retired, absence is not breakage.

## 5. Model guidance (for the human launching this)

- **Prerequisite 2** (shared-config decisions, infrastructure with no red-green
  cycle, runs in the orchestrator): **Fable 5 or Opus 5**. It makes one or two
  shared-configuration calls (`vitest.workspace.ts` vs a committed artifact)
  that the human gates; judgment matters more than volume.
- **Axis Phase 1** (implementation against a locked, reviewed contract): **Opus
  5 as the orchestrator is the right default.** Fable 5 is justified for
  increment 1 (the gate) if you want maximum care at the one increment with
  novel semantics (abstain handling); increments 2–4 are contract-transcription.
  Workers under fan-out may ride Sonnet 5 for mechanical clusters — but note the
  inheritance: **`ar-5` (and `ar-2`, if a contract change ever triggers one)
  carry no model pin and inherit the session's tier**
  (`DEV.md § Sub-model dispatch`), so whichever tier runs the closing session is
  the tier that pre-merge-reviews the whole axis. If Phase 1 runs on
  Opus/Sonnet, consider returning to Fable 5 for the closing AR-5 + built-bundle
  gate session.
- `ar-3`/`ar-4` carry their own frontmatter pins — never pass a `model`
  parameter when spawning ARs.
