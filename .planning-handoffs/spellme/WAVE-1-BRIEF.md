<!-- cspell:ignore spellme lookaheads lookahead tokenizer tokTypes retokenizes -->
<!-- cspell:ignore backQuote dollarBraceL braceR braceL privateId invalidTemplate -->
<!-- cspell:ignore questionDot Punctuator IdentifierName PrivateIdentifier -->
<!-- cspell:ignore NumericLiteral StringLiteral RegularExpressionLiteral -->
<!-- cspell:ignore TemplateSubstitutionTail HashbangComment LineTerminator -->
<!-- cspell:ignore DivPunctuator RightBracePunctuator pathspec worktree -->

# tdd-worker launch brief — `lib/scanning` Phase 1, Wave 1

You own the first 33 of this module's 67 committed-skipped tests. Phase 0 is
committed and human-approved. You are one worker in an orchestrated fan-out; an
orchestrator holds the spine, reads the seam after you, and owns AR-5.

Process rulings governing this wave live in
[`./PHASE-1.md` § Rulings of record](./PHASE-1.md) — six of them, all cited and
dated. Read that section; this brief does not restate their grounds.

## First act — governance, before anything else

Read the repo-root `CLAUDE.md` router. Check your own model id against its
qualifying list and read whichever governance file it selects, END TO END. Then
`DEV.md` § Incremental Development Workflow (Phase 1), § Adversarial Review
Protocol, § Shared-worktree git mechanics, § Ruling provenance.

Do not skip this because this brief summarizes some of it. Router-text reach
into a spawned worker has been measured both present (2026-07-29) and absent
(2026-07-28); the explicit read is the contract.

## Then read the module canon, end to end, never in split ranges

- `src/lib/study-lenses/lib/scanning/README.md` — vocabulary, the two
  lookaheads, the kind table, § Edge cases
- `src/lib/study-lenses/lib/scanning/DOCS.md` — the architectural sketch: five
  named execution phases and the Mermaid data flow. **This is what your Refactor
  step is held against.**
- `src/lib/study-lenses/lib/scanning/types.ts` — `InputElementKind`,
  `ScanInput`, `InputElement`
- `src/lib/study-lenses/lib/scanning/derive-input-elements.ts` — the stub you
  replace; its whole body is currently a throw
- `src/lib/study-lenses/lib/scanning/tests/derive-input-elements.test.ts` — your
  67 tests, all `it.skip`

## Phase-1 steps 1-4 are already discharged — you start at step 5

`DEV.md` § Phase 1 opens with JSDoc → stub → placeholder types → lint. **All of
that is committed already.** The stub exists with its full JSDoc contract, the
types are final in `types.ts`, and the suite is written. Your cycle starts at
step 5, the un-skip. Do not write a new stub or new JSDoc scaffolding.

## Measured baselines — the debt that is NOT yours

Measured by the orchestrator, 2026-08-15. The worktree is shared and moving; if
you see these, they are pre-existing and not your failures.

| Fact                             | Value                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Last commit touching your module | `7e083de2`, verified unchanged since [measured: `git diff --stat 7e083de2 HEAD -- src/lib/study-lenses/lib/scanning/` → empty]                   |
| `npx tsc --noEmit`               | **0 errors.** Any error you see is yours                                                                                                         |
| Your module's tests              | 67 total, 67 skipped, 0 passing                                                                                                                  |
| markdownlint, repo-wide          | 82 errors — **not your gate**, and you touch no `.md`                                                                                            |
| Node                             | v20.11.0 against engines `>=22.11.0` — **below minimum, everything runs anyway.** Proceed; do not treat it as a blocker, do not upgrade anything |
| HEAD                             | **moves under you.** It advanced 8 times during one planning session. Re-measure it; never cache it                                              |
| Unpushed vs `origin/main`        | 91 and climbing, almost all other sessions' work                                                                                                 |

**Failing-test baseline — repo-wide, all foreign** [measured:
`./node_modules/.bin/vitest run --project unit` → `Test Files 8 failed | 414
passed | 2 skipped (424)`, `Tests 41 failed | 9586 passed | 149 skipped | 17
todo`]:

```text
scripts/lib/check-tables/tests/find-table-defects.test.ts
src/lib/embody/lib/evaluating/shared/guard-loops/sandbox.test.ts
src/lib/study-lenses--deprecated-architecture/embody/language-levels/just-enough-javascript/aithor/tests/aithor.test.ts
src/lib/study-lenses--deprecated-architecture/embody/language-levels/just-enough-javascript/aithor/tests/make-aithor-runtime.test.ts
src/lib/study-lenses--deprecated-architecture/embody/lib/evaluating/trace/variables/tests/trace-variables.test.ts
src/lib/study-lenses--deprecated-architecture/embody/lib/evaluating/trace/variables/tests/variables-worker-setup.test.ts
src/lib/study-lenses--deprecated-architecture/embody/tests/embody-trace-variable-lifecycle.test.ts
src/plugins/study-lenses/tests/remark-study-lenses.test.ts
```

**None is in `lib/scanning`.** Your gate is your own directory green plus zero
NEW failures outside that list — never whole-repo green. Run the scoped command,
not the whole suite.

⚠ The first of those eight is **untracked peer work in progress**
(`?? scripts/lib/check-tables/`). If a peer fixes, moves or deletes it mid-wave,
that baseline shifts under you through no action of yours. Judge new failures by
path against the other seven, and treat a change in that one as foreign noise.

## Commit form — verbatim, non-negotiable

Stage and commit in ONE shell invocation so a peer's `git add` cannot land
between them:

```text
git add <your explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

**The pathspec is the protection, not a clean index.** A peer's files staged
alongside yours are normal, are not yours to unstage, and are no reason to stop
— read the staged list to check your own pathspec, not the whole index. It
protects other FILES, never a peer's edits to one of yours: if a peer has
touched a file you need to commit, you cannot commit it without taking their
work, so leave it and report FLAG. Peer files ARE currently staged; expect that.

`--no-verify` because lint-staged runs over the whole staged set and would
rewrite the peer's work. You run the per-file checkpoints yourself instead. On
an `index.lock` collision, wait briefly and retry. Never push, never branch,
never amend. **Announce each commit as it lands: full SHA + message.**

Your paths are exactly two:
`src/lib/study-lenses/lib/scanning/derive-input-elements.ts` and
`src/lib/study-lenses/lib/scanning/tests/derive-input-elements.test.ts`.
Anything else is a FLAG.

## Ceremony — set by the human, not by you

`ceremony: full` for this campaign (human ruling 2026-08-14, cited in
[`./PHASE-1.md` § Rulings of record](./PHASE-1.md)).

- **AR-3 is opted out** for un-skips — a per-review opt-out, which is a separate
  mechanism from the level. Do not spawn `ar-3`. **You may not extend the
  opt-out to AR-4.**
- **AR-4 fires per increment** — after self-review, before commit. Spawn the
  registered `ar-4` by name.
- **AR-5 is the orchestrator's. Do not spawn it.** Its inputs are the
  plan-approval baseline SHA and the campaign's whole SHA list, which no worker
  holds. It fires at your wave boundary. **Tripwire: if you reach your exit gate
  and no orchestrator has acknowledged your SHA list, report FLAG** — that means
  the review has no owner in practice, whatever this document says.
- **Never pass a `model` parameter** when spawning a reviewer — the frontmatter
  pins govern.
- Carry **"strictly read-only — no writes, moves, or deletes"** in every review
  prompt. AR agents hold Bash and can delete files.
- If a registered reviewer will not spawn, PAUSE at the trigger and report the
  reviewer's input paths; the orchestrator dispatches it and resumes you.

**AR-4 verdict routing** — you have no human, so:

- **PROCEED** → continue to the commit.
- **CONSIDER** → document your response to each concern in the commit body, then
  continue. Do not silently accept.
- **PAUSE** → **report BLOCKED with the reviewer's concerns verbatim.** Do not
  commit. Per DEV.md, a pre-commit AR-4 PAUSE defaults to _discard and
  re-implement_, not patch-in-place — nothing is committed yet, and patching a
  wrongly-shaped implementation costs more than a clean retry. Name the specific
  confusion in your report.

Every commit body carries this settings line verbatim:

```text
work: software · twin-doc: none · ceremony: full (AR-3 opted out by human, 2026-08-14) · prospective
```

DEV.md's own example shows `ceremony: full (AR-3 n/a)`. **Ours deliberately
differs** — AR-3 is applicable here and was opted out, which is not the same as
not-applicable. Nothing mechanical validates this string; do not "correct" it
toward DEV.md's example.

Commit bodies also carry **sourced claims** — every repo-state claim tagged
`[measured: <command>]`, `[read: <file> § <heading> — "<quoted>"]`, or
`[relayed: <who>]`. A body is immutable once written; amend is forbidden. **Cite
a ruling or do not assert it** — the six that govern this wave are in
`./PHASE-1.md § Rulings of record`, findable by
`git grep -n "human ruling" -- .planning-handoffs/spellme/`.

## Your cycle — the increment boundary is the red event

**An increment contains exactly one red test.** That is DEV.md § Phase 1 step 5
unamended, and it is a boundary rule, not a prediction: the table below
forecasts where the reds fall, but the _actual_ red is what closes an increment.

Within an increment's set, work strictly in file order:

1. **Un-skip the next single test and run it.** Never un-skip a set at once.
   - **Green** → it is non-discriminating. Record in one sentence _what it would
     have caught and which earlier increment forced that_, then repeat step 1.
     Never assume a test is green; run it.
   - **Red, and no test has yet gone red in this increment** → this is the
     driver. Go to step 2.
   - **Red, and a test already went red in this increment** → **stop. Close the
     current increment at steps 6-11 first, then open a new one starting with
     this test.** This is the case where the table's forecast was wrong; say so
     in the report. It is not BLOCKED and not FLAG.
2. `npx eslint <test-file>`
3. Implement the minimum that makes the driver green. Fake It is legitimate
   **only** where the table names it, and expires at the named expiry test.
4. **Patch-or-reroll check.** If green came from guessing, backtracking, or
   touching more surface than the stub implied — discard and re-implement fresh,
   naming the confusion. Nothing is committed yet.
5. Continue step 1 through the rest of the set.
6. `npx eslint <impl-file>`
7. **Refactor against the DOCS.md sketch** — are the named phases present and
   distinct? Concerns separated, not collapsed to pass tests? Any Fake It
   surviving past its triangulation point? Ubiquitous language throughout?
   Sketch the intra-file flow as ephemeral Mermaid for your own reasoning.
8. Self-review — both checklists in your governance file.
9. **AR-4.** Provide: the implementation file, the test file, `types.ts`, the
   DOCS.md sketch including its Mermaid diagram, and any utilities used.
10. Final lint on every modified file. Quality checks: `npx tsc --noEmit`
    (0-error baseline), and
    `./node_modules/.bin/vitest run --project unit src/lib/study-lenses/lib/scanning`
    — **show all three vitest summary lines**, because an Unhandled Error fails
    a file without failing any test.
11. Commit, per the form above. Announce the SHA.

**No 🔍 sandbox checkpoint** in your wave — declared explicitly: `lib/scanning`
is a pure leaf with no user-observable surface.

## The implementation shape

One file, one default export, **three hoisted in-file helpers** — the fold, the
naming, the gap split. Each has exactly one call site, and this package extracts
to a new file only at two or more. Sketch phase 1 (_Confirm the reading_) is a
guard clause and phase 4 (_Interleave the set-aside_) is a merge; both stay
inline in the export. **The Refactor step is held against the five phases, not
against a helper list.**

Reuse, verified present by the orchestrator:

- `freezeInPlace` from `@utils/freeze-in-place.js` — default import, `.js`
  extension. `@utils/*` maps to `src/lib/utils/*` in both `tsconfig.json` and
  `vitest.config.ts`. The module owns everything it publishes, so this and
  **not** `cloneAndFreeze`.
- Identity comparison against `acorn.tokTypes.*` is the **only type-safe
  discriminator** — `TokenType`'s `.d.ts` exposes only `label` and `keyword`,
  and `@typescript-eslint/no-unsafe-member-access` is an error in this zone.

## Tokenizer ground truth — measured, do not re-derive

Measured against acorn 8.16.0 with the test helper's own options
(`ecmaVersion: 2024`, `sourceType: 'module'`, `ranges: true`, `onComment`
array). Every one of the 67 expectations was hand-checked against this; **no
test in the file is wrong.** An independent cold reader reproduced this whole
block exactly, twice.

```text
"`a`"        -> "`"[0,1) template[1,2) "`"[2,3)
"`a${b}c`"   -> "`"[0,1) template[1,2) "${"[2,4) name[4,5) "}"[5,6) template[6,7) "`"[7,8)
"`${a}${b}`" -> "`"[0,1) template[1,1)ZW "${"[1,3) name[3,4) "}"[4,5) template[5,5)ZW "${"[5,7) name[7,8) "}"[8,9) template[9,9)ZW "`"[9,10)
"`a${`n${q}`}c`" -> 13 tokens; template[10,10) is ZW; inner run closes before the outer resumes
"tag`a${x}\unicode`" -> name[0,3) "`"[3,4) template[4,5) "${"[5,7) name[7,8) "}"[8,9) invalidTemplate[9,17) "`"[17,18)
"x**=2"  -> name[0,1) "_="[1,4) num[4,5)
"a /= b" -> name[0,1) "_="[2,4) name[5,6)
"a += b" -> name[0,1) "_="[2,4) name[5,6)
"a / b"  -> name[0,1) "/"[2,3) name[4,5)
"a?.b"   -> name[0,1) "?."[1,3) name[3,4)
"class C { #x }" -> class[0,5) name[6,7) "{"[8,9) privateId[10,12) "}"[13,14)
"x = /ab+c/gi"   -> name[0,1) "="[2,3) regexp[4,12)
"typeof x" -> "typeof"(keyword)[0,6) name[7,8)
"let x = 1" -> name[0,3) name[4,5) "="[6,7) num[8,9)   -- 4 tokens
"" / "   " -> ZERO tokens
```

**Those are `.label` strings, and you must compare by identity — here is the
mapping.** `backQuote` and `dollarBraceL` are not guessable from their labels
and are exactly what the fold increments need:

| label                       | `acorn.tokTypes.*`                   |
| --------------------------- | ------------------------------------ |
| `` ` ``                     | `backQuote`                          |
| `${`                        | `dollarBraceL`                       |
| `}`                         | `braceR`                             |
| `{`                         | `braceL`                             |
| `_=`                        | `assign` — every compound assignment |
| `=`                         | `eq`                                 |
| `/`                         | `slash`                              |
| `?.`                        | `questionDot`                        |
| `template`                  | `template`                           |
| `invalidTemplate`           | `invalidTemplate`                    |
| `name`                      | `name`                               |
| `privateId`                 | `privateId`                          |
| `num` / `string` / `regexp` | `num` / `string` / `regexp`          |

Load-bearing consequences:

- **`/=` and
  `**=`share`tokTypes.assign`** — verified by identity, not label. `/`alone is`tokTypes.slash`. So the naming rule is **not** a pure type lookup; the source slice decides. And it is **not a length rule** either: `+=`is two characters and is a`Punctuator`.
- **35 `tokTypes` entries carry a `keyword`** (`_break` through `_delete`). The
  collapse is `type.keyword != null` → `IdentifierName`, never an enumeration.
  `let` carries **no** keyword — it is a plain `name`, which is why `let` is the
  wrong example for this rule and `if` / `typeof` are the right ones.
- **`tokTypes.template !== tokTypes.invalidTemplate`** — two distinct objects.
  Both lookaheads must admit both, or the `}` before a tag-only-escape chunk is
  mis-named and the closer search runs off the end of the array.
- **The generator form emits no `eof` token.** The sibling's `!== tt.eof` filter
  would arrive dead here — do not copy it.

## Traps, each of which has already cost something

- **The test helper mirrors `src/lib/study-lenses/embody/derive-tokens.ts`**
  (note: `embody/` sits directly under `study-lenses/`, _not_ under `lib/`) —
  **not** `classifying`'s `acorn.parse` + `onToken` helper, which runs at ES2022
  and refuses every program that lexes but does not parse, the exact case this
  module exists to serve. The committed suite already does this correctly. **Do
  not "fix" it toward the sibling.**
- **`loc` is always `undefined`** — the options pass `ranges: true`, not
  `locations: true`. Anything reading `.loc` is dead code.
- **Never read `token.value`.** It is absent from acorn's `.d.ts` and is an
  _object_ for a regular-expression token. For `#priv` it is `priv`, without the
  `#`. Source-slice authority is not stylistic here.
- **Never deep-freeze anything holding a parser token.** An acorn token's `type`
  is a process-global singleton shared across every parse in the process. The
  published contract is token _indices_ precisely so the freeze stays inside
  this module. A wave-2 test pins
  `Object.isFrozen(acorn.tokTypes.name) === false`.
- **`Array.from(...)`, never `[...iterable]`** — `local/no-iterable-spread` is
  an error. Babel loose-mode compiles spread to `[].concat(x)`, which _wraps_ a
  non-array iterable instead of draining it. This bug has shipped twice.
- **Never run `eslint --fix`** — severity-blind, and a known landmine here.
- **Plant no new `PINNED(` markers.** The guard hook exists but is not
  registered in `.claude/settings.json`.
- **`git grep -c "it.skip"` unscoped also matches `scanning/README.md`** (the
  prose "it skips"). Scope it to the test file.

## Lint constraints that will bite this file

- **No `switch`** (`no-restricted-syntax`) — use lookup `Map`/`Set` keyed by
  TokenType identity plus an ordered if-chain, as the sibling does.
- **`local/newspaper-order`** — imports → main → **consts** → helpers. Hard
  error, **not auto-fixable**. Your token-type tables must sit in one contiguous
  block _between_ the default export and the helpers.
- `func-names: ['error','always']` — name your callbacks.
- `unicorn/prevent-abbreviations` — no `idx`, `str`, `tok`, `el`; spell
  `parameters`, not `params`.
- `functional/immutable-data` is a warn: a local accumulator that never escapes
  needs a paired `/* eslint-disable ... -- <reason> */` …
  `/* eslint-enable ... -- <reason> */`. The `--` reason is mandatory, **and an
  unused disable directive is itself an error**.
- `max-len` 100 (comments exempt). `sonarjs/cognitive-complexity` warns at 15.
  No `max-lines` rule — the sibling is 694 lines.
- `import/no-named-export` — one default export. All `@typescript-eslint`
  unsafe-\* rules are errors in this zone.
- Tests: no comments, one assertion per `it`, inline data, explicit vitest
  imports.

## Your increments — 33 un-skips, ~16 increments

File order is the un-skip order **within** each block. One deviation, and it is
a **human ruling of 2026-08-14, cited in `./PHASE-1.md`, not a mistake to
correct**: the `Boundaries — tiling` block is **NOT yours**. It is deliberately
deferred to wave 2, because its 5 tests sweep the whole pipeline over a 22-item
corpus, and un-skipping them at their file position would license two structural
fakes that leave no hardcoded value for the Refactor step to find. **Leave that
block skipped. Do not touch it.**

The count is a **forecast**, not a contract — the red event defines the
boundary. Expect roughly 16.

| #   | Set      | Forecast driver            | Behavior driven                                                                                                                         | Notes                                                                                                                                                                                                                   |
| --- | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Zero: 1  | empty source               | Replace the stub; return an empty array                                                                                                 | Fake It `return []` is legitimate; **expires at 2**. The test uses `toEqual`, which does not inspect frozenness — freezing is wave 2's business, so do not add it for this test                                         |
| 2   | One: 4   | lone identifier            | One element per token: span from the token range, `text` from `code.slice`, `tokenIndices` present                                      | `InputElement` is a closed 5-field record, so all four fields land together. The other 3 are **expiry** tests if you hardcoded any field                                                                                |
| 3   | Many: 3  | short declaration          | Kills the kind hardcode. **Creates sketch phase 5** — gap fill and `WhiteSpace`                                                         | 3rd un-skip pins the **index space**: `elements('let x = 1')[2].tokenIndices` is `[1]` — an index into the CALLER's token array, never into your output                                                                 |
| 4   | vocab: 6 | `if`                       | The 35-type keyword collapse — `type.keyword != null`                                                                                   | Then `typeof x`, `let`, `null`, `true`, `false` all green. `typeof x` is what catches an enumeration; **`let` is green by design** — it needs no correction                                                             |
| 5   | vocab: 1 | `#x`                       | `privateId` → `PrivateIdentifier`                                                                                                       |                                                                                                                                                                                                                         |
| 6   | vocab: 1 | `a / b`                    | `tt.slash` → `DivPunctuator`                                                                                                            |                                                                                                                                                                                                                         |
| 7   | vocab: 1 | `a /= b`                   | **The source-slice consult.** `tt.assign` is not resolvable by type alone                                                               | Phase 3's source-slice authority. Ask yourself now what the expiry tests are                                                                                                                                            |
| 8   | vocab: 1 | `x**=2`                    | **Expiry 1 for 7** — kills a bare `tt.assign → DivPunctuator`                                                                           |                                                                                                                                                                                                                         |
| 9   | vocab: 1 | `a += b`                   | **Expiry 2 for 7** — kills "the slice is two characters"                                                                                | Split from 8 deliberately: if 7 took the simplest Fake It, both go red, and one red per increment is the boundary rule                                                                                                  |
| 10  | vocab: 1 | `{ }`                      | `braceR` → `RightBracePunctuator`, unconditional **for now**                                                                            | Becomes conditional at 15 and migrates into phase 2                                                                                                                                                                     |
| 11  | vocab: 2 | `a?.b`, else regexp        | `tt.regexp` → `RegularExpressionLiteral`                                                                                                | `a?.b` comes first in file order and is green if your naming default is `Punctuator`; if it is red it is the driver and regexp opens a new increment                                                                    |
| 12  | vocab: 2 | `1_000`, else `'hi'`       | `tt.num` / `tt.string` rows                                                                                                             | Whichever goes red first is the driver                                                                                                                                                                                  |
| 13  | fold: 1  | `` `a` ``                  | **Creates sketch phase 2.** A backtick opens a run; the run collapses to one element carrying every token it spans; the opener names it |                                                                                                                                                                                                                         |
| 14  | fold: 2  | head span `[0,4]`          | The closer set is `{dollarBraceL, backQuote}`, not backtick alone                                                                       | The head-_kind_ test is green even under a backtick-only fold, which is why the _span_ test is the driver                                                                                                               |
| 15  | fold: 4  | `TemplateSubstitutionTail` | **The `}` one-token lookahead**, and the second run opener. Increment 10's `}` row becomes conditional and moves into phase 2           | Then zero-width absorption by kind, then **``elements('`${a}${b}`')[0].tokenIndices`` is `[0,1,2]`** — that one catches a zero-width _filter_ masquerading as a fold — then the nested template. Nesting needs no stack |
| 16  | fold: 2  | tag-only escape            | **Both lookaheads admit `invalidTemplate`**                                                                                             | Then the folded-run index count, green if 13 carried indices                                                                                                                                                            |

## Your exit gate — what wave 2 inherits

Report DONE only when all of these hold, each shown with its command output:

- 33 of 67 un-skipped and passing; the remaining 34 still skipped
- `npx tsc --noEmit` still 0 errors
- No NEW failing test file outside the 8 baseline paths above
- The **fold is real**, not a zero-width filter — `` `${a}${b}` `` head run
  carries `[0,1,2]`
- The **index space is the caller's**, not your output array
- DOCS.md sketch phases 2, 3 and 5 exist as distinct, named things in the code
- Every commit announced with its full SHA

The orchestrator then reads the seam and fires AR-5 before wave 2 launches.

## Report DONE | BLOCKED | FLAG — no fourth channel

- **DONE** = verified AND committed. Green-but-unverified is BLOCKED.
- **BLOCKED** = you cannot finish, or an AR-4 returned PAUSE. Say exactly why
  and what you need. If you are running long on context, report BLOCKED **at a
  committed increment boundary** — never mid-triangulation — and the
  orchestrator launches a successor from there.
- **FLAG** = an inter-file contract boundary, or a suspected coupling. Any
  change to `types.ts`, `README.md` or `DOCS.md` is a FLAG, never yours to make
  — those are the Phase-0 contract and need human approval. Report it; do not
  resolve it.
