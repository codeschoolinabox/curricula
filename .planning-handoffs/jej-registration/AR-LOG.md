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

### AR-1 — reference.md reconciliation (CONSIDER, all findings resolved)

AR-2 did not fire on this segment: it edits curriculum content only, and no
`DOCS.md` was touched. Recorded so the uniform-application rule in R-4 is not
read as having been skipped.

The reviewer confirmed both defects were real — it screened the changed code
blocks through the level's own allowlist mechanically and reproduced `==`'s
rejection — and confirmed the level is module-only from three independent
carriers plus `notional-machine.md`, which is module-throughout. It then raised
five in-scope findings, all applied:

- **The prologue promise over-reached.** The draft said "nothing is added to
  your code". The danger evaluator does add code
  `[read: src/lib/study-lenses/evaluators/danger/backend/build-counters.ts — "counter-declaration prefix"]`:
  a counter prefix, plus an iteration guard spliced into every loop body, whose
  message names an ordinal — "Loop 1 exceeded N iterations." — not the variable.
  Narrowed to the claim the tree actually guarantees: nothing is inserted _above
  your first line_, so line numbers are faithful. The prefix ends in a trailing
  space with no newline, which is what makes that true.
- **A bullet was false about JavaScript, not just about the level.** "Using a
  variable before declaring it throws a `ReferenceError` instead of silently
  creating a global" — but _reading_ an undeclared variable throws in sloppy
  mode too `[measured: node -e "try{console.log(zzz)}catch(e){…}"]`. The strict
  difference is _assigning_: sloppy creates a global, strict throws. Rewritten.
  This sat just outside the seven named regions; fixed anyway, because the
  commit claims to make this section true and the bridge sentence rewrote its
  lead-in.
- **The module framing orphaned the two bullets beneath it.** Under the old "the
  runner adds it for you" framing the looser mode was imaginable; under "you are
  a module, modules are always strict" it has no in-level referent at all — JEJ
  admits only modules. Added a bridging clause naming the comparison.
- **"Relational operators" is vocabulary this file does not speak.** Its own
  name for `<`/`>`/`<=`/`>=` is Comparison, with a section under that heading.
  Reworded.
- **The BigInt edit broke a minimal pair.** The original contrasted `42n === 42`
  with `42n == 42` — same operands, one operator apart. The first replacement
  changed both operator and operand. `42n <= 42` is `true`
  `[measured: node -e "console.log(42n <= 42)"]` and in-level, so it restores
  the pair and sharpens it: same two values, `===` says false, `<=` says true. A
  clause was added to the section's Important callout noting comparison is the
  exception to the no-mixing rule.

Named follow-ons, outside scope and NOT fixed:

- **FOLLOW-ON-JEJ-DUP-REFERENCE** — a byte-identical copy of `reference.md`
  lives at `src/lib/embody/language-levels/just-enough-javascript/reference.md`
  `[measured: diff -q against the baseline jej copy]` and still carries both
  defects. It ships to no learner, but
  `[read: src/lib/embody/lib/validating/just-enough-js.ts — "Must match"]`
  `reference.md` is a live doc-to-doc contract now aimed at the stale copy.
  Decide whether that copy is retired, re-pointed, or kept in sync.
- **FOLLOW-ON-JEJ-SPIRALEARN-DRIFT** — the same orphan anchor exists in
  `spiralearn/welcome-to-programming/just-enough-javascript/README.md`
  `[measured: grep -n "Before Your Code Runs" on it]` and was resolved there by
  retargeting the link rather than adding a heading. That README already teaches
  "Program Type: Module", so this segment converges on house prose rather than
  inventing it. R-5 chose the heading; the divergence is deliberate, recorded
  here so it is not later read as an accident. Note this names the README — the
  spiralearn `reference.md` beside it is a different, older document that
  carries neither defect and needs no change.
- Pre-existing contradictions found in the reviewer's full read, none touched: a
  "the only feature that produces a different result each time" claim about
  `Math.random()` that the surrounding text contradicts; a duplicated
  `console.error` line; a duplicate-slug TOC entry for Arithmetic; an
  under-claim about assigning to object properties; and an "all
  `String.prototype` methods are available" line naming a member the allowlist
  blocks.

**A second AR-5 pass caught one contradiction this change CREATED**, not
inherited: a `console.trace` aside said the call stack "is always just the
top-level script" — consistent while the file taught scripts, and a direct
collision with the module framing the moment it lands. Fixed in the same commit
("your top-level program"), along with "covered in later modules" two lines
below it, where "modules" had become a homonym for the JavaScript kind. Recorded
because the first draft of this entry misfiled it as pre-existing.

Losses, deliberate and enumerated:

- the "Modern JavaScript applications often use `<script type=module>`" framing
  was dropped in the rewrite and then restored — it is the sentence that makes
  the module framing worth caring about, and the spiralearn twin keeps it.
- the "using a variable before declaring it" bullet is gone for good. It was
  false as a strict-mode claim and had to go, but the true fact underneath — the
  temporal dead zone — is now taught nowhere in the file. Named here rather than
  silently absorbed.

**OQ-1 is closed by this segment.**
`.planning-handoffs/study-lenses-jej-level.md` records the
reference-versus-level strict-mode contradiction as OQ-1 and instructs that it
not be resolved from `reference.md`, "because `reference.md` is one of the
things in conflict". The human ruled the direction — the curriculum changes —
and the reference now teaches the module the level admits, so that paragraph and
its standing instruction are stale. Annotating that file is left to whoever next
opens it; it sits outside this commit's pathspec.
