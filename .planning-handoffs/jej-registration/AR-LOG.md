<!-- TRANSITIONAL — delete when the jej-registration campaign completes. -->
<!-- cspell:ignore subsetting graduat -->
<!-- "subsetting" is quoted from the human's ruling and "graduat" is a fragment
     inside a regex that was actually run; editing either to satisfy the speller
     would falsify a quotation or a [measured:] command. -->

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
- **R-7 — the "first one registered" wording ruling never existed.** A plan file
  attributed to the human a ruling rewording `language-levels/README.md:88` from
  "first one written" to "first one registered". Asked directly, the human
  answered "i didn't". AR-1 had already flagged the citation as dangling —
  `[measured: git grep -n "first one registered" -- .planning-handoffs/]` exits
  1 — so the rule that caught it is the one that records it: a ruling that lives
  only in a plan file does not exist. The wording is **open**, decided on the
  merits below rather than by deference.
- **R-8 — roster order is not an architectural commitment.** The human: it "can
  be alphabetical. or later we can have some logic based on subsetting or
  ordering". Built-ins-first is the current mechanical behavior of
  `joinLevelRoster`
  `[read: join-level-roster.ts:37 — "const joined = [...builtInLevels, ...injected]"]`,
  and the ordering test this campaign owes pins **that function's** join order —
  a regression test over today's contract, never a claim that a built-in level
  deserves precedence. **No prose may enshrine built-ins-first as a pedagogical
  or architectural property.** A future alphabetical or subset-driven ordering
  would live downstream in the roster or the selector; when it lands, the
  ordering test moves or changes with it.
- **R-9 — what § What a level ships actually asserts.** The human's model, in
  their words: "language levels are present but not enforced unless configured
  or selected and SL component doesn't decide when or how or if a learner
  progresses through them". Both halves verified against the tree: enforcement
  is the selected level crossed with the strict posture
  `[read: orchestrate/index.tsx:263 — "the mask projects the SELECTED level's assessment crossed with the posture"]`,
  so an unselected level is consulted for its fit mark and constrains nothing;
  and no level-progression logic exists anywhere in the package
  `[measured: git grep -rniE "progress|advance|graduat|unlock|next level|level up" -- 'src/lib/study-lenses/**/*.ts' 'src/lib/study-lenses/**/*.tsx']`
  → every hit is writeme's within-exercise reproduction progress or local-llm's
  model-download progress. This replaces the written-versus-registered framing
  the paragraph carried; that distinction was never the point.
- **R-10 — two sentences in `study-lenses/README.md` § The story stay
  untouched.** Both already assert what this increment makes true — "**JEJ (Just
  Enough JavaScript)** ships as the first" and "No level gets anything special
  from the architecture — JEJ is simply the first one registered"
  `[read: src/lib/study-lenses/README.md § The story — both quoted verbatim]`.
  Both sit inside `## The story`
  `[measured: grep -n "^#\{1,3\} " src/lib/study-lenses/README.md]` → that
  heading spans until `## Why lenses?`; an earlier revision of this entry
  attributed them to a section named "What this package is", **which does not
  exist in the file**, and the second to `§ Why lenses`, which begins below the
  sentence it was said to contain. AR-5 caught both. They are false at HEAD and
  repaired by registration, so the commit body records the repair rather than
  editing the prose.

  **Two independent reasons a sweep misses that second sentence — do not
  conflate them.** An earlier revision of this entry gave the second as the
  cause of the first, which is wrong, and AR-5 caught it:
  1. **The campaign's two sweep greps do not target its wording at all.**
     Pattern 1
     (`no level selector|levels are registered|no levels|empty roster`) finds
     only one line in that whole file
     `[measured: grep -nE "no level selector|levels are registered|no levels|empty roster" src/lib/study-lenses/README.md]`
     → a single hit, not this sentence: "No level **gets**" is singular and
     matches no alternate. Pattern 2 (`built-in level`) finds nothing in the
     file at all `[measured: same grep with "built-in level"]` → exit 1; the
     adjacent text reads "built-in machine-facing **lenses**". Wrapping is
     irrelevant to both — the patterns simply do not describe this sentence.
  2. **A literal phrase grep misses it for a different reason: the wrap.**
     `[measured: git grep -n "first one registered" -- src]` → **exit 1, no hits
     anywhere under `src`**, even though the sentence is right there — because
     `proseWrap: always` breaks the phrase across a line boundary
     `[measured: git grep -n "one registered" -- src/lib/study-lenses/README.md]`
     → one line _begins_ "one registered.", so no single line contains the whole
     phrase.

     An earlier revision of this entry tagged this
     `[measured: git grep -n "first one registered"]` — unscoped — and claimed
     it returned "only the language-levels hit". It does not: unscoped it
     returns **8 hits, every one inside this very AR-LOG file**, and none in
     `src`
     `[measured: git grep -n "first one registered" | sed 's/:.*//' | sort | uniq -c]`.
     The command that does return a `language-levels` hit is the shorter
     `git grep -n "first one"`, matching the pre-edit "first one **written**".
     AR-5 caught the substitution. Recorded because the failure mode — writing
     down a _longer, more specific_ command than the one actually run — is
     invisible to every reader who does not re-run it.

  The lesson for the next sweeper is therefore **not** "watch for prettier
  wrapping" — it is that a keyword sweep only finds sentences its keywords
  describe, and no amount of wrap-awareness fixes a pattern aimed elsewhere.

## Human rulings — 2026-08-03

- **R-11 — the level docs are undiscoverable, not merely ugly.** R-1 flagged the
  _payload_: `level-ui/index.tsx:69` puts `option.docs` — jej's whole
  `reference.md`, 58,343 bytes `[measured: wc -c]` — into a DOM `title`. The
  sandbox checkpoint surfaced a second, independent defect on the same surface:
  **the native `title` mechanism itself.** The human's first report was "there
  are no tooltips that I can see", and on re-testing: "it just was unclear UX to
  hover on a button for so long. PS. the jej tip is a long file of code." So the
  hover surface works, and a learner meeting it cold concludes it does not
  exist.

  Two defects, one follow-on: the flagged rendered-markdown hover surface must
  be scoped to **discoverability and rendering**, not rendering alone. Neither
  blocks this commit — R-1 already ruled tooltip quality non-blocking, and this
  strengthens rather than reverses that. Recorded because the burden is the
  learner's, not the developer's.

## 🔍 Sandbox checkpoint — registration segment, PASSED 2026-08-03

Observed by the human at `http://localhost:3000/spiralearn/sandbox/orchestrate/`
against the working tree (uncommitted).

- **Action 2 — the blocking observation — CLEARED.** Selecting Just Enough
  JavaScript, the closed face reads exactly `Just Enough JavaScript · fits`
  `[relayed: human]`. That is the only correct mark of the four for the sandbox
  seed: it parses, `console` is an admitted host binding, and the harness passes
  no `type`, so the default is `module` `[read: orchestrate/index.tsx:63]`.
- **Action 3 — the tooltip appears**, and carries raw markdown. See R-11.
- **Actions 1 and 4 were not separately reported and were not chased.** The
  selector mounted, JEJ was present in the open list, and selecting it committed
  the choice — which is the substance those two actions exist to demonstrate.
  Ordering stopped being a blocking criterion under R-8, so JEJ's position
  relative to Scaffold was no longer a gate.
- **Neither blocking failure occurred:** no console error on mount, no failure
  to mount.

Recorded as the checkpoint's honest extent: two of four actions observed
directly, two inferred from the observed behavior, and the inference named
rather than presented as observation.

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

### AR-1 — registration segment (PAUSE ×2 → resolved by R-7…R-10)

Two rounds, both PAUSE, on `language-levels/README.md` — the segment's spec
surface, per R-4. This entry is the record R-7's "decided on the merits below"
and the doc-sweep's `language-levels/README.md:87-90` row both point at. It was
missing until AR-4 caught the dangling citation; recorded here because a review
whose verdict cannot be located did not happen.

**Round 1 — PAUSE.** The reviewer was asked to choose between two rewrites of
the sentence "JEJ is simply the first one written". It refused the question and
found the premise rotten:

- **The ruling being deferred to did not exist.** A plan file attributed "first
  one written" → "first one registered" to the human;
  `[measured: git grep -n "first one registered" -- .planning-handoffs/]` exited
  1. Asked directly, the human answered "i didn't" — see R-7. **A dangling
     citation caught an invented ruling**, the same instrument that later caught
     this entry's own absence.
- **The proposed replacement carried a new false claim.** The draft's "never
  what a level may do" is contradicted by the file it describes: the
  reserved-key guard runs over `injected` only
  `[read: join-level-roster.ts:26-27 — "This guard covers the injection boundary only — built-ins staying ''-free is pinned by the Interfaces test, not by any runtime check"]`,
  so a built-in **may** claim the key `README.md:30-32` says no level may claim.
- **The package README already carried the disputed phrasing**, at
  `study-lenses/README.md` — the two sentences R-10 names; both repaired, not
  edited.
- **Bounded context.** Roster mechanics belong to `composing/`, which already
  states them `[read: orchestrate/lib/composing/README.md:23-25]`; the region
  document should carry the level-contract claim only.

**Round 2 — PAUSE.** The redraft, built from the human's own model (R-9), was
re-reviewed and **contained a new false claim of its own** — the fifth time in
this campaign that a correction introduced one:

- **"Every registered level is _consulted_ for its fit mark" is false**, and the
  same file negates it 50 lines above the insertion point
  `[read: language-levels/README.md:36-39 — "it is never consulted about a program that does not parse … the undetermined verdict is the caller's, produced without consulting any level"]`.
  `answerVerdict` returns `{ kind: 'undetermined' }` **before** reaching
  `level.validate`
  `[read: orchestrate/lib/validating/create-memoized-validate.ts]`. Every
  registered level does get a fit _mark_; "consulted" is this region's most
  load-bearing verb and was the wrong one. Corrected to "gets a fit mark".
- **"ships" collided worse than the word it replaced.** All six uses of "ship"
  in this file take a **level** as subject `[measured: grep -n "ship"]`,
  including the section heading; the draft made the _package_ the subject two
  lines under the bolded "Levels never ship lenses". Resolved by dropping the
  qualifier entirely: **"JEJ is simply the first."**
- **The authority paragraph was misfiled.** § What a level ships is about
  payload; the claim is about authority, and § Consulted, never in charge
  already promises it in its heading while its body delivers only mechanics.
  Moved there.
- **The progression sentence had the wrong subject** — "this package never
  decides…" is a package-scoped claim in a document that says at `:13` the
  package README owns package meanings. Recast with the level as subject: "a
  level is a slice, never a rung".
- **"constrains" was a fourth synonym** for a concept the glossary already owns
  (enforcement / mask / strict). Replaced with "masks", which is literally all
  that happens.
- **The gutter was cleared as a counterexample**, twice over: it has no
  implementation at all
  `[measured: git grep -n "gutter" -- 'src/lib/study-lenses/**/*.ts' 'src/lib/study-lenses/**/*.tsx' | grep -v /tests/]`
  → one prose comment; and a violation marker is informational, not a guardrail
  `[read: src/lib/study-lenses/README.md — "and — only if you opt into strict — a guardrail that masks the study surfaces"]`.

**The human accepted all three round-2 placement proposals** (2026-08-03),
giving the wording now in the file. R-7's "the merits" are the four bullets
above.

Recorded and NOT fixed, as named follow-ons: § Adding a level documents only the
injection path, not appending to `built-in-levels.ts`; and `DOCS.md:56-57` uses
"registers" in the active sense ("it … registers nothing") against the passive
sense used throughout the package README.

### AR-2 — registration segment: DID NOT FIRE, and why

Recorded rather than silently skipped, because R-4 applies the docs AR cycle
uniformly and a non-firing AR-2 is indistinguishable from a skipped one unless
the verdict is written down.

**Three `DOCS.md` files carry roster or selector content. All three stay true;
none is edited, so `§ Two-Tier Autonomy`'s "updating DOCS.md requires user
approval" gate never opens for this segment.**

- `orchestrate/level-ui/DOCS.md:71` — "A zero-option render — the selector
  mounts only when levels are registered; preventing the empty mount is the top
  component's." **Stays true.** Registration does not change the rule; it makes
  the antecedent always hold. The gate at `orchestrate/index.tsx:328` still
  exists and is still the top component's.
- `orchestrate/DOCS.md:19` — "the built-in levels join the injected ones."
  **Stays true**, and becomes demonstrable rather than vacuous.
- `orchestrate/lib/composing/DOCS.md:16-20`, `:37`, `:44` — "the built-in
  rosters are appended with the host's injections", plus the
  `BUILT["built-in rosters"]` node in the data-flow diagram. **Stays true**; the
  roster's contents were never named here.

### The doc-site sweep — every hit, with its verdict

The plan's two greps were run
`[measured: grep -rniE "no level selector|levels are registered|no levels|empty roster" src/lib/study-lenses]`
→ 12 hits, and
`[measured: grep -rniE "built-in level" src/lib/study-lenses spiralearn]` → 6
hits. **Both instruments are incomplete.** A third net
`[measured: grep -rn "built-in roster\|builtInLevels\|built in" over *.md/*.mdx/*.ts/*.tsx]`
found four sites neither grep nor the plan's hardcoded authority list carried:
`orchestrate/README.md:338-341` (the glossary entry),
`orchestrate/lib/composing/README.md:23-25`,
`orchestrate/lib/composing/DOCS.md:16-20`, and the scaffold trio
(`language-levels/scaffold/README.md:6`, `scaffold/index.ts:8`,
`scaffold/DOCS.md:37`). All four stay true — but a sweep that missed them could
as easily have missed a stale one.

**GOES STALE — edited in this increment (4 prose sites + the tests):**

- `orchestrate/lib/composing/built-in-levels.ts:5-8` — "Empty today — no level
  ships built in yet."
- `orchestrate/lib/composing/join-level-roster.ts:34-36` — the debt comment this
  segment discharges.
- `language-levels/README.md` § What a level ships and § Consulted, never in
  charge — see § AR-1 — registration segment, above.
- `spiralearn/sandbox/orchestrate/index.mdx:9` and `:20-22` — "with the
  scaffolding level" and "the level selector shows the scaffold's live fit
  mark". The page the sandbox checkpoint loads; its walkthrough describes a
  one-level selector that will show two.

**STAYS TRUE — no edit.** Every conditional of the form "whenever levels are
registered" remains true; registration makes the antecedent always hold, which
is not the same as making the sentence false: `study-lenses/README.md:274` ·
`orchestrate/README.md:80`, `:135`, `:338-341`, `:344-345` ·
`orchestrate/index.tsx:262` · `orchestrate/lib/composing/README.md:15`, `:23-25`
· `built-in-levels.ts:2` (the file header, as opposed to its `@remarks`) ·
`level-ui/README.md:4` · `language-levels/README.md:22`, `:23`, `:119-123` · the
scaffold trio · `spiralearn/sandbox/level-ui/index.mdx:10` (that harness mounts
`LevelSelector` directly — no `StudyLenses`, no `joinLevelRoster`, so
registration cannot reach it
`[measured: grep -n "joinLevelRoster\|StudyLenses\|orchestrate/index"` → zero
hits]`).

⚠️ **The lookalike — and how it expired mid-segment.** While this sweep was
open, `orchestrate/lib/composing/built-in-lenses.ts` read "Empty today — **no
lens** ships built in yet", near-identical wording to the levels file being
rewritten three lines away. The sweep's verdict was **stays true**: this segment
changes the level roster only, so an unscoped find-and-replace on "Empty today"
would have shipped a false claim about the _lens_ roster.

**That verdict is now void.** A peer landed `47234d7c` — "wire
parsons/writeme/debug-props as built-in lenses" — which filled the lens roster
`[read: built-in-lenses.ts:15-19 — "const builtInLenses: ReadonlyArray<Lens> = [parsonsLens, writemeLens, debugPropsLens]"]`
and deleted the sentence this warning quoted. Both rosters now ship built-ins;
neither is the empty counterpart to the other, and the phrases "Empty today" and
"the empty built-in roster" no longer occur anywhere in the directory
`[measured: grep -rn "empty built-in roster\|Empty today" src/lib/study-lenses/orchestrate/lib/composing/]`
→ exit 1, zero hits.

The entry is kept rather than deleted because the expiry is the lesson: **a
doc-sweep verdict is only true at the SHA it was measured on.** This one was
written and falsified inside a single increment, by a peer's commit, in a shared
worktree. **Re-run the sweep against HEAD before trusting any row of it** —
including the "STAYS TRUE" list above, which was measured at `32747f57` and has
not been re-measured wholesale since. Do not look for a staleness count here: an
earlier revision gave one, mixed two different baseline SHAs to compute it, and
was wrong by the time it was written. The count also ages every time a peer
commits, which in this worktree is hourly. The instruction is the durable part;
any number attached to it is not.

### AR-3 — registration segment (CONSIDER, all findings folded)

Fired on the single failing ZOMBIES Zero test, before any implementation
existed. Recorded late: the second AR-5 pass found no trace of AR-3 anywhere in
this ledger
`[measured: git grep -rn "AR-3" -- .planning-handoffs/jej-registration/]` → exit
1, which is the same defect AR-4 raised as a blocker for AR-1. That remediation
was applied to AR-1 and not generalized. Written now so the segment's review
record is complete rather than selectively complete.

The reviewer judged the ZOMBIES strategy sound and the R-8 framing correct, and
raised four findings, all applied before the implementation landed:

- **The order assertions needed a durable marker tying them to the ruling.**
  Without one, a later refactor toward alphabetical ordering could quietly
  invert them as if cleaning up an accident. `DEV.md § Pinned expectations`
  exists for exactly this, and the file carried no `PINNED(` at all
  `[measured: git grep -n "PINNED(" -- src/lib/study-lenses/orchestrate/lib/composing/tests/]`
  → no hits. Both order-bearing assertions now carry
  `PINNED(human ruling 2026-07-30 R-8: …)`, which also engages the pinned-guard
  hook.
- **`toEqual([jejLevel])` was the wrong instrument for Zero.** Deep equality
  against a frozen object carrying ~109 KB of raw markdown dumps the whole
  payload into any red-phase diff, and — more importantly — would still pass if
  `built-in-levels.ts` hand-built a shape-alike object instead of importing the
  singleton. Split into a length assertion plus
  `expect(joinLevelRoster([])[0]).toBe(jejLevel)`; reference identity is what
  actually proves the module wire-up.
- **The Exceptions case must assert the full message shape.** A bare
  `toThrow('jej')` would pass on any unrelated error containing "jej" — and
  unlike the sibling roster's arbitrary fixture names, `'jej'` is now the key of
  a real imported module present on every path this function touches. Asserting
  `'duplicate level key "jej"'` instead.
- **`:15`'s name went stale with its assertion** — "one injected level → a
  roster of exactly that level" becomes false once the roster is
  `[jejLevel, testA]`. Renamed, not just re-asserted.

The reviewer flagged one claim of its own as unverified — whether `toBe` shrinks
the red-phase diff relative to `toEqual` — because measuring it would have
required writing a probe file into the repo, outside a read-only mandate. Run
afterwards: **it does not.** Vitest still pretty-prints the full expected object
under `toBe` `[measured: the red-phase run of the reshaped Zero pair]`. The
split earns its place on semantic strength alone, and the reviewer's honesty
about not having measured it is why that could be settled rather than inherited.

### AR-4 — registration segment (PAUSE → resolved, no re-implementation)

The reviewer found the code sound — well triangulated, correctly typed,
DOCS.md-conformant, no Fake-It residue, no security regression — and explicitly
declined the standard pre-commit PAUSE default of discard-and-retry: there was
nothing to re-implement. It paused on the **ceremony record**, not the work.

- **BLOCKER — the AR-1 entry for this segment was missing.** R-4 mandates AR-1
  on the README; AR-1 had in fact run twice and both rounds had PAUSEd. Neither
  was written down. The reviewer proved the gap three independent ways: no
  matching `### AR-` heading, the sweep's "see the AR-1 entry for this segment"
  citation resolving to nothing, and R-7's "decided on the merits below"
  pointing at a passage that did not exist. Under `DEV.md § Ruling provenance` a
  review whose verdict cannot be located did not happen. **Resolved**: the AR-1
  entry above was written from the two rounds' findings, and the dangling
  citation now links to it. The reviewer's own conclusion is worth preserving —
  it fact-checked every new prose claim itself and found none false, but named
  that as "_my_ after-the-fact substitute for AR-1, not AR-1 itself", since
  AR-4's focus areas do not cover ubiquitous language and bounded context.
- **IMPORTANT — AR-4 ran after the 🔍 checkpoint, against this campaign's own
  plan.** The plan orders AR-4 at step 11 and the checkpoint at step 12. Only
  the quality-checks-before-AR-4 reordering had a recorded rationale (surface a
  webpack failure before summoning a human); checkpoint-before-AR-4 had none,
  and no ruling authorized it. **Accepted as a real process defect, recorded
  rather than explained away.** Its concrete cost: `DEV.md § Resolution Rules`
  justifies the discard-and-retry default on "nothing is lost by discarding
  since nothing is committed" — false once a human has already spent wall-clock
  at a dev server. Had this AR-4 found a defect needing re-implementation, the
  checkpoint would have had to be re-run. Future increments hold AR-4 before the
  checkpoint.
- **CONSIDER — the reserved-key asymmetry deserves a named follow-on, not silent
  reliance on careful wording.** `built-in-levels.ts`'s "never what a level may
  do once consulted" is true as scoped, and the reviewer verified it: provenance
  is invisible downstream `[read: orchestrate/derive-study.ts:60-65]`. But if a
  future built-in claimed key `''`, two `data-level-option=""` entries would
  collide and that level would become default-selected on mount — roster
  membership changing behavior. Inert today (`jejLevel.key === 'jej'`) and the
  guard predates this diff. **FOLLOW-ON-BUILTIN-RESERVED-KEY**: extend the
  reserved-key guard to cover built-ins, or pin the absence differently than by
  the Interfaces test.
- **MINOR — `index.test.tsx:211` no longer discriminates.** "mounts the selector
  when levels are registered" injects `scaffoldLevel`, but the selector now
  mounts unconditionally, so the assertion would pass with zero injections. No
  coverage is lost (`:247` checks the scaffold option directly); the name claims
  more than it proves. **FOLLOW-ON-SELECTOR-TEST-NAME**, not fixed here —
  renaming a passing peer-adjacent test is outside this increment's one
  behavior.
- **MINOR — a measurement-form correction worth keeping.** Cite the test
  baseline by directory path, not bare keyword:
  `vitest run --project unit orchestrate language-levels` over-matches into
  `study-lenses--deprecated-architecture` and reports 90 files with 2
  pre-existing load failures. The path form
  (`src/lib/study-lenses/orchestrate src/lib/study-lenses/language-levels`) is
  the form every claim here uses. It yielded 32 files / 814 tests when AR-4 ran;
  AR-5 later added one more test (see below), so the figure at commit time
  is 815.

### AR-5 — registration segment (PAUSE → resolved, prose and one test)

The reviewer confirmed the governance override worked: it routed itself to
`AGENTS.principal.md` and independently reported **13** invariants there against
`AGENTS.md`'s 12, re-deriving the numbering shear rather than accepting any
count quoted to it. It judged the code PROCEED-worthy on its own and put every
blocking finding in the **immutable prose** — which is what AR-5 exists to gate,
since `--amend` is forbidden.

- **BLOCKER — the commit body stated a false cause, and it was the campaign's
  signature failure mode again.** The body explained the doc sweep's miss of
  `study-lenses/README.md`'s "first one registered" sentence as prettier
  wrapping. False: the two sweep patterns simply do not describe that sentence —
  "No level **gets**" is singular, and the adjacent text is "built-in
  machine-facing **lenses**", not "built-in level". Verified both
  `[measured: grep -nE "no level selector|levels are registered|no levels|empty roster" src/lib/study-lenses/README.md]`
  → one hit, not that sentence, and
  `[measured: grep -nE "built-in level" src/lib/study-lenses/README.md]` → exit
  1. The wrap explanation is true only of a **literal phrase grep**, a different
     instrument. **Resolved**: R-10 rewritten to separate the two reasons, and
     the body now says the lesson is that a keyword sweep only finds sentences
     its keywords describe. Had this shipped, it would have taught the next
     sweeper to design the wrong probe.
- **IMPORTANT — a staleness count mixed two baseline SHAs.** The sweep's expiry
  note said "measured at `32747f57` … now 20 commits stale" while tagging
  `[measured: git log --oneline 61a64530..HEAD | wc -l]`. Two different
  baselines, and the number was already wrong (21, not 20; from `32747f57` it is
  25). **Resolved** by deleting the count entirely — it ages hourly in this
  worktree, and "re-run the sweep against HEAD" was the only durable part.
- **IMPORTANT — a citation repaired by AR-4 still misdirected.** "see § AR-1 —
  registration segment, **below**" pointed upward. **Resolved**: corrected to
  "above", and the adjacent `file:line` section citations converted to
  `§ heading` form, per
  `[read: DEV.md § Section citations — "Never cite a document section by file:line. Line numbers are the fastest-rotting form there is"]`.
  Two corrections to an earlier revision of this bullet, both from the second
  AR-5 pass: it cited that rule to `§ Path citations`, which is a different and
  adjacent section carrying no such sentence; and it said the sweep row "now
  links to it", which is false — nothing in this changeset adds a markdown link,
  the row is bare prose naming the heading. The weaker claim in the commit body
  ("two citations that resolved to nothing now resolve") is the accurate one.

  **And the scope was understated in the wrong direction.** That revision called
  it "a rule this file _was_ breaking roughly two dozen times", reading as
  inherited debt beside the word "Resolved". Measured:
  `[measured: grep -oE "[A-Za-z0-9_./-]+\.(md|mdx):[0-9]+(-[0-9]+)?" .planning-handoffs/jej-registration/AR-LOG.md | wc -l]`
  → 21, and every one of them falls inside text this changeset adds. This entry
  **authors** the violations it describes; only the few adjacent to a repaired
  line were converted. The rest stand as known debt, named here rather than
  implied fixed.

- **IMPORTANT — a real loss was missing from the ledger.** Registration puts
  **109,040 bytes** of raw markdown into the client bundle of every page that
  mounts StudyLenses
  `[measured: wc -c on jej/reference.md and jej/notional-machine.md]`, for
  content reachable only through a tooltip. R-1 and R-11 flag the hover
  surface's usability; neither flags its weight. **Resolved**: added to the
  commit body's loss ledger, and the rendered-markdown follow-on is now scoped
  to consider lazy-loading too.
- **IMPORTANT — the one behavior the human eyeballed had no test.** The
  checkpoint's blocking observation was the face reading
  `Just Enough JavaScript · fits`, and nothing in jsdom pinned it
  `[measured: grep -rn "Just Enough JavaScript" src/lib/study-lenses/orchestrate/tests/]`
  → exit 1. A regression in `jejLevel.validate`, in `snippetTypes`, or in mark
  derivation for the built-in path would have been caught only by another human
  at a dev server. **Resolved**: added a test mounting with
  `activeLanguageLevel="jej"` and no injected levels, asserting that exact face
  text. This is the test-additive resolution the implementing agent owns.
- **IMPORTANT — two follow-ons recorded here were absent from the body**, one of
  them substantive: § Adding a level documents only the injection path, while
  this commit created and used a second. **Resolved**: both added to the body as
  named follow-ons. Not fixed in place — new README content there would open a
  fourth AR-1 round at the commit gate under R-4, and the recipe gap is a
  documentation increment of its own.
- **MINOR, all applied** — the build-equivalence evidence was re-tagged (my
  control was revert-and-rebuild; AR-5's archive-based control is `[relayed:]`,
  not mine to claim as `[measured:]`); the surfaced svg defect was downgraded in
  an earlier draft to a "warning" when the peer's own commit calls it a
  site-wide crash, and is now described as a crash; `[measured: wc -c]` gained
  its operand; a quoted em dash that had been transcribed as a hyphen was
  restored; and the deleted debt comment is now cited at `@6d4fa40a`, since the
  text does not survive this commit.

One AR-5 finding did **not** hold and was not applied: it placed
`type: initialType = 'module'` at `orchestrate/index.tsx:62`. It is at **63**
`[measured: grep -n "initialType" src/lib/study-lenses/orchestrate/index.tsx]`.
Recorded because a reviewer's line arithmetic is evidence like any other, and
this campaign's rule is that claims are checked, not deferred to — including a
reviewer's.
