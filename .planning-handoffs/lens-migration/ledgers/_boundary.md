<!-- TRANSITIONAL — retires with SPEC.md, but ONLY once every row below has an
acknowledged recipient. A boundary row with no acknowledgement is an OPEN row at
campaign close, and an open row blocks the close. -->
<!-- cspell:ignore socratize socratizing reenrichment qasm dropdowns writeme parsons Leitner Loupe promisees esprima Preact -->
<!-- cspell:ignore colour distractor distractors ledgered throughs reloadable ordinally spellme -->

# Boundary ledger — material this campaign does not build

Two kinds of row live here.

**Handed across** — material that belongs to another owner. The campaign's rule:
_a boundary row with no acknowledged recipient is an OPEN row at close._ Handing
something across is not the same as mentioning it; the recipient has to have
been told.

**Refused or dropped** — material this campaign will not build, each carrying
the **measured ground** for the refusal and enough inventory that a future
campaign resumes rather than rediscovers. A drop justified by a resume point
that does not exist is not a drop, it is a disappearance — which is what this
whole campaign exists to prevent, so these rows land in the same commit as the
ruling that creates them.

Vocabulary: the closed set in
[FIDELITY-METHOD.md](../FIDELITY-METHOD.md#disposition-vocabulary).

---

## Handed across

### `bnd-001` — Gen-1 `ask-javascript`, the question register's ancestor

**Recipient:** the socratize-quiz re-enrichment campaign
(`.planning-handoffs/socratize-quiz-reenrichment/`). **Status:** ⬜ **not yet
acknowledged.**

`ask-javascript.jsx` (412 lines,
`…/0--study-lenses--it-begins/src/lenses/ask-javascript.jsx`) carries **the
densest switched-off code in the entire Gen-1 tree** — stated ordinally, because
[FIDELITY-METHOD.md § 5](../FIDELITY-METHOD.md#the-five-listers) forbids
publishing a channel-A count: the numbers are an artifact of whichever regex
produced them, and every pattern tried agrees only on the ordering. Its
`openEnded` configuration enumerates question domains (control flow, data,
functions, operators, variables, traces, generic), difficulty levels 1–5, an
alert channel and a range setting; its `multipleChoice.types` names the
generators. That is the Gen-1 ancestor of the question register.

**Why it is a row rather than a shrug.** The socratize-quiz campaign sources its
remaining stages from the **Gen-2 quarry only** — every "remaining scope" cell
in its stage table cites a quarry path. Under this campaign's R-2 (the union is
a floor and Gen-2 is not the judge of appeal), the Gen-1 layer is a fidelity
input that campaign does not currently hold. It may examine it and drop it; what
it cannot do is not know it exists.

**Also owed:** `ask-javascript`'s `renderConfig` export is **commented out at
the module boundary** [measured: lister 5 channel B], so its configuration
surface was suppressed rather than designed away. A recipient is owed the
distinction.

**`revive` travels with this row.** That disposition is this campaign's addition
to the shared vocabulary and the recipient does not hold it; the handoff carries
its definition
([FIDELITY-METHOD.md § The one addition](../FIDELITY-METHOD.md#the-one-addition--revive)).

### `bnd-002` — the citation this campaign broke, and repaired

**Recipient:** the socratize-quiz re-enrichment campaign. **Status:** ⬜ **not
yet acknowledged.**

`.planning-handoffs/socratize-quiz-reenrichment/SPEC.md` carried
`[read: MIGRATION-PLAYBOOK.md locked decision (1)]` as sourced evidence. **This
campaign has now deleted that file** — recover it with
`git log --diff-filter=D -- 'src/lib/study-lenses/lenses/MIGRATION-PLAYBOOK.md'`
— and, because the break was its own act, **has re-pointed the citation** at
[SPEC.md § Standing exclusions](../SPEC.md#standing-exclusions) rather than
leaving it to dangle.

**That repair does not close this row.** Per § Close conditions, a row closes on
a commit in the recipient's own tree whose body cites the row id. Re-pointing a
pointer is something this campaign can do alone; being held is not. **Status
stays ⬜.**

The sibling's **other** mention — the playbook's filename inside a dated
`[measured: ls … 2026-08-12]` directory inventory — is deliberately left
untouched. The deletion makes that measurement **stale, not false**, and
rewriting another session's dated measurement would falsify their record.

Two things the recipient needs, and they point in opposite directions:

- Decision (1)'s **mechanism** — "coloring = a shared facts-driven read-only
  highlighter" — is **superseded** by R-1, which makes coloring three producers
  with a semantic default and a Prism fallback, and not read-only-only.
- Decision (1)'s **socratize exception** — that socratize stays un-colorized —
  is **restored verbatim** and restated in
  [SPEC.md § Standing exclusions](../SPEC.md#standing-exclusions), which is
  where the citation now points.

**This row exists because of this campaign's own act**, which makes it an
obligation rather than an observation. Retiring a document while arguing that
stale facts are dangerous, and leaving a sibling's citation pointing into the
void, would be the same defect one directory over.

### `bnd-003` — the editor lenses' selection-scope model

**Recipient:** ⬜ **unassigned — needs a human to name one.** The material's
_destination_ is `orchestrate/editor/`, but a directory cannot acknowledge
anything and `DEV.md` bars process narration from its end-state docs, so there
is nowhere an acknowledgement could legally land. Naming an owner is a Gate-1
item. **Status:** ⬜ **not yet acknowledged.**

Gen-1 `EditorLens.jsx` (389 + css 661) and `QASMEditorLens.jsx` (486 + css 712)
are **not lenses** — `lenses/README.md` states the editor belongs to the
orchestrator, which owns the one edit intake the program's source changes
through. But QASM's interaction model is orchestrator design input worth
keeping: the study icon follows the learner's selection and the operable scope
narrows to it, so a learner can act on a fragment rather than the whole file.

`QASMEditorLens` additionally carries **20 orphan CSS classes** [measured:
lister 4] — a second body of design intent that never rendered.

### `bnd-009` — the `spellme` lens and `lib/scanning`, built concurrently

**Recipient:** ⬜ **unassigned — the author of `lenses/spellme/`**, whoever that
session belongs to. Naming them is a Gate-1 item. **Status:** ⬜ **not yet
acknowledged.**

`src/lib/study-lenses/lenses/spellme/` and `src/lib/study-lenses/lib/scanning/`
are both **untracked** and were created 2026-08-13, while this campaign's canon
was being written. `spellme` is a `tokens`-phase drive-the-scanner exercise;
`lib/scanning` derives its element sequence from the tokens fact. Since then
`spellme` has grown a full Phase-0 shape — `README.md`, `DOCS.md`, `types.ts`,
`core.ts`, `index.tsx`, `tests/` and a `ux/` twin directory [measured
2026-08-14: `ls src/lib/study-lenses/lenses/spellme/`].

Neither has a Gen-1 or Gen-2 source, so neither is this campaign's to migrate.
Two seams make them a boundary rather than a footnote:

- **`spellme` has already ruled the palette question this campaign was about to
  raise with it, and ruled it the same way.** Its README states **"The roles are
  named here; the hues are not"** (human ruling 2026-08-14), because Wong's blue
  and vermilion "already carry correct/wrong in parsons and blank parity in the
  lens-migration campaign's blanks work, so a third meaning for the same pair is
  a package-wide question this lens does not get to settle alone" [read:
  `spellme/README.md`, the paragraph under § UI structure]. Its DOCS repeats it
  under § Out of scope. So the lens names two semantic roles — attested element,
  diverging claim — and binds neither to a hue, leaving both to CSS custom
  properties. **That is an unsolicited handoff _to_ the coloring foundation, not
  a conflict with it**, and it makes the foundation's palette decision binding
  on a third surface whose author has already deferred to it.
- **`lib/scanning` is a third `facts.tokens` derivation** on the same leaf tier
  `lib/colorizing` is headed for, beside `lib/classifying`. Whether three
  siblings should derive from one fact independently is a bounded-context
  question this campaign answers for two of the three.

> **An earlier revision of this row got the first seam backwards**, and the
> correction is recorded rather than quietly applied. It asserted that `spellme`
> "declares its own Wong palette", quoting hex codes in quotation marks and
> citing a heading that does not exist. Measured 2026-08-14: `#0072B2` and
> `#D55E00` appear **nowhere** in the lens, and the README rules the opposite. A
> handed-across row whose next act is to be shown to that author must not
> misquote them — and this campaign's own `evidence` rule binds its quotations.

**This row exists because the campaign's register went stale within minutes of
being written** — an earlier draft named this lens `scanning` and called a
library a lens. That is the argument for
[making the register a check rather than a sentence](../SPEC.md#scope--what-is-built-ledgered-and-refused);
prose totality claims about a tree under concurrent edit do not hold.

### `bnd-004` — `LeitnerBoxManager.js`, a complete engine nobody imports

**Recipient:** ⬜ **unassigned — genuinely open.**

`…/0--study-lenses--it-begins/src/utils/LeitnerBoxManager.js` — **note the path:
it is outside the Gen-1 lenses directory this campaign publishes as its quarry
root.** 311 lines implementing a full seven-box Leitner spaced-repetition
scheme: box 1 for new and wrong answers through box 7 for mastered, with
`studyHistory`, session tracking, and `leitner.json` load/save. **Imported by
nothing** in the entire Gen-1 tree.

No lens owns retention scheduling, and no current campaign does either. It is
not a lens, so it is out of scope here; but it is the largest single piece of
finished, unreachable capability in the quarry, and recording it as unassigned
is more honest than filing it under a recipient who has not agreed.

---

## Refused by the snippet contract

`SnippetType = 'script' | 'module'` [read: `embody/types.ts`]. The embodiment
models JavaScript only, and every derived fact — acorn tokens, the ESTree tree,
the eslint-scope environment — is JavaScript-specific. There is no expressible
`applicability(facts)` for a file these lenses were written for.

**This is a refusal by the contract, not a scope judgment.** If the snippet
model widens, these rows are the resume point.

| #         | Lens         | Gen-1 inventory                                       | What it did                                                                                                                                                                                                                                                                                                                                                                                            |
| --------- | ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bnd-005` | `qasm`       | `QASMEditorLens.jsx` 486 + css 712, 20 orphan classes | An OpenQASM2 editor, gated `file.lang === '.qasm'`. Quantum assembly, not JavaScript.                                                                                                                                                                                                                                                                                                                  |
| `bnd-006` | `markdown`   | `MarkdownLens.jsx` 808 + css 467                      | Gated `file?.lang === 'markdown'`. A **document shell** rendering markdown with embedded interactive code blocks, modals and traces — Docusaurus's job here. Its interesting idea (embedding lenses inside prose) is a host concern, not a lens. It also shipped a **second Prism version with a different theme** from the rest of Gen-1, one of the three clashing colour schemes R-1 exists to end. |
| `bnd-007` | `run-python` | `run-python.jsx` 169                                  | No Python snippet type, no Python facts.                                                                                                                                                                                                                                                                                                                                                               |

## Dropped

| #         | Lens    | Gen-1 inventory                                                                                                                                                                                                        | Ground                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bnd-008` | `print` | `PrintLens.jsx` 542 + `PrintLens.module.css` 515, **5 orphan classes** [measured: lister 4] plus `bwMode` by direct check [measured: `grep -c "styles\.bwMode" PrintLens.jsx` → 0], which lister 4 structurally misses | **R-6 — YAGNI; build it if and when it is needed** (human ruling 2026-08-13). It was a read-only code view optimized for printing, always applicable, consuming Gen-1's `useColorize()` over the shared `CodeBlock`. Nothing blocks it technically: once the coloring foundation lands it is among the easiest lenses in the tree, since it needs no interaction model at all. That is exactly why deferring it is cheap. |

**Gen-1 print already designed two things it never shipped**, and both are
directly on the resume path [measured: lister 4 — `actions`, `codeLine`,
`lineContent`, `lineNumber`, `withLineNumbers`; `bwMode` by direct check, per §
4's own caveat]:

- **`.bwMode` — a black-and-white print mode** that flattens every token colour
  to a single grey (`PrintLens.module.css` styles `:global(.keyword)`,
  `:global(.string)` and `:global(.comment)` down to one value under it). Never
  referenced from the JSX. This is the single most relevant Gen-1 fact to a
  future print lens, because printing a dark semantic palette is exactly the
  problem it solves.
- **Line numbering** — `codeLine`, `lineNumber`, `lineContent` and
  `withLineNumbers` describe a numbered-gutter layout that also never rendered.

`PrintLens.module.css` additionally carries **its own Prism token theme**
(`:global(.keyword)`, `.string`, `.comment`), and `PrintLens.jsx` injects a
further "complete SL1 Prism styles" string at print time — so Gen-1 shipped a
**fourth** colour scheme beyond the three named in
[SPEC.md § The coloring foundation](../SPEC.md#the-coloring-foundation).

**What a future print session would need**, so the drop has a real resume point
and not a gesture at one: the read-only span producer from `lib/colorizing/`; a
`@media print` tone — `bwMode` is the recovered design for it — that survives
without a background, which the foundation's stylesheet makes tractable since it
sets none; pagination that does not split a line mid-token; the line-number
gutter above; and a decision about whether `annotate`'s annotations appear in a
printed view. None of it is blocked today. It is deferred, not refused.

---

## Not a boundary — recorded here because it looks like one

**The error-interpreting lens.** `lenses/README.md` names it twice — as the
canonical multi-phase example and in § The roster, "speaks the parser's voice
across both parse phases" — and the `tokens` and `ast` phases hold no lens
today. It has **no Gen-1 and no Gen-2 source**: there is nothing to migrate,
hand across or refuse. It is greenfield design, and it belongs to whatever
campaign takes on the parse phases. It appears in
[SPEC.md § Scope](../SPEC.md#scope--what-is-built-ledgered-and-refused) with
that ground so that a reader checking "is every lens accounted for" finds it
accounted for.

---

## Close conditions

This ledger closes when:

- **Acknowledgement is a checkable act, not a good intention:** a commit in the
  recipient's own tree whose body cites the row id. "We sent it" does not close
  a row; the receiving campaign holding it does. This campaign cannot perform
  that act itself — which is why each row needs a **named human owner for the
  ask**, assigned at Gate 1.
- `bnd-001` and `bnd-002` have acknowledged recipients by that definition.
- `bnd-003`, `bnd-004` and `bnd-009` either have a named recipient or a human
  ruling that they stay unassigned. None can close by an agent's action alone.
  (`bnd-009`'s recipient is the `spellme` author — a live session, so this is
  the one unassigned row with an obvious owner to name at Gate 1.)
- Every refused and dropped row still carries its measured inventory,
  re-verified at close, since the quarry can move underneath a stale number.
