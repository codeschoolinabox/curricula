<!-- cspell:ignore socratizing -->

# Position-vocabulary sweep — package-wide

One unit of work: align the remaining "character offset" phrasings across
`src/lib/study-lenses/` to the position vocabulary embody standardized, ruled
into existence 2026-08-11 when F6's region-only pass closed (the ruling and its
scope record: `.planning-handoffs/paren-truth/FOLLOW-ONS.md` § F6's banner). The
definitional home for the vocabulary is `src/lib/study-lenses/embody/DOCS.md` §
Parse decisions, the bullet opening "**Offsets, never line/column, in the fact
values.**" — offsets are indices into the source string, in UTF-16 code units.
The half-open `[start, end)` span convention lives beside it in the same
section's paren-span bullet and at `embody/types.ts`'s `ParenSpan` doc.

## Why this exists

F6 made embody internally uniform and left the package LESS uniform at two live
seams (AR-1 finding, 2026-08-11): `lib/socratizing` imports embody types while
its README calls the same numbers "character offsets", and `lib/screening`'s
`SourceRange` (`lib/screening/types.ts`) is structurally embody's span shape
over the same source. The maintainer ruled the sweep launches immediately as its
own unit rather than riding the three-line tidy.

(FOLLOW-ONS § F6's body says "22 sites" — that pre-pass count included embody's
3 since-fixed `types.ts` lines: 22 = 19 + 3.)

## The measured inventory (2026-08-11 — RE-MEASURE AT YOUR START)

`grep -rn "character offset" --include="*.ts" --include="*.tsx" --include="*.md" src/lib/study-lenses/`
gave 19 hits outside embody (embody itself is at 0):

| region            | files (hits)                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `lib/screening`   | README.md (3) · create-violation.ts (1) · types.ts (1) · DOCS.md (1) · parse-settings.ts (1) · tests/collect-violations.test.ts (1) |
| `lib/socratizing` | extract-location.ts (2) · README.md (2)                                                                                             |
| `lib/loop-guard`  | README.md (1) · DOCS.md (2)                                                                                                         |
| `language-levels` | scaffold/index.ts (1) · scaffold/README.md (1) · jej/tests/check-undeclared-globals.test.ts (1)                                     |
| `lenses/writeme`  | DOCS.md (1)                                                                                                                         |

Concurrent sessions commit into this tree continuously — treat every number
above as stale until re-measured, and check `git status` before staging
anything.

## The bar (same as F6's, verbatim in spirit)

Nothing here is FALSE — "character offset" is ambiguous, not wrong. This is
uniformity, not correction. Per reword: does the change make the text easier to
read without changing what it promises? If a reword would alter a promise, STOP
AND ASK. Every reword is enumerated in a loss ledger in the commit body (DEV.md
§ Documentation migration discipline).

Two rules the F6 pass learned the hard way:

- **Verify the unit claim per site before writing it.** "In UTF-16 code units"
  is a STRONGER claim than "character offset". It held everywhere F6 measured
  (acorn's error `pos` and node/token `.start`/`.end` are all UTF-16 code-unit
  indices — measured 2026-08-11, emoji probe), but each sweep site must be
  checked against what actually produces its number before the stronger phrase
  lands. A site whose number is NOT verifiable as code units keeps its old
  wording and gets flagged instead.
- **Each region owns its docs.** Read the region's README/DOCS before rewording
  it; a `types.ts` doc edit is a published-contract edit for THAT region — show
  the maintainer the literal diff per types.ts before committing, as F6 did for
  embody's. Prefer citing embody's definitional bullet over restating it (the
  cite-don't-restate pattern `embody/types.ts` uses for its README glossary).

## Knowingly out of scope

- embody is DONE (F6). Its `derive-entwined.ts` module doc keeps one "(a UTF-16
  code unit)" appositive — module prose, not published contract; align it only
  if the maintainer asks.
- Any semantic change to what a position IS anywhere. This unit rewords
  descriptions of existing values only.

## Launch prompt

```text
Run the package-wide position-vocabulary sweep. Repo:
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

FIRST — governance routing: read repo-root CLAUDE.md NOW; it routes by model
id to AGENTS.md or AGENTS.principal.md. Read your routed file END-TO-END,
then DEV.md END-TO-END, including § Documentation migration discipline and
§ Work routing and ceremony. Governance outranks this brief everywhere they
touch.

THEN read .planning-handoffs/position-vocabulary-sweep.md (this handoff) and
the ruling record it cites (.planning-handoffs/paren-truth/FOLLOW-ONS.md
§ F6's banner). The vocabulary's definitional home is
src/lib/study-lenses/embody/DOCS.md § Parse decisions ("Offsets, never
line/column"); embody/types.ts shows the three reworded shapes to match.

RE-MEASURE the inventory at your start — the handoff's table is a 2026-08-11
snapshot and peer sessions commit continuously. Per site: verify the number
really is a UTF-16 code-unit offset before strengthening the wording; a site
you cannot verify keeps its wording and gets flagged. Per region: read its
README/DOCS first; show the human the literal diff of any types.ts before
committing it. Loss ledger per reword in each commit body.

Ceremony: not yet set for this unit — it is the human's to set (DEV.md
§ Work routing and ceremony); ask in your opening summary if the launch
message does not state it, and do not fill the settings line yourself.

Gates: per-file eslint / markdownlint-cli2 --no-globs / cspell on every
changed file; npx tsc --noEmit at its measured session-start baseline;
npx vitest run --project unit src/lib/study-lenses/ with per-file
attribution of any foreign failure. Shared tree: pathspec-stage and commit
in ONE invocation, staged diff exclusively yours, announce full SHAs, NEVER
push.
```
