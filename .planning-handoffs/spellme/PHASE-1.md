<!-- cspell:ignore spellme lookaheads tokenizer -->

# Phase 1 — `lib/scanning`, then `spellme`

**Phase 0 is closed and committed. Phase 1 has not started.** This document is
the resumption point; the canon is the in-repo READMEs and DOCS.md sketches, and
this file deliberately does not restate them.

## Where things stand

**This campaign's commits — a SHA LIST, never a range.**

| SHA        | What                                                            |
| ---------- | --------------------------------------------------------------- |
| `a38cc03f` | the user twin gets its name (DEV.md)                            |
| `9eea31a3` | the user twin is named for its concern — DEV.md, the `ux/` name |
| `349d2f99` | `lib/scanning` Phase 0                                          |
| `80306ad9` | `spellme` Phase 0 — cites `bnd-009`                             |

⚠ **Foreign commits interleave those four**, one of them landing _between_
`9eea31a3` and `349d2f99`. **Do not trust a count here — recompute it**, because
it moves within minutes: `git rev-list --count 6d1a811f..HEAD` minus this
campaign's own commits. It read 13 total / 9 foreign when this document was
written and 17 / 13 about two hours later, with HEAD moving three times during a
single cold read of this file. `baseline..HEAD` has never been this changeset.
AR-5 takes the SHA list above plus whatever Phase 1 adds.

**Gates at the close of Phase 0** [all measured 2026-08-14]: `npx tsc --noEmit`
0 errors · 148 tests, 145 skipped and 3 passing · cspell 0 · prettier clean ·
markdownlint 0 · `npm run check:governance` 0 errors and 62 advisories.

**The shared worktree is real.** A peer session held nine `.planning-handoffs`
files staged while these commits landed. Commit by explicit pathspec in one
shell invocation, with `--no-verify`; never unstage a peer's files.

## What Phase 1 is

Un-skip one test at a time, in ZOMBIES order, implementing until it passes.
`lib/scanning` first and completely — its `types.ts` is a type edge into
spellme's, so the two serialize.

**The suites are already written and committed skipped.** Nothing needs
designing. `it.skip` is the marker; delete five characters, go red, implement,
refactor against the DOCS.md sketch, move on. `git grep -c "it.skip"` per file
is an honest burn-down.

**The stubs to replace:**

- `src/lib/study-lenses/lib/scanning/derive-input-elements.ts` — one exported
  function, currently throwing. In-file hoisted helpers, no new files: the fold,
  the naming and the gap split each have one call site.
- `src/lib/study-lenses/lenses/spellme/core.ts` — eight functions, all throwing.
- `src/lib/study-lenses/lenses/spellme/index.tsx` — the component throws; the
  frozen lens object is real and its three tests already pass.

**`lib/scanning` cluster order** (file order is ZOMBIES order): Zero · One ·
Many · Boundaries–tiling · The vocabulary · Template folding · Right-brace
disambiguation · Trivia · Comments and the hashbang · Interfaces–frozen, pure
and deterministic · Exceptions · Simple–the recorded departures. 63 tests.

The first un-skip is `Zero/returns nothing for an empty source`, at
`tests/derive-input-elements.test.ts`; the file to edit is
`derive-input-elements.ts`, whose whole body is currently a throw.

Fake It is legitimate there and **expires at `One`**. DEV.md § Phase 1 says Fake
It expires when the next test is _written_, and here every test is already
written — the reconciliation is DEV.md § Phase 0's own argument that
tests-committed-skipped was chosen **over** a live red suite precisely because a
live suite "would expire Fake It immediately". Under committed-skipped,
"written" means "un-skipped". Cited here so the apparent contradiction does not
cost the next reader a hunt.

**Five phases, three named helpers, and that is deliberate.** § What lives here
names the fold, the naming and the gap split. The sketch's phase 1 (_Confirm the
reading_) is a guard clause and phase 4 (_Interleave the set-aside_) is a merge
— both stay inline in the export rather than becoming named helpers. The
Refactor step is held against the **phases**, not against a helper list.

## ⚠ Two questions for the human before the first increment

### 1. AR-3 fires per un-skip. That is **145 invocations**. Is that accepted?

**The governance is not ambiguous here, and an earlier draft of this handoff
wrongly presented it as a tie.** Three statements, all saying per-un-skip:

- DEV.md § Phase 0 — "Phase 1 un-skips **one at a time**, in ZOMBIES order, and
  **AR-3 fires on each un-skip**".
- DEV.md § Phase 1 — "exactly one test goes red per increment, **and AR-3 fires
  on it**".
- DEV.md § AR-3 **Trigger** — "After the first failing test is written for an
  increment — **which, under tests-committed-skipped, is each un-skip.**" That
  clause was written for exactly this situation.

145 tests are skipped across the two modules [measured 2026-08-14: 148 total, 3
already passing], so the literal reading is **145 AR-3 invocations**.

**So the question is not "which reading?" — it is "do you want to reduce
ceremony?"** That is legitimate, it is yours alone, and it has exactly two
sanctioned forms: lower the campaign's level, or issue a per-review opt-out.
`ceremony: full` is currently recorded on all three Phase-0 commits.

**The agent must not answer this by preferring the cheaper reading.** If it goes
unanswered, AR-3 fires per un-skip. Note for honesty that `AGENTS.principal.md`
(**not** DEV.md) § Orchestrated delegation describes a worker as owning "one
complete triangulated unit (a function + its ZOMBIES cluster), running the full
cycle (ZOMBIES → `ar-3` → implement → refactor → `ar-4`)" — that is a compressed
label for the cycle a worker owns, not a count of firings, and reading it as a
count is how the earlier draft went wrong.

### 2. Solo, or fan out?

`AGENTS.principal.md` § Orchestrated delegation: "After Phase 0, absent explicit
human prompting, a session fans out … The human may override to synchronous."
**No override is recorded**, so the default is fan-out and a solo session is the
thing needing permission, not the other way round.

What the DAG allows: `lib/scanning` is one public export and does not decompose
— it is one worker. `spellme`'s `core.ts` carries eight functions, most of which
are independent of each other once `types.ts` is fixed. `lib/scanning` must
finish before `spellme` starts, because its `types.ts` is a type edge.

## Traps, each of which has already cost something

- **The test helper must mirror `embody/derive-tokens.ts`** — `acorn.tokenizer`
  with `ecmaVersion: 2024`, `onComment`, `ranges: true`. **Not** classifying's
  `acorn.parse` + `onToken` helper: that runs at 2022 and refuses every program
  that lexes but does not parse, which is the case both modules exist to serve.
  The committed suites already do this correctly — do not "fix" them toward the
  sibling.
- **The generator form of `tokenizer` emits no `eof` token.** Classifying has an
  `eof` guard; copying it here is dead code.
- **`loc` is always `undefined`** — embody passes `ranges: true`, not
  `locations: true`. Anything reading `.loc` is dead code.
- **Never read `token.value`.** It is absent from acorn's `.d.ts` and is an
  _object_ for a regular-expression token. Source-slice authority is not
  stylistic here.
- **Do not deep-freeze anything holding a parser token.** The published contract
  is token _indices_ precisely so the freeze stays inside this module.
- **Copy `lenses/parsons/core.ts`'s `config()`, never `writeme`'s.** writeme
  spreads overrides bare with no `undefined` filter and violates the kind
  contract's absent-key rule.
- **Plant no new `PINNED(` markers.** `pinned-guard.py` exists in
  `.claude/hooks/` but is **not registered** in `.claude/settings.json`
  [measured 2026-08-14: `grep -c pinned-guard .claude/settings.json` → 0]. Ship
  the assertion; plant the marker when the guard is re-armed.
- **`eslint` always errors on a `.md` file in this repo** —
  `classifying/README.md` reproduces it identically. `.md` routes to
  markdownlint. Do not chase it.
- **`markdownlint-cli2` with a bare file argument treats it as a glob** and
  lints nothing. The per-file form is `--no-globs "<file>"`.
- **Never run `eslint --fix`.** Read a peer's import block and match it by hand.
- **A settings line and a `(human ruling …)` parenthetical both wrap.** Prettier
  breaks them mid-line, so any single-line grep of either counts too few; run
  `tr '\n' ' '` over the file first.
- **cspell set-diffs go vacuous out of tree** — a baseline copy in a scratchpad
  reports zero words checked. Test each flagged word against
  `git show HEAD:<file>` instead.
- **`node scripts/repo-facts.mjs` caches its markdownlint number for 24 hours.**
  Every other line is fresh; that one may be stamped yesterday. Re-run
  `npm run lint:md` if the number matters.
- **Node is BELOW the engines minimum** — v20.11.0 against `>=22.11.0`, which
  repo-facts reports on its second line. `tsc` and `vitest` both run anyway and
  the whole of Phase 0 was built under it. Proceed; do not treat it as a blocker
  and do not silently upgrade anything.
- **`git grep -c "it.skip"` unscoped also matches `scanning/README.md`.** Scope
  it to the test file.

## Model and ceremony

`ceremony: full` for this campaign (human, 2026-08-14). Phase 1 is mechanical
Red→Green→Refactor over pre-written tests, so a cheaper session tier is
defensible — **and naming the cost is required**: `ar-3` and `ar-4` are pinned
to sonnet in their frontmatter either way, but `ar-5` inherits the session
model, so a downgrade means the pre-merge review runs at the downgraded tier.
Never pass a `model` parameter when spawning an `ar-N`.

## Gates the human holds

- The Phase-1 → Phase-2 boundary.
- `ar-5`, scoped by the SHA list above plus Phase 1's own commits.
- **The push, and it is far larger than this campaign.** `main` has **no
  upstream configured** [measured 2026-08-14: `git rev-parse --abbrev-ref
  main@{upstream}` → "fatal: no upstream configured"], and `origin/main..HEAD`
  is **81 commits**. Four of them are this campaign's. Do not present the push
  as "four commits" — whoever holds that gate is deciding about eighty-one, most
  of them other sessions' work.

## Deferred, and recorded elsewhere

- **Folding `scanning` and `classifying` into embody** —
  [`../embody-derivation-facts/BRIEF.md`](../embody-derivation-facts/BRIEF.md).
  Happens after `lib/scanning` is green, not before.
- **Five measured embody defects** — [`EMBODY-FLAGS.md`](./EMBODY-FLAGS.md).
  None blocks this campaign and none is this campaign's to fix.
- **The fall's motion design and its reduced-motion equivalent** — a sandbox
  checkpoint against a running surface, per `spellme/DOCS.md` § Out of scope.
- **Registering `spellme` in the composition root is NOT Phase 1's job.**
  `orchestrate/lib/composing/built-in-lenses.ts` imports parsons and writeme and
  knows nothing of spellme [measured 2026-08-14: spellme appears in no file
  outside its own directory except `lib/scanning/README.md`]. A lens nobody can
  reach is not a defect at this stage — the lens object exists and is frozen,
  and wiring it up is a Phase-2 concern once there is something to mount. Do not
  add the import on the way past; it would put an unimplemented component in
  front of a learner.
