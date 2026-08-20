<!-- cspell:ignore spellme tdd worktrees -->

# `tdd-worker` launch brief — the `spellme` LENS, Phase 1, Wave 1

⚠ **Read this paragraph before anything else.** Two files sit beside this one
with confusingly similar names — `./WAVE-1-BRIEF.md` and `./WAVE-2-BRIEF.md`.
**They are `lib/scanning`'s waves, they are CLOSED, and they are not yours.**
That module finished Phase 1 at 78/78. This brief is for a **different module**:
the `spellme` lens at `src/lib/study-lenses/lenses/spellme/`. When this brief
says "wave 2" it means **spellme's** wave 2, defined in § The wave map below and
nowhere else.

**Scope: the three function-clusters that depend on nothing else in this
module** — `config`, `applicability`, `recommend`. Seventeen un-skips in
`tests/core.test.ts` plus one **new** test file carrying two tests.

You are one worker in an orchestrated campaign. An orchestrator holds the spine,
reads the seam after you, and owns `ar-5`. You own this brief's clusters and
nothing else.

⚠ **This wave was planned as three parallel workers and does not run that way.**
A wave-0 probe measured that `isolation: "worktree"` cuts worktrees from
`origin/main` = `cf0316bd` (2026-08-11), **316 commits behind local `main`**,
and `spellme` does not exist there at all [measured 2026-08-20: `git ls-tree -d
--name-only origin/main src/lib/study-lenses/lenses/` → `debug-props lib parsons
writeme`]. So you run **serially, in the main checkout**, and you own all three
clusters. Nothing else about the wave changed.

## The wave map — spellme's `core.ts`, all five waves

`core.ts` holds eight functions.

⚠ **SUPERSEDED 2026-08-20 — the canonical map is now
[`./PHASE1-WAVE-2-BRIEF.md`](./PHASE1-WAVE-2-BRIEF.md) § The wave map.** The
human re-ordered waves 2-5 after measurement showed only **5** of the 28
component tests drive the claim loop: `positionCursor` moved forward into wave
2, and the static surface plus its 🔍 sandbox checkpoint moved up to wave 3, so
an eyeball check arrives after 15 core tests rather than 37. **Wave 1's own
scope, below and throughout this file, is unaffected and closed.** The table
that follows is kept as the shape wave 1 was launched under.

| Wave          | Cluster                                      | Owns                                                                       |
| ------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| **1 — YOURS** | `config` · `applicability` · `recommend`     | the three functions with no dependency on the element stream               |
| **2**         | `readStream`                                 | the spine — 37 of 54 core tests route through it via the `streamOf` helper |
| **3**         | `positionCursor` · `judgeClaim` · `handOver` | consume wave 2's committed stream                                          |
| **4**         | `settle`                                     | consumes `judgeClaim`'s `ClaimVerdicts`                                    |
| **5**         | `index.tsx`, the React surface               | all 28 `component.test.tsx` skips; runs in the orchestrator, not a worker  |

**Waves 2-5 did not exist as documents when this brief was written.** Wave 2's
now does — [`./PHASE1-WAVE-2-BRIEF.md`](./PHASE1-WAVE-2-BRIEF.md) — and it
carries the current map.

## First act — governance, before anything else

Read the repo-root `CLAUDE.md` router. Check your own model id against its
qualifying list and read whichever governance file it selects, **END TO END**.
Then `DEV.md` § Incremental Development Workflow (**including Phase 1 step 7b,
patch-or-reroll, and step 14** — this brief's § Your cycle compresses them and
compression is not permission to skip), § Adversarial Review Protocol, §
Shared-worktree git mechanics, § Sourced claims, § No Comments in Tests, §
Dependency-order coverage.

Router-text reach into a spawned worker has been measured both present
(2026-07-29) and absent (2026-07-28); the explicit read is the contract. **Do
not skip this because this brief summarizes some of it.**

## Then read the module canon, end to end, never in split ranges

- `src/lib/study-lenses/lenses/spellme/README.md` — the claim contract, the
  vocabulary, the rulings. § The lens object and § Configuration are yours.
- `src/lib/study-lenses/lenses/spellme/DOCS.md` — **this is what your Refactor
  step is held against.** Execution phases 1 and 2 are yours.
- `src/lib/study-lenses/lenses/spellme/types.ts` — the domain model.
  `SpellmeLensConfig` is the canonical statement of your two fields.
- `src/lib/study-lenses/lenses/spellme/core.ts` — the file you edit. Eight
  stubs, all throwing; you implement three of them.
- `src/lib/study-lenses/lenses/spellme/tests/core.test.ts` — read the whole
  file, not only your blocks, so you know what you must not break.
- **`.planning-handoffs/spellme/PHASE-1.md`** — §§ Where things stand, Rulings
  of record, Traps. **Five rulings this brief restates live only there**, and
  under `DEV.md` § Sourced claims you need the path to cite them as `[read:]`
  rather than the weaker `[relayed:]`. Its § Traps also carries live material —
  notably that `Object.isFrozen(undefined)` returns `true`, so a freeze
  assertion reaching through an index can pass vacuously. That bears directly on
  `:350` and `:386`.
- `src/lib/study-lenses/lenses/parsons/core.ts` — **your `config` and
  `recommend` precedent. Copy its shape.**
- `src/lib/study-lenses/embody/tests/derive-tokens-defect.test.ts` — the
  precedent for the new file you write.

## Measured baselines — the debt that is NOT yours

| Fact                                                            | Value                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| HEAD at brief time                                              | `1478049f36ef564d581d20af9ce1c06af1505863` [measured 2026-08-20: `git rev-parse HEAD`]                                    |
| spellme working tree                                            | **clean** [measured: `git status --porcelain -- src/lib/study-lenses/lenses/spellme/` → empty]                            |
| spellme suite                                                   | `3 passed \| 82 skipped (85)`; `core.test.ts` 54 skipped, `component.test.tsx` 28 skipped                                 |
| `npx tsc --noEmit`                                              | **0 errors**                                                                                                              |
| `npx prettier --check` on both spellme test paths and `core.ts` | **clean** — you will introduce the first drift                                                                            |
| Node                                                            | **v20.11.0 against engines `>=22.11.0` — BELOW the minimum.** tsc and vitest run anyway. Proceed; do not upgrade anything |
| unpushed                                                        | `origin/main..HEAD` = 316. Not yours. Never push                                                                          |

**Failing-test baseline — repo-wide, all foreign.** Eight test files fail at
HEAD; `41 failed | 9834 passed | 137 skipped | 17 todo (10029)` [measured
2026-08-20: `npx vitest run --project unit --reporter=basic`]:

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

**None is in `spellme`.** Your gate is **your own directory green plus zero NEW
failures outside that list** — never whole-repo green. Run the scoped command:

```text
npx vitest run --project unit src/lib/study-lenses/lenses/spellme
```

⚠ The first path is **untracked peer work in flight**
(`?? scripts/lib/check-tables/`). It may vanish or change under you. Re-measure
rather than trusting this list.

**The shared worktree is real.** A peer session currently holds four
`.planning-handoffs/` files modified. Never unstage a peer's files.

## Commit form — verbatim, non-negotiable

One shell invocation, explicit pathspec, `--no-verify`:

```text
git add <your explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

- One invocation so a peer's `git add` cannot interleave.
- **The pathspec is the protection, not a clean index.** Peers hold files staged
  continuously; expect that. A pathspec-less `git commit` is **denied by a
  hook**, not merely discouraged.
- `--no-verify` because lint-staged runs over the whole staged set, not your
  pathspec. **What `--no-verify` costs you is prettier** — the hook is the only
  thing that would have run it. Run it yourself; see § Your cycle step 4.
- On `index.lock` contention, wait and retry.
- **Never push, never branch, never amend, never `git checkout -- <file>`.**
- **Announce each commit as it lands: full SHA + message.**

**Your three allowed paths, and nothing else:**

```text
src/lib/study-lenses/lenses/spellme/core.ts
src/lib/study-lenses/lenses/spellme/tests/core.test.ts
src/lib/study-lenses/lenses/spellme/tests/core-defect.test.ts
```

Anything else is a **FLAG**. In particular `README.md`, `DOCS.md` and `types.ts`
are the Phase-0 contract — **never yours to edit**.

**Commit granularity: one commit per increment, i.e. per red event.** Tests that
arrive green fold into the open increment with a one-line record each. Cluster 1
is therefore roughly four or five commits, not eleven.

**Settings line in every commit body, verbatim:**

```text
work: software · twin-doc: user · ceremony: full (AR-3 opted out by human, 2026-08-14) · prospective
```

⚠ DEV.md's own example shows `ceremony: full (AR-3 n/a)`. **Ours deliberately
differs** — an opt-out is not an n/a. Do not "correct" it toward DEV.md.

Every repo-state claim in a body carries `[measured: <command>]`,
`[read: <file> § <heading> — "<quoted>"]` or `[relayed: <who>]`. **A body is
immutable once written; amend is forbidden.** Measure the numbers in the same
turn you write the body.

## Ceremony — the human's, not yours

`ceremony: full` (human, 2026-08-14, re-confirmed 2026-08-20).

- **AR-3 is opted out for un-skips** (human ruling 2026-08-14, `PHASE-1.md` §
  Rulings of record). Do not spawn `ar-3`. **You may not extend the opt-out to
  AR-4.**
- **`ar-4` fires per increment** — after self-review, before commit. Spawn the
  registered `ar-4` **by name**. It has been measured spawning and returning
  successfully from a worker context [measured 2026-08-20]; genuinely attempt
  it. **Provide it:** `core.ts`, the relevant test file, `types.ts`, the peer
  `DOCS.md` (including its Mermaid `## Data flow` diagram), and
  `src/lib/utils/clone-and-freeze.ts` / `freeze-in-place.ts` as the utilities in
  play. Pass **file paths, never pasted contents**.
- **If `ar-4` will not spawn**, take `tdd-worker.md`'s documented fallback:
  pause at the trigger and report the reviewer's input paths, and the
  orchestrator dispatches the review and resumes you. That is a BLOCKED report,
  not permission to commit. **Never commit an increment whose `ar-4` has not
  returned.**
- **`ar-5` is the orchestrator's. Do not spawn it.** It fires at your wave
  boundary. If you reach your exit gate and no orchestrator has acknowledged
  your SHA list, report **FLAG** in your final message — that message is the
  channel; there is no other.
- **Never pass a `model` parameter** when spawning a reviewer — the frontmatter
  pins govern.
- Carry **"strictly read-only — no writes, moves, or deletes"** in every review
  prompt. AR agents hold Bash and can delete files.
- **No 🔍 sandbox checkpoint in this wave**, declared explicitly: these three
  clusters are pure functions with no user-observable surface. The component is
  wave 5's and runs in the orchestrator.
- Verdicts: PROCEED → commit. CONSIDER → document your response in the commit
  body, then continue; do not silently accept. PAUSE → **report BLOCKED with the
  reviewer's concerns verbatim.**

## Your cycle

**An increment contains exactly one red test.** That is DEV.md § Phase 1 step 5
unamended, and it is a boundary rule, not a prediction (human ruling 2026-08-15,
`PHASE-1.md` § Rulings of record).

1. Un-skip **one** test — delete the five characters `.skip`.
2. Run the scoped suite. **Red** → implement until green. **Green on arrival** →
   it rides into the currently open increment with a one-line record in the body
   of what it would have caught; do not open a new increment for it.
3. Implement. Fake It is legitimate only where its killer is the very next
   un-skip (see § Un-skip order). **DEV.md step 7b (patch-or-reroll) applies** —
   if the implementation is fighting you, discard it and re-implement fresh
   rather than patching.
4. **Format and lint, in this order:** `npx prettier --write <file>`, then
   `npx eslint <file>`, then `npx cspell <file>`.
5. Refactor against `DOCS.md`'s § Execution phases — named phases present and
   distinct, no surviving Fake It values.
6. Self-review against the governance file's two checklists.
7. Spawn `ar-4`.
8. Quality checks: scoped suite, `npx tsc --noEmit`, `npx prettier --check` on
   your paths.
9. Commit by pathspec. Announce the full SHA.

## Ground truth — measured, do not re-derive

- `LensConfig` is `Readonly<Record<string, SerializableValue>>` — an **open**
  shape. `config({ future: 'value' }).future` must be `'value'`.
- `facts.tokens` is `StageSuccess<Tokens> | StageFailure`, discriminated on the
  literal `ok`. `facts.tokens.value.inputElements` is
  `ReadonlyArray<InputElement> | undefined` — **optional**.
- Measured at the repo's own `ecmaVersion: 2024`, `sourceType: 'module'`:
  `embody('const x = 1')` → tokens **ok**, 4 tokens, member present.
  `embody('const x = ')` → lexes but does not parse → tokens **ok**, 3 tokens.
  `embody('const x = "')` → `SyntaxError: Unterminated string constant` → tokens
  **not ok**.
- On a leaf defect `deriveTokens` returns
  `{ ok: true, value: { tokens, comments } }` — ok, **without** the member — and
  `console.error`s once [`embody/derive-tokens.ts:79-84`].
- **Import specifiers you will need**, none of which you should guess:
  `@utils/clone-and-freeze.js` · `@utils/freeze-in-place.js` ·
  `'../../../embody/index.js'` (from `tests/`, as `core.test.ts:5` does).

## Traps, each of which has already cost something

1. **Copy `lenses/parsons/core.ts`'s `config()`, NEVER `writeme`'s.** writeme
   spreads overrides bare with no `undefined` filter and violates the kind
   contract's absent-key rule. parsons filters `!== undefined` **before** the
   spread, and returns `cloneAndFreeze<LensConfig>({ …defaults, ...defined })`.
   **Take its signature too** — `config(overrides: Partial<LensConfig> = {})`,
   not the stub's `_overrides?:`. ⚠ **Do NOT narrow the parameter to
   `Partial<SpellmeLensConfig>`** — it would break `core.test.ts:347`
   (`{ future: 'value' }`). And note `component.test.tsx:16` reads
   `Parameters<typeof spellmeCore.config>[0]` and is **outside your pathspec**;
   both the `= {}` and `?:` forms keep it compiling, a narrowed one does not.
2. **`cloneAndFreeze`, not `freezeInPlace`.** `core.test.ts:354-358` asserts the
   caller's overrides object is **not** frozen as a side effect.
3. **`recommend` must return a stable reference** — `:390` asserts
   `recommend() === recommend()`. parsons uses a module-level
   `const EMPTY_RECOMMENDATIONS = freezeInPlace<ReadonlyArray<Recommendation>>([]);`
   declared **after** the function. There is no shared constant to import; each
   lens declares its own.
4. **No sibling `config()` throws.** ⚠ **SUPERSEDED 2026-08-20 — the class is
   now `RangeError`, not `TypeError`** (human ruling; recorded in
   `lenses/spellme/README.md` § Configuration, which is its home). Two further
   corrections to what this item said: a precedent DOES exist —
   `lib/engine/worker/write-call-response.ts` carries `@throws RangeError` for a
   numeric-limit violation — and it was true only of sibling _lens_ config
   factories. The rest of the item still holds. The refusal on negative,
   fractional and non-finite thresholds was new code for this module. Validate
   **after** the `undefined` filter and **before** the freeze. **Scope it
   exactly:** the two documented keys `oneMoreAfter` and `skipAfter`, and only
   the three refusals README § Configuration names — negative, fractional,
   non-finite. A **non-numeric** value for either key is covered by no test and
   no document; do not invent a rule for it — if you think one is needed,
   **FLAG** it. `switch` is banned, so use an if-chain or a lookup.
5. **`applicability`'s second condition is asserted by no committed test.**
   `return facts.tokens.ok` alone passes all three of `:366` `:370` `:374`
   [independently re-measured 2026-08-20]. The presence-gate (human ruling
   2026-08-19) is pinned **only** by the new file you write — which is why the
   un-skip order below writes that file FIRST. Do not conclude from a green
   suite that you have implemented the contract.
6. **The new file's mock path is `../../../lib/scanning/…`, NOT `../../`.** The
   precedent's specifier is correct from `embody/tests/` and **wrong** from
   `lenses/spellme/tests/` — and `src/lib/study-lenses/lenses/lib/` **exists**
   (it holds `js-keywords.ts` and `snippet-free-autocomplete.ts`, but no
   `scanning/`), so the wrong path is a plausible-looking directory rather than
   an obvious error. This is the single highest-probability failure in this
   wave.
7. **`git grep -c "it.skip"` is a regex — the `.` matches any character.** Use
   `git grep -cF "it.skip("`. (On `core.test.ts` both forms happen to return 54;
   repo-wide the regex hits 13 files against the literal's 4. The caution is
   real even though this file does not demonstrate it.)
8. **`grep` without `-E` on an `a|b` pattern is VACUOUS** — it searches for the
   literal string and returns 0 on every file. Control-test any absence claim
   against a file you know contains the thing.
9. **Prettier reformats `.ts` too**, and it will re-wrap a long JSDoc line. Run
   `--write` **before** you grep your own citations, never after.
10. **A JSDoc line-wrap defeats `grep "the phrase"`** in `.ts` — the `*`
    continuation breaks it. Use `perl -0777 -ne '/the[\s*]+phrase/'`.
11. **Never run `eslint --fix`**, and never run eslint on a `.md` file — it
    always errors here and is not a finding.
12. **Dates: the repo runs on local date.** Today is **2026-08-20**.

## Lint constraints that will bite this file

- `@typescript-eslint/no-non-null-assertion` is **`error`** over
  `src/lib/study-lenses/**` [eslint.config.mjs:490, 512]. `!` is barred.
- `local/newspaper-order` is `error` [:513]: imports → main → consts → helpers.
- **`switch` is banned** — `no-restricted-syntax`, selector `SwitchStatement`
  [eslint.config.mjs:407-409]. Use lookup objects or if-chains.
- `@typescript-eslint/no-explicit-any`, `no-unsafe-*` and
  `restrict-template-expressions` are all `error` in this zone.
- Every `eslint-disable` needs a `-- reason`, and unused disables are an error.
- `noUncheckedIndexedAccess` is **NOT** enabled (only `strict` +
  `exactOptionalPropertyTypes`), so an index access types as non-`undefined`. Do
  not invent guards the sketch does not have.
- **`DEV.md` § No Comments in Tests.** The new file's header comment is
  sanctioned by precedent — `derive-tokens-defect.test.ts:5-7` carries exactly
  such a header, **above the `vi.mock` and outside any test body**. Put yours in
  the same place. No comments inside test bodies.

## Un-skip order — take them in exactly this order

**Cluster 1 — `config`** (11 un-skips): `:328` `:332` `:336` `:340` `:346`
`:350` `:354` `:360`, then the `Exceptions` block `:396` `:400` `:406`.

- Fake It at `:328` is legitimate; its killer `:332` is the very next un-skip.
- `:332` `:340` `:346` `:350` `:354` `:360` may well arrive **green** once the
  parsons-shaped factory is in. Let them ride, with a one-line record each.
- `:396` `:400` `:406` are the three refusals and are genuinely new behavior.
- ⚠ Taking `Exceptions` here rather than at its file position moves it past the
  `applicability` and `recommend` blocks. Those blocks are **unlettered**, so
  ZOMBIES order survives — the same argument the `Boundaries — tiling` ruling
  used for `lib/scanning` (`PHASE-1.md` § Rulings of record). Record that
  sentence in the commit body so `ar-5` does not have to ask.

**Cluster 2 — `applicability`. Write the NEW FILE FIRST, then un-skip.**

This inversion is deliberate and load-bearing. If you un-skip `:366 :370 :374`
first, the only implementation they force is `return facts.tokens.ok` — and
committing that would put a **one-condition** gate in a file whose own JSDoc
(`core.ts:41`), README § The lens object and `DOCS.md` execution phase 2 all
state **two** conditions. `ar-4`'s first check is "implementation matches the
DOCS.md sketch", so that commit would likely draw a PAUSE caused purely by
ordering. Writing the defect test first makes the **full** contract the thing
the first red drives.

1. **Create `src/lib/study-lenses/lenses/spellme/tests/core-defect.test.ts`.**
   `.ts`, no jsdom pragma, no `cspell:ignore` line needed (`spellme` is already
   in `cspell.json`). Mirror `embody/tests/derive-tokens-defect.test.ts`: a
   hoisted file-scoped `vi.mock` of
   `'../../../lib/scanning/derive-input-elements.js'` whose factory's `default`
   throws, plus `afterEach(() => { vi.restoreAllMocks(); })`.
2. **Test 1 — the canary.** Assert that `embody('let x = 1').facts.tokens`
   publishes `ok` with the member undefined. The precedent's spelling, adapted:
   `expect(stage.ok && stage.value.inputElements).toBeUndefined()`. This proves
   the mock survives the three-hop reach `embody()` → `deriveFacts` →
   `deriveTokens` → the leaf, which the precedent does **not** prove (it calls
   `deriveTokens` directly). **It will arrive green** — it characterizes embody,
   not spellme. It is the file's failure oracle: if the mock ever stops biting,
   this fails first with an unambiguous message.
3. **Test 2 — the obligation, and this wave's red driver for `applicability`.**
   `expect(spellmeCore.applicability(embody('let x = 1').facts)).toBe(false)`.
   Test 1 rides into this increment.
4. **Then un-skip `:366` `:370` `:374`.** Under the full two-condition gate all
   three should arrive **green**; let them ride with a one-line record each.
5. **The header must carry the narrow-and-explicit justification.** `DEV.md` §
   Dependency-order coverage calls `vi.mock` of an internal sibling a code
   smell. The exception is earned by the leaf's coverage being complete (78/78)
   and the mock being the only constructor for a type-admitted state no input
   reaches. Without that sentence an AR reads the file as the anti-pattern.
6. **Silence the console.** Every `embody()` call here drives `deriveTokens`'s
   catch, which `console.error`s. Install a file-level no-op spy.
7. **No in-file healthy control is possible** — the file is mock-poisoned. Say
   so in the header and name `core.test.ts`'s `applicability` block as the
   pairing.

⚠ **Do NOT write a `readStream` precondition-throw test.** The obligation is
real and recorded, but **no document pins the throw's class** — `TypeError`
appears nowhere in spellme's README, DOCS or types, and `readStream` carries no
`@throws` tag at all. Asserting a class would manufacture a contract, and
asserting a bare `.toThrow()` passes vacuously against the current stub's own
"not implemented" throw. **Report it as a FLAG instead**, in these words or
close to them: _"wave 2 owes a `readStream` precondition-throw test in the
mock-poisoned state; the throw's class is unspecified in the Phase-0 artifacts
and needs a human ruling before the test can be written."_

> ✅ **The instruction above was correct and was followed** — the wave-1 worker
> raised exactly this FLAG and wrote no test. Its load-bearing fact is **still
> true today**: `readStream` carries no `@throws` tag at all — grep the
> `readStream` JSDoc in `core.ts` and confirm it yourself. Its other fact — that
> `TypeError` appears nowhere in this module — **has since been falsified by the
> fix that landed the `RangeError` ruling**: `README.md` § Configuration now
> names `TypeError` once, only to say the config refusal is _not_ one. Nothing
> pins `readStream`'s class either way.
>
> ⚠ **The class is NOT settled for `readStream`. Wave 2 must not assume it is.**
> The 2026-08-20 ruling was put as a question about `readStream`'s throw class,
> and the answer chosen was "`RangeError` — and revisit `config` too". But
> `ed76f43b`'s body recorded only the `config` half, and an AR-5 reading that
> body reasonably concluded the ruling had never reached `readStream`. **That
> under-recording is the defect**, it cannot be fixed in an immutable body, and
> this block is where it is corrected.
>
> **The reviewer also raised a substantive objection, and it should be settled
> before the assertion is written:** by the ruling's own distinction —
> `TypeError` is the wrong KIND of value, `RangeError` is the right kind
> carrying a wrong one — an **absent** published member is a wrong-kind case, so
> `RangeError` may be affirmatively wrong here even though it is right for an
> out-of-range threshold. The two throws are not obviously the same species.
>
> **Wave 2 owes the test, and owes putting that objection to the human first.**
> Do not spell it `.toThrow(RangeError)` on the strength of this block.

**Cluster 3 — `recommend`** (3 un-skips). `:382` `:386` `:390`.

- Fake It at `:382` is legitimate; `:386` is the next un-skip and kills it.
- ⚠ `PHASE-1.md` § Traps: `Object.isFrozen(undefined)` returns `true`. Make sure
  `:386` is asserting frozen-ness of something that exists.

⚠ **Every other `it.skip` in `core.test.ts` belongs to another wave. Do not
touch them** — not `Zero`, not `One`, not `Many`, not the fates, verdicts,
one-more, gate or way-past blocks. A block you did not open is not yours because
you happened to read it.

## Your exit gate

Report DONE only when all of these hold, each shown with its command output:

1. `npx vitest run --project unit src/lib/study-lenses/lenses/spellme` prints a
   **single combined summary** across all three files. Expect
   `22 passed | 65 skipped (87)` — 3 already-passing component tests + your 17
   un-skips + the new file's 2. **Verify by running it, not by matching this
   arithmetic**; if the numbers differ, reconcile before reporting DONE.
2. `npx tsc --noEmit` → 0 errors.
3. No new failing file outside the eight-path baseline above.
4. `npx prettier --check`, `npx eslint` and `npx cspell` clean on all three of
   your paths.
5. `npm run check:governance` → **0 errors** (advisories are not failures; the
   Phase-0 close recorded 62 of them).
6. `config` reflects `DOCS.md` execution phase 1 and `applicability` phase 2 —
   as **phases**, not as a helper count.
7. Every increment has an `ar-4` verdict, and every CONSIDER has a documented
   response in its commit body.
8. Your full SHA list, in order, with messages.
9. Your FLAG about wave 2's precondition-throw test.

## Report DONE | BLOCKED | FLAG — no fourth channel

- **DONE** = verified AND committed. Green-but-unverified is BLOCKED.
- **BLOCKED** = you cannot finish, or an `ar-4` returned PAUSE, or `ar-4` will
  not spawn. If you are running long on context, report BLOCKED **at a committed
  increment boundary** — never mid-triangulation — and the orchestrator launches
  a successor from there. Include: the increment and its driver, your exact
  pathspec, the spec paths for the reviewer, the commit body you drafted
  **verbatim**, the green-arrival records, and the three vitest summary lines
  plus tsc. Your context is not a safe place to keep any of them.
- **FLAG** = an inter-file contract boundary, or a suspected coupling. Any
  change to `types.ts`, `README.md` or `DOCS.md` is a FLAG, never yours to make.
  **The `readStream` throw-class question is a known, expected FLAG** — report
  it and move on.
