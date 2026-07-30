<!-- TRANSITIONAL — delete when the evaluators-run campaign completes. -->

# evaluators/run campaign — ruling log

Human rulings and AR resolutions for ceremony 2 of the evaluators sprint: the
`run` evaluator, the baseline engine-backed member of the evaluator kind.

Phase 0 is committed and ratified — `[measured: git log --oneline -1 6256571c]`
`docs: establish run evaluator domain model and sketch`. Plan of record:
`~/.claude/plans/read-and-execute-the-eager-crystal.md`; campaign ledger:
`~/.claude/plans/read-0-curricula-dev-md-and-0-curricula-abundant-wand.md`.
Recorded here because a ruling that lives only in a plan file does not exist —
`git grep` cannot see it
([DEV.md § Ruling provenance](../../DEV.md#ruling-provenance)).

The four gate rulings of 2026-07-28 — D8-as-widened, D1-as-refined, the
total-precedence error shapes, and the clean-arm floor — are expressed by the
committed [run/README.md](../../src/lib/study-lenses/evaluators/run/README.md),
[run/DOCS.md](../../src/lib/study-lenses/evaluators/run/DOCS.md), and
[run/types.ts](../../src/lib/study-lenses/evaluators/run/types.ts). They are not
restated here; this log carries what those artifacts do not already say.

## Human rulings — 2026-07-30 (Phase-1 plan approval)

- **R-1 — R1 covers the positive trip→halt path with a capture helper.** The
  halt author's structural classification has a directly testable negative (a
  learner `RangeError` carrying the guard's exact message classifies as no
  trip), but the positive — a real marked throw producing a halt whose `trip`
  rides whole — needs the thrown value captured, and
  ``[read: DEV.md § Error Testing — "Always use `.toThrow()`. Never use try-catch in tests."]``.
  Ruled: take the deviation openly, via a hoisted in-file capture helper, on the
  grounds that the ban targets assertion style rather than fixture construction
  and that `trip` is the one `RunHalt` field with no other authoring-site
  coverage. The alternative considered and rejected was deferring the positive
  to R4, where a halt author that calls the classification verb and then
  discards its answer would pass all of R1. The deviation is disclosed to `ar-3`
  in R1's brief.

- **R-2 — the assemble-time dev condition settles `'unreachable-outcome'`, and
  its doc comment is widened.**
  `[read: run/DOCS.md § Execution phases, phase 2 — "An upstream dev condition here … settles the defect arm"]`
  names the arm but no cause, and
  ``[read: run/types.ts — the `RunDefectCause` doc comment]`` scopes
  `'unreachable-outcome'` to settlement combinations alone ("an outcome run's
  surface cannot produce, a completed settlement missing its halt, a malformed
  halt payload"). Ruled: use `'unreachable-outcome'`, and widen that
  parenthetical to include the assemble route. None of the three machinery
  causes is honest when no machine ran — claiming `'worker-error'` would assert
  a crash that never happened, against
  `[read: run/types.ts — "both the machine's words, different machines"]`. This
  is the one sanctioned `run/types.ts` edit of Phase 1; every other Phase-0
  artifact stays byte-untouched.

- **R-3 — the increment table is amended: `worker-entry.ts` lands with R4.** The
  ratified table folds R2 into R5. But R4's stream factory must author the one
  syntactically adjacent
  `new Worker(new URL('./worker-entry.ts', import.meta.url), { type: 'module' })`
  expression, so the literal reading would put a URL pointing at a nonexistent
  file on `main` for one commit — `tsc` never resolves a URL string, so it would
  land green carrying a broken reference. The table's R2 line says "no dedicated
  unit file" and "browser-evidenced"; both are claims about **evidence**,
  neither about which commit carries the file. Ruled: the three-line entry lands
  in R4's commit as its own factory's URL target, not as a second behavior;
  browser evidence stays at R5, where every green row is the entry booting.

- **R-4 — the increment table is amended: R6 commits `sandbox.html` only.** The
  table lists "+ vite config" for R6. But
  `[read: src/lib/study-lenses/lib/engine/vite.sandbox.config.ts, @file — "this config is for standalone dev pages, which arrive with the evaluators wiring work"]`
  names run's sandbox as its intended consumer in advance, and it already sets
  `root: 'src/lib/study-lenses'` (so `evaluators/run/sandbox.html` is a
  subpath), the `@utils` alias, and both COOP/COEP headers. A run-local twin
  would be byte-identical but for its usage comment. Ruled: reuse the engine's
  config; the launch command rides an HTML comment at the top of the page rather
  than a `run/DOCS.md` edit, since
  `[read: run/DOCS.md § Out of scope — "The sandbox page — permanent dev infrastructure beside the module, not part of its contract"]`.

- **R-5 — D1's no-engine-internal-import rule is scoped to run's thread-side
  modules.** The gate ruling reads "no engine-internal (`worker/`) type or
  import anywhere in run". A worker entry cannot exist under that reading:
  `[read: src/lib/study-lenses/lib/engine/README.md § Glossary]` defines a
  worker entry as "the thin per-consumer worker file wiring the engine's
  **bootstrap** to that consumer's worker logic", and
  `[read: src/lib/study-lenses/lib/engine/testing/test-worker-entry.ts]` — the
  engine's own — imports `../worker/bootstrap.js` and calls it at module load.
  Ruled as a scoping refinement, not a re-litigation: D1 governs run's
  **thread-side** modules, where the seam it protects actually lives;
  `worker-entry.ts` imports the bootstrap. The lint boundary permits it
  independently —
  `[measured: grep -n STUDY_LENSES_SUBSYSTEMS eslint.config.mjs]` the
  `import/no-restricted-paths` subsystem list does not include top-level `lib/`,
  which is shared-leaf by design.

## Session baselines — measured 2026-07-30, at HEAD `8d123a8d`

Recorded so a later reader can tell foreign debt from this campaign's own.

- `[measured: npx tsc --noEmit]` **0 errors repo-wide.** Both formerly-durable
  quarry errors are fixed; treat any error as foreign-volatile or this
  campaign's, never "the known baseline".
- `[measured: ./node_modules/.bin/vitest run --project unit src/lib/study-lenses/evaluators src/lib/study-lenses/lib/engine src/lib/study-lenses/lib/loop-guard]`
  22 files / 326 tests green.
- `[measured: ./node_modules/.bin/vitest run --project browser src/lib/study-lenses/lib/engine src/lib/study-lenses/evaluators]`
  9 files / 126 tests green.
- `[measured: git log --oneline 3da375e9..HEAD -- <the run tree, iteration-guard, lib/engine, lib/loop-guard, evaluators/types.ts, evaluators/danger>]`
  empty — every consumed contract is untouched since Phase 0 closed.
- The worktree carries a concurrent stream's uncommitted work throughout, so
  every commit uses explicit pathspecs on both `git add` and `git commit`
  ([DEV.md § Shared-worktree git mechanics](../../DEV.md#shared-worktree-git-mechanics)).

## AR resolutions

None yet — `ar-3` fires after each increment's first failing test and `ar-4`
after each self-review. AR-5 does **not** fire in this ceremony; it waits for
the sprint's Phase 2, after ceremony 3.
