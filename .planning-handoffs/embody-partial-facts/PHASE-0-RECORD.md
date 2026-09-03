<!-- cspell:ignore spellme failable unbuilt -->

# embody partial facts — Phase 0 campaign record

Executed 2026-09-01/02 by a Fable session from [`BRIEF.md`](./BRIEF.md). **Phase
0 only; Phase 1 is a separate session and had NOT been approved when this record
was written.** The rulings below are all recorded in the documents they govern
(dated `(human ruling …)` parentheticals in `src/lib/study-lenses/embody/`) —
this record is the campaign narrative, not the rulings' home.

## Rulings taken (all human, live in-session)

| Date       | Ruling                                                                                                                                                                                          | Recorded in                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 2026-09-01 | Consumer = the whole future lens roster ("complete facts"), each publication justified per consumer need                                                                                        | README § Failure grammar; DOCS fact-admission constraint |
| 2026-09-01 | Invented AST admissible only as a labeled, separate account (the recovered tree)                                                                                                                | README § Failure grammar + glossary                      |
| 2026-09-01 | ceremony: full · twin-doc: machine + data (this unit authored the data twin — the repo's first, `data-model.md`)                                                                                | commit bodies' settings lines; data twin header          |
| 2026-09-01 | A partial stage stays `ok: false`; prefix publishes input elements too (bounded)                                                                                                                | README § Failure grammar + glossary                      |
| 2026-09-01 | **The same-key design** (human's own counter-proposal): failure arms carry `value` under the success arm's name; entwined account included; environment account included with invention markers | README § Failure grammar; DOCS E10; types.ts             |
| 2026-09-01 | One derivation pass **per instrument** (amends "nothing parses the same source twice"); prospective consumers recorded; bounding **by slicing** at the account's extent (leaf untouched)        | DOCS § Structural constraints; README § Level-blind      |
| 2026-09-02 | Recovered binding's `parenSpans` = the reader's own record; **absence is silence**, never assertion                                                                                             | README glossary § paren span; data twin; types.ts        |
| 2026-09-02 | Accounts **permanently optional** — the `undefined` at a skipped narrowing is the standing guard; the tightening idea is struck                                                                 | README § Failure grammar; data twin § Illegal states     |

## AR history

- **AR-1** (registered `ar-1`, opus tier), three rounds over README + both
  twins: **PAUSE** (4 human items — one-pass conflict, consumers, identity,
  bounding — all ruled) → **PAUSE** (2 human items — paren record, optionality —
  ruled; 6 editorial fixes N1/N2/N5–N8 applied) → **CONSIDER** (R1–R5 folded;
  responses in `f67a7891`'s body).
- **AR-2** (registered `ar-2`), one round over the amended DOCS/types/tests:
  **CONSIDER** — C1 (recovered-only qualifier in step 1, re-verified against the
  README after amending), C2 (`AstDerivation` transport retyped
  `StageSuccess<Program> | AstFailure`; stale record docstring corrected), C3
  (E7 and its constraint cross-reference E10), C4 (below), C5 (invention rows
  assert tree membership by walk), C6 (empty-prefix extent = 0, stated and
  row-pinned). All applied before the closing commit.
- **AR-5**: see the closing commit's body.

## ⚠ Hypothesis rows (AR-2 C4) — read before un-skipping

Tests carry no comments in this repo, so the markers live here. Four rows in
`tests/failure-accounts.test.ts` depend on **uninstalled acorn-loose**
specifics; a red row after install is read as _hypothesis falsified — adjust the
fixture_, never as _contract broken_:

- `'an environment element resting on invention is marked'` — the strongest
  hypothesis: assumes loose invents a dummy expression for `const x = ;`'s
  missing initializer AND eslint-scope records a reference on it.
- `'a program that lexes but does not parse carries a recovered tree'`,
  `'the invented nodes are enumerated exactly when the tree is published'`,
  `'every enumerated invention is a node of the recovered tree itself'` —
  near-certain loose behaviors, loose-specific nonetheless.

The token-prefix rows are NOT hypotheses — acorn is installed and its failure
points are settled.

## Phase-1 pointers (none started)

1. **Install `acorn-loose`** (approved, human ruling 2026-08-27, recorded at
   `../spellme/PHASE-1.md` § Deferred). Verify dummy-node detectability (the
   `invented` enumeration's feasibility) before wiring; verify whether loose
   supports `preserveParens` — if not, the reader's paren record is empty, which
   the absence-as-silence ruling makes honest.
2. **The `Array.from` drain** (AR-1 concern 14, recorded verbatim): the prefix
   is not recoverable from the current drain — when the tokenizer throws,
   `Array.from`'s internal array is discarded; only `comments` survives.
   Replacing it re-opens the Docusaurus/Babel loose-mode spread hazard the
   file's own comment records ("no test in this repo's harness can see it … only
   the bundled site does") — whatever replaces it must be checked against a real
   Docusaurus build.
3. **Loud-report wording**: `derive-environment.ts`'s "threw over a valid tree —
   broken embody invariant" and `derive-entwined.ts`'s span guard must not fire
   machine-invariant wording over a recovered tree (README § Failure grammar's
   cause.stage rule; AR-1 N2).
4. **Bounding by slicing**: `source.slice(0, extent)` + the prefix's own arrays
   into the UNCHANGED scanning leaf; extent = max(last token end, last comment
   end). No lib/scanning reshape is needed (AR-1 counter-proposal A, adopted
   2026-09-01).
5. **Un-skip one row at a time, ZOMBIES order, AR-3 on each** — hypothesis rows
   above carry their own reading.
6. **cspell**: inoperable during this campaign [measured 2026-09-02:
   `cspell.json` tracked at HEAD but deleted UNSTAGED in the working tree
   mid-session by a peer; no declared dep; no binary in `node_modules/.bin`] —
   the BRIEF's cspell checkpoint line is stale; per-file gates were prettier +
   markdownlint from the repo root. Re-check the state at Phase-1 start.
7. **Retype the deriver signatures when wiring** (AR-5 concern 5):
   `derive-entwined.ts` and `derive-environment.ts` still take
   `ast: FactStage<Program>`, which compiles (AstFailure is assignable) but
   erases `invented` — retype to `StageSuccess<Program> | AstFailure` in the
   increment that reads the recovered account.
8. **A degradation row is deliberately absent** (AR-5 concern 7): no skipped row
   pins "defect while deriving an account → member absent, cause kept" — left to
   the per-un-skip AR-3s, chosen rather than missed.

## Where the BRIEF's short-circuit enumeration was discharged (AR-5 concern 3)

`f67a7891`'s body carried "the short-circuit-site enumeration" to 0.3. It was
discharged in substance rather than as a list: the sites are unchanged by the
account design — `deriveAst` gates `!tokens.ok`; `deriveEntwined` gates
`!tokens.ok` and `!ast.ok`; `deriveEnvironment` gates `!ast.ok` and
`!entwined.ok`; `deriveAccessibility` bars `ast` on `!facts.tokens.ok` and both
trailing phases on `!facts.entwined.ok` [read this session: each file's guard
clauses] — because accounts ride failure arms and `ok: false` still
discriminates at every site (the AR-1 round-2 reviewer re-derived the same
conclusion independently). DOCS § Execution phases step 1 states the flow rule
the sites implement, and the three "a tokens failure publishes no …" rows in
`tests/failure-accounts.test.ts` pin three of the sites' behavior — the fourth
site (`deriveAccessibility`) is pinned by the row "phase accessibility is
unchanged by an account" under its own title. (Corrected 2026-09-02 at Phase-1
launch: this paragraph originally counted four rows under the "publishes no"
title; measured
`grep -c "a tokens failure publishes no" tests/failure-accounts.test.ts` → 3.
The discharge argument is unchanged — all four sites are pinned.) Phase 1
re-verifies per increment at AR-3.

## Out-of-scope confirmations

- `spellme` untouched; evaluators untouched; no lens built; no dependency
  installed; `DOCS.md`/`types.ts` changes were this Phase-0's contract work
  under the human's rulings, with AR-1/AR-2 run and resolved.
