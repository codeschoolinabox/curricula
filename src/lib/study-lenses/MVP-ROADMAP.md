<!-- cspell:ignore cutover unported socratizing socratize quizzing -->
<!-- cspell:ignore reenrichment unbuilt -->
<!-- TRANSITIONAL — delete when the greenfield migration completes. Not a permanent region doc; README.md and DOCS.md own the end state. -->

# study-lenses — road to a learner

**Measured 2026-08-03 against HEAD `66ccb76c`.** Every claim below is a
measurement, not a memory. Re-measure with `node scripts/repo-facts.mjs` and the
commands in § Re-measuring before trusting any line of it.

This file exists because the tree-wide `ROADMAP.md` was deleted at `0fca239e`
and the only surviving strategy doc — `lenses/MIGRATION-PLAYBOOK.md` — covers
`lenses/` alone. `README.md` and `DOCS.md` deliberately cannot carry this
content: they describe what the package IS, never where the work stands.

---

## The one-paragraph situation

The cutover has landed — the Docusaurus site now renders this tree. But **no
learner can reach it yet**, because the active course configures no language, so
no code fence transforms into an instrument. The gap between here and a learner
is a four-line JSON file and some authoring, not more migration.

---

## Where we are

| Capability                       | State                                                                    |
| -------------------------------- | ------------------------------------------------------------------------ |
| Site renders this tree           | ✅ `MDXComponents.js:30` imports `study-lenses/orchestrate` (`32f8935e`) |
| Built-in lenses ship             | ✅ parsons · writeme · debug-props (`47234d7c`)                          |
| A page proving the chain         | ✅ `spiralearn/sandbox/cutover/` (`8bdd69f9`)                            |
| Tests                            | ✅ 3167 passed, 6 skipped, 8 todo — zero failures                        |
| Types                            | ✅ `tsc --noEmit` clean                                                  |
| **Built-in language levels**     | ❌ `built-in-levels.ts` is `[]` at HEAD — **the level UI does not ship** |
| **Any learner-reachable lesson** | ❌ the active course has no `lenses.json`, so zero fences transform      |
| Running a learner's program      | ❌ no `evaluation`-phase lens exists yet                                 |

The two ❌ rows in bold are the whole MVP.

---

## The gap to a learner — in order

### 1. Ship the language levels (the differentiator)

`orchestrate/lib/composing/built-in-levels.ts` is `[]` in the committed tree.
The `[jejLevel]` version exists only as an uncommitted working-tree edit.

This matters more than it looks: **language levels are the only thing this tree
does that the deprecated one could not.** The level selector, fit marks, strict
posture, and the enforcement mask are all built, tested, and green — and none of
them render, because a selector with no registered levels does not appear
(`orchestrate/README.md § What renders`). Until this lands, the cutover bought a
different editor rather than a different pedagogy.

### 2. Configure the active course

`spiralearn/frogramming-and-vibetoading/` has no `lenses.json`. Per
`src/plugins/study-lenses/README.md § Glossary`, only configured languages
trigger fence transformation — so every ` ```js ` fence in the course stays a
static code block.

The fix is one file, four lines, copying
`spiralearn/sandbox/cutover/lenses.json`.

There is already an untracked `js.md` in that course holding one
` ```js:parsons ` fence — a first authoring attempt that is inert purely because
this file is missing.

### 3. Author exercises

The active course is 12 documents and ~9,000 lines of prose with 2 `js` fences
total. `chapters.md` runs Ch0 → Ch4; three exercise pages under Ch0/Ch1 are
enough to call MVP-1 real.

`spiralearn/welcome-to-programming/` holds 613 `.js` exercise files and is a
**legacy draft** — mine it for material, never route it.

**When 1–3 are done, a learner can study code at a level. That is MVP-1.**

---

## Then — running code

No version of this software has ever run a learner's program. The deprecated
tree's Run button returns a frozen `NOT_RUNNABLE_REPORT` on every path
(`--deprecated-architecture/embody/index.ts:482-497`). So this is a **new
capability, not restored parity** — and framing it as parity is what made the
old plan expensive.

Remaining: a `lenses/run/` lens, plus proving the worker plumbing (cross-origin
isolation + a webpack worker chunk — playbook item E2). The evaluator itself
already landed (`c7004203`).

---

## Then — retiring the quarry

Deletion criteria, not shipping criteria. Nothing here blocks a learner:

- The four unported lenses: blanks, annotate, variables/dropdowns.
- The question-register surfaces in the quarry — the quiz lens (`lenses/quiz/`),
  the quizzing engine (`lib/quizzing/`), and the question-orchestrator
  (`lib/question-orchestrator/`): none deletes before its content is ported or
  re-homed (human ruling 2026-08-05/06). Pinned behavioral truth = 42 test files
  across those three dirs (measured 2026-08-11; command in § Re-measuring) — the
  port oracle for the first two, the last surviving spec of three unbuilt
  concepts for the third. Forward canon:
  [SPEC.md](../../../.planning-handoffs/socratize-quiz-reenrichment/SPEC.md)
  (transitional — retire this bullet's first two surfaces with it, when Stages
  3/4/5 land). The orchestrator's carried concepts have a durable in-tree home:
  [lib/questioning/DOCS.md § Carried collateral (unbuilt)](./lib/questioning/DOCS.md#carried-collateral-unbuilt).
  The quarry's other two question surfaces are already free —
  `orchestrate/lib/socratizing/` ported at Stage 2, `lenses/socratize/` re-homed
  as annotated byte-copies.
- The 10 `src/pages/*.tsx` preview pages that import the deprecated tree
  directly, bypassing `MDXComponents`.
- `src/lib/embody/` — a third live tree, cross-importing both others.
- Nine dangling `ROADMAP.md` references outside the quarry — six of them in
  `src/lib/embody/index.ts` alone, plus `eslint.config.mjs:47`. (36 including
  the quarry's own, which die with it.)

---

## Decisions already made — don't re-litigate

- **`frogramming-and-vibetoading/` is the active course.** Everything else is a
  legacy draft.
- **The parity gate is a decommissioning criterion, not a shipping one.** Two of
  its three clauses were void: it required lens-roster equivalence with a site
  serving zero learners, and required replacing a Run button that never ran. Its
  one live clause — selector/strict/mask — is already green.
- **README `## Posture` designations are prioritization only** — no ceremony
  routing, no governance amendment.
- **The 272 files unreachable from the mounted component stay untouched** until
  MVP-1 lands. That includes `orchestrate/generator/` (built and tested, zero
  importers) and `lib/questioning/socratizing/` (43 tracked files, zero code
  consumers).

---

## Open questions

- **The `configs` prop-shape seam.** The plugin emits the whole cascade bundle;
  this tree reads `configs[lensName]` (`orchestrate/types.ts:65`) while the real
  value sits at `configs.lenses[lensName]`. Per-lens config silently arrives
  empty — no crash, no failing test. A public-contract change; needs Phase 0.
- **Built-in roster policy** — which lenses ship by default vs inject-only?
- **E1's scope source** — `buildScope`, `buildNodePathMap`, `ScopeInfo`,
  `ScopeAnalysis` have no greenfield twin. A `types.ts` modelling gap in
  `lib/scoping`, and it blocks the tracer stream.

---

## A lesson worth keeping

`43b40139 fix: drop a foreign in-flight edit that leaked into the prior commit`
is the shared-worktree hazard made real. A pathspec commit takes the whole
working-tree file — it excludes a peer's _other_ files, not their unstaged hunks
in a file you are also editing. Check `git diff --staged --stat` before every
commit here.

---

## Re-measuring

```bash
node scripts/repo-facts.mjs                              # HEAD, tsc, dirty tree
npx vitest run "src/lib/study-lenses/" --reporter=basic  # test state
git show HEAD:src/lib/study-lenses/orchestrate/lib/composing/built-in-levels.ts
ls spiralearn/frogramming-and-vibetoading/lenses.json    # gap 2
npm run build                                            # the cutover still holds
find src/lib/study-lenses--deprecated-architecture/{lenses/quiz,lib/quizzing,lib/question-orchestrator} \
  -name '*.test.*' | wc -l   # → 42 pinned question-register test files; a '*.test.ts' glob returns 41 (one .test.tsx)
```
