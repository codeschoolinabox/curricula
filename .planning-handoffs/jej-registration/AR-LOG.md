<!-- TRANSITIONAL — delete when the jej-registration campaign completes. -->

# jej-registration campaign — ruling log

Human rulings and AR resolutions for the campaign that registers the JEJ
language level as the first built-in level, reconciles its reference curriculum
with the level's actual contract, and corrects the lens migration playbook.

Plan of record: `~/.claude/plans/handoff-jej-hazy-pike.md`. Recorded here
because a ruling that lives only in a plan file does not exist — `git grep`
cannot see it (DEV.md § Ruling provenance).

## Human rulings — 2026-07-30

- **R-1 — the 57 KB `title` payload is a FLAG, not a fix.** Registering JEJ
  routes the whole of `language-levels/jej/reference.md`
  (`[measured: wc -lc src/lib/study-lenses/language-levels/jej/reference.md]`
  3,178 lines / 57,826 bytes) into the DOM `title` attribute built at
  `orchestrate/index.tsx` and rendered at `orchestrate/level-ui/index.tsx`.
  `level-ui/types.ts` already records the rendered-markdown hover surface as a
  flagged follow-on, so registration makes an existing deferral load-bearing
  rather than creating a defect. Observed at the sandbox checkpoint and
  recorded; an unusable tooltip does **not** block the registration commit. No
  `level-ui/types.ts` change.
- **R-2 — the governance-parity campaign is DEFERRED.** Proposals to correct
  `CLAUDE.md`'s "same policy gates" claim, to wire the governance checker's
  presence diff at the `AGENTS.md` / `AGENTS.principal.md` fork, and to re-scope
  `AGENTS.md` by capability were authorized and then deferred on measurement: a
  separate governance campaign is complete and parked at an open human gate, all
  four governance files were dirty with uncommitted peer edits, and the measured
  invariant delta moved twice within one session. Deferred to a dedicated
  session after that gate clears.
- **R-3 — synchronous execution** for the documentation segments; the human's
  override of the fan-out default. AR reviewers are still spawned as the
  registered `ar-N` agents.
- **R-4 — the docs AR cycle is a standing rule, applied uniformly.** Every
  `docs:` commit gets AR-1 on README/curriculum content and AR-2 on DOCS
  content, in addition to AR-5. This ruling is recorded here because it could
  not previously be cited — it lived only in session memory, and DEV.md § Ruling
  provenance requires a ruling to be citable or it does not exist. It applies to
  the reference-curriculum and playbook segments **and** to the registration
  segment, which edits `language-levels/README.md`.
- **R-5 — fix the orphan table-of-contents entry in `jej/reference.md`** while
  editing the region around it. Batch-fix-now: the defect is adjacent to work
  already in hand. Scope stays inside the named regions; contradictions found
  elsewhere in the file are recorded as follow-ons, not fixed.
- **R-6 — the playbook correction is a mechanical truth-fix, not a design
  ruling.** Correct only what is measurably false, and route the unsettled
  design question to the playbook's own "Open questions" section rather than
  answering it inside a correction commit.

## AR resolutions

### AR-1 — playbook correction (PAUSE → resolved by R-6)

The reviewer paused a proposed correction that would have replaced one false
claim with another. The draft asserted that `buildScope`, `buildNodePathMap` and
`ScopeInfo` "have no greenfield home — port them as new work". Measured against
the tree, part of the capability is present upstream:
`[read: src/lib/study-lenses/lib/scoping/derive-scope-usage.ts — "export default function deriveScopeUsage(environment: Environment): ScopeUsage"]`
folds a per-declaration view from `facts.environment`, the one eslint-scope
graph. Instructing a future agent to port a second scope analysis would have
contradicted the region's own rule
`[read: src/lib/study-lenses/language-levels/README.md — "one parse truth, one scope analysis"]`.

A follow-on AR-5 then caught the resolution repeating the same failure mode: the
replacement text claimed the facts arrive "gate-guaranteed at drive time", which
is false for the one fact the paragraph most depends on —
``[read: src/lib/study-lenses/evaluators/README.md — "A failed `facts.environment` is the one"]``
derived stage that can accompany a reachable evaluation phase, as a dev-mode
defect — so an agent trusting that sentence would assert `.ok` where the
contract says to narrow it. Two further corrections landed with it: scopes are
enumerated by `root`/`childScopes`, never `byPath`
``[read: src/lib/study-lenses/lib/scoping/derive-scope-usage.ts — "never `byPath`, which collapses path collisions"]``,
and `ScopeUsage` covers the declaration half only
`[read: src/lib/study-lenses/lib/scoping/types.ts — "The scope tree is deliberately omitted"]`,
so `ScopeInfo` has no greenfield candidate at all.

The reviewer also found the surrounding inventory independently wrong, and those
corrections landed:

- the paragraph named two source files; there are **three** —
  `project-scope-table.ts` carries three of the imports.
- it named seven imports; there are **eight** names over **11** import
  statements, plus 7 more across three test files (the test files sit one level
  deeper, so a three-level pattern misses them). `ScopeAnalysis` was absent.
  `[measured: grep -rnE "from '(\.\./){3,4}(scope|validating|parse-old)/" src/lib/embody/lib/evaluating/trace/variables/]`
  18 total
- it filed `ScopeInfo` under `parse-old/`; both `ScopeInfo` and `ScopeAnalysis`
  come from `scope/`. This mattered because the paragraph justified the re-point
  partly on `parse-old/**` being tsconfig-excluded — an argument that does not
  reach `scope/`.
- it justified the no-runtime-embody-import rule as violating "the evaluator
  contract's type-only embody edge". That edge is to the **greenfield**
  `study-lenses/embody`, not to the `src/lib/embody` quarry tree, so the
  rationale was misapplied. Replaced with the two true objections: the tree is
  read-only migration quarry, and `parse-old/**` is additionally
  tsconfig-excluded.
- the `validateProgram` → `validate` step was described as a rename; it is a
  re-contract. The greenfield validator takes `ParseFacts` and returns
  `ReadonlyArray<Violation>`, fixes its allowlist internally, and never parses —
  so the tracer loses the AST it currently reads off the validation report.

Batch-fixed alongside, because each was measurably false and sat in or beside a
corrected hunk: the engine-import count (5 claimed, 9 across 6 files), the
bare-ref ambiguity that resolves `embody/lib/scope` under the greenfield region
by the file's own path convention, golden rule 5's unqualified "no runtime
import from embody", the file's blanket 2026-07-22 vintage stamp, and the
missing stop-instruction for an E1 agent that reaches the unsettled names.

Recorded as a follow-on and NOT fixed: the playbook's claim that the danger
evaluator is types-only. It ships a full evaluator
`[measured: ls src/lib/study-lenses/evaluators/danger/]` — `index.ts`,
`backend/`, `to-settlement.ts`, `tests/` — and the adjacent claim that the
variables tracer "becomes the first working greenfield evaluator" falls with it.
Both sit outside the corrected paragraphs.
