<!-- TRANSITIONAL — this lens's fidelity ledger. Retires with SPEC.md, but only
once every row below carries a resolving `discharged by`. -->
<!-- cspell:ignore socratize dropdowns writeme parsons colorize blankenate parsonizer -->
<!-- cspell:ignore colour distractor ledgered throughs unrebutted oldd clauding -->
<!-- cspell:ignore firstblock glossterm behaviour normalised -->

# `writeme` — fidelity ledger

Method: [FIDELITY-METHOD.md](../FIDELITY-METHOD.md), read in full before the
first row. Scope and disposition: [SPEC.md](../SPEC.md).

> **PASS 1 — SEEDED, NOT AUDITED.** Every row below is OPEN by construction, and
> that is this pass's contract:
> [§ Pass 1](../FIDELITY-METHOD.md#pass-1--mechanical-seeding)'s listers **open
> rows and close none**. Every `provenance` set carries `UNSETTLED`. **This
> ledger makes no fidelity claim.** Its thinness or thickness is a property of
> the instruments, not a finding — do not read a row's absence as evidence of
> anything, and do not hand this ledger to a lens session:
> [SPEC.md § The two handoff tiers](../SPEC.md#the-two-handoff-tiers) requires a
> completed ledger.

**Row ids are stable forever.** Append; never renumber, never re-sort. Handoffs
cite these ids, and a renumber silently re-points every citation.

**This lens is the campaign's fidelity control**
([SPEC.md § Family C](../SPEC.md#family-c--the-landed-cohort--parsons-re-enrich-writeme-verify)).
Every other ledger is measured against it, so what it demonstrates is the
**measured-zero path**: two of its five listers ran and found nothing, and both
say so in words rather than by omission. A blank section here would be
indistinguishable from an instrument that could not run — the exact confusion
SPEC § Roll-up's `instruments` column exists to prevent.

---

## Reference inventory

Pasted from one run, not retyped.

```bash
REF=src/lib/study-lenses--deprecated-architecture/lenses/writeme
if [ -d "$REF" ]; then
  for f in README.md DOCS.md; do echo "== $f"; grep -nE '^#+ ' "$REF/$f"; done
  echo "== types.ts"; wc -l "$REF/types.ts"
  grep -nE '@remarks|^type |^\s+readonly ' "$REF/types.ts"
else
  echo "no Gen-2 reference — $REF does not exist"
fi
```

```text
== README.md
1:# lenses/writeme
30:## Public API
93:## Why this lens exists
115:## Glossary
165:## UI structure
208:## Toolbar contract
251:## Write-view contract
280:## Diff contract
307:## Diff semantics
334:## Read-view contract
351:## Edge cases
380:## What this lens does NOT do (lens-specific drops only)
443:## Two-layer module
494:## Dependencies (no install needed)
501:## Future direction
524:## Conventions inherited
541:## Navigation
== DOCS.md
1:# writeme — Architecture & Decisions
3:## Why this module exists
27:## Migration
61:## Modules
88:## Architectural sketch
95:### Execution phases
149:### Data flow
191:### Structural constraints
305:### Out of scope
332:## Why scaffold toggles use compartments
362:## Why default the editor to diff
375:## Why Read is the paired solution editor
399:## Why the honest line-count replaces the legacy score
428:## Why per-line (not per-char) diff
447:## Why keep-comments re-seeds only while pristine
478:## Why toggling a scaffold preserves learner code
496:## Why paste is blocked in diff too
506:## Module ownership
517:## Future direction
== types.ts
     175 src/lib/study-lenses--deprecated-architecture/lenses/writeme/types.ts
18: * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the `embody/`
24: * @remarks `LensConfig` (from `../types.ts`) is the wrapper's prop type for
34: * @remarks Naming note: vocabulary matches the legacy `WritemeLens.jsx` directly
46: * @remarks
61:type ViewMode = 'write' | 'read';
69: * @remarks
103: * @remarks
118:type LineStatus = 'match' | 'diff' | 'empty' | 'comment';
125: * @remarks `perLine[i]` is the verdict for solution line `i` (so
132: * @remarks `matched` / `total` are an HONEST reproduced-line tally — a numeric
139:type DiffResult = Readonly<{
153: * @remarks All fields are `SerializableValue`-compliant per `../types.ts`: a
157: * @remarks Defaults (per `./README.md` § Public API). Note the asymmetry —
165:type WritemeLensConfig = {
166:	readonly viewMode?: ViewMode;
167:	readonly colorize?: boolean;
168:	readonly suggestions?: boolean;
169:	readonly keepComments?: boolean;
170:	readonly diff?: boolean;
```

Unlike `parsons`, whose type-declaration arm returned nothing, both arms
produced output here: **8 `@remarks` blocks** plus three `type` declarations and
five `readonly` fields. The type-contract universe Pass 2's **type contract**
walk class is checked against is therefore the union of those, and it is
enumerable.

**The port side**, which listers 1–3 diff against [measured 2026-08-16: `grep
-nE '^#+ '` over `src/lib/study-lenses/lenses/writeme/`]:

```text
== README.md                == DOCS.md
3:# lenses/writeme           3:# writeme — Architecture & Decisions
19:## Why this lens exists    5:## Why this module exists
36:## The lens contract      16:## Modules
84:## Glossary               36:## Architectural sketch
126:## UI structure          38:### Execution phases
168:## Toolbar contract      92:### Data flow
206:## Write-view contract    134:### Structural constraints
228:## Diff contract          222:### Out of scope
252:## Diff semantics         245:## Why scaffold toggles use compartments
278:## Read-view contract     273:## Why default the editor to diff
293:## Edge cases             282:## Why Read is the paired solution editor
318:## Two-layer module       301:## Why the honest line-count is the feedback
364:## Future direction       324:## Why per-line (not per-char) diff
383:## Navigation             342:## Why keep-comments re-seeds only while pristine
                             365:## Why toggling a scaffold preserves learner code
                             378:## Why paste is always blocked
                             386:## Module ownership
```

**Gen-1 source**, for the provenance negative every non-G1 row owes
([§ The exemption needs evidence too](../FIDELITY-METHOD.md#the-exemption-needs-evidence-too)):
`WritemeLens.jsx` **874** lines + `WritemeLens.module.css` **611** lines, in the
Gen-1 tree [measured 2026-08-16: `wc -l`]. Unlike `ParsonsLens`, this `.jsx` is
not a shell — it carries the pedagogy itself, in-file.

**Instruments that could run**, matching this lens's row in
[SPEC.md § Roll-up](../SPEC.md#roll-up): **`1–5`.** All five ran.

The absence of a parenthesised root is itself a measured claim, not an omission.
SPEC § Roll-up qualifies the cell with a root only _"where that is not the whole
of Gen 1"_, and for this lens `src/lenses/` **is** the whole of Gen 1 [measured
2026-08-16:
`grep -onE '(public|static|/static)/[A-Za-z0-9_./-]+' WritemeLens.jsx` → **0
hits**; `grep -c 'iframe' WritemeLens.jsx` → **0**;
`find public -iname '*writeme*'` → **none**]. So this ledger does **not** carry
`parsons`'s unread-second-root gap: there is no
[second root](../SPEC.md#gen-1s-second-root--the-lens-file-is-often-only-a-shell)
for writeme to reach, and `G1-*` rows here are limited by what listers 4 and 5
found, not by where they were pointed.

---

## Source inventory

**This section is nearly empty, and the reason is a measurement rather than a
gap.** Both source-side listers ran to completion over the Gen-1 pair above and
both returned zero, so neither opens a row. Per
[`_TEMPLATE.md` § Lister 4](./_TEMPLATE.md#lister-4--orphan-css), a lister that
ran and found nothing writes `measured zero — <command> → 0`, never silence.

### Lister 4 — orphan CSS

Run verbatim from
[`_TEMPLATE.md` § Lister 4](./_TEMPLATE.md#lister-4--orphan-css) with `<Lens>` =
`WritemeLens` [measured 2026-08-16]. **Measured zero — 0 orphans of 43 defined
classes**, reproducing FIDELITY-METHOD § 4's published `WritemeLens` row
(`0 / 43`) exactly:

```text
(the clustered-orphan command produced no output)
```

```bash
# defined classes
grep -oE '^[[:space:]]*\.[a-zA-Z][a-zA-Z0-9_-]*[[:space:]]*[,{]' "$CSS" \
  | grep -oE '\.[a-zA-Z][a-zA-Z0-9_-]*' | sed 's/^\.//' | sort -u | wc -l   # -> 43
# orphans among them
for c in $defined; do grep -q "styles\.$c\b" "$JSX" || echo "$c"; done | wc -l  # -> 0
```

**Every class defined in `WritemeLens.module.css` is referenced from
`WritemeLens.jsx`.** This is the campaign's opposite pole from `ParsonsLens`'s
27 of 37, and it is why writeme is the control: **lister 4 opens no rows in this
ledger**, and that is a finding about the source, not about the instrument.

**Both direct checks, run and recorded whether or not they found anything** —
FIDELITY-METHOD § 4 calls the counts a lower bound, but computed access and
kebab-case names make the error run in **both** directions:

- **Computed access: PRESENT, and with no effect here.** `WritemeLens.jsx:710`
  reads ``<div className={`${styles.feedback} ${styles[feedback.type]}`}>``
  [measured 2026-08-16: `grep -n 'styles\[' WritemeLens.jsx` → **1 hit, line
  710**]. Computed access is the route by which the lister can produce false
  **positives** — a class reachable only as `styles[expr]` would be reported as
  an orphan. **Here the orphan set is empty, so it has nothing to falsify.**
  Recording it as "computed access: none" would be false; recording it without
  the consequence would overstate it. ⚠️ Instrument caveat carried to Pass 2:
  `feedback.type` is a runtime value, so which classes it can name is not
  decidable from the stylesheet — a reader, not a lister, settles that.
- **Kebab-case orphans: none, vacuously.** `styles.<name>` cannot express a
  kebab-case class, so such an orphan is unverifiable by the lister. The orphan
  set is empty, so the class of unverifiable orphans is empty too [measured
  2026-08-16: the orphan list piped through `cut -f2 | grep -- '-'` → **0**]. No
  direct check is owed on any name.

### Lister 5 — switched-off code

**Channel B — zero, and it is a measured zero** [measured 2026-08-16]:

```bash
grep -nE '^// *export const (render|execute|renderConfig)' WritemeLens.jsx  # (none)
grep -n '{false &&' WritemeLens.jsx                                        # (none)
```

`WritemeLens` has no suppressed exports and no falsy render guards. It is one of
the Gen-1 render lenses where channel B is silent — unlike `BlanksLens` (one
guard, hiding ~190 lines of hints UI) or `TracingLens`/`StepThroughsLens` (whose
`render` exports are commented out entirely). **Channel B therefore opens no
rows in this ledger.**

<details>
<summary>Channel A — candidate lines for Pass 2. A reading list, not a count.</summary>

⚠️ **No number is stated here, and none may be derived from this list.**
FIDELITY-METHOD § 5 records that widening the pattern moved `WritemeLens` from
**0 to 13** on the same file — so any count is an artifact of the regex that
produced it. The list below is the superset a plain comment-line grep returns;
most entries are ordinary prose section comments, and separating those from code
is Pass 2's reading, not a seeder's regex.

```text
24   // Get current content from enliven file
27   // Removed studentCode state - using getStudentValue() directly ...
40   // Helper to build writeme configuration string from state
48   // URL-based configuration
52   // Apply lens configuration if present
74   // Update URL when settings change
80   // Simple CodeMirror setup for student editor (disposable practice)
100  // Simple CodeMirror setup for solution editor (read-only)
120  // Initialize both CodeMirror editors
122  // Student editor (editable)
137  // Solution editor (read-only)
152  // Setup solution editor - ALWAYS show original code ...
158  // Use timing pattern that works for student editor
163  // Verify after setValue
168  // console.error('❌ SOLUTION EDITOR SETUP FAILED!');
169  // console.error(
170  //   'Expected length:',
171  //   originalCode.length,
172  //   'Actual length:',
173  //   actualSolutionContent.length,
174  // );
176  // Retry once more
188  // Wait for CodeMirror to be ready (same timing as student editor)
192  // Setup student editor - show template based on settings (ONLY on initialization)
198  // Generate template inline to avoid dependency issues
201  // Inline template generation to avoid callback dependency issues
271  // VERIFY: Check what the student editor actually contains after setValue
277  // Initialize hints based on original code
291  // Strip comments from code for advanced exercise mode
293  // Remove single-line comments
295  // Remove multi-line comments
297  // Remove empty lines that result from comment removal
302  // Generate hints based on code analysis
307  // Extract key programming concepts based on mode
310  // When comments are kept, focus on implementation details
337  // When comments are stripped, provide structural guidance
377  // Add structural hints
404  // Check student's progress
412  // Simple similarity check
421  // Check for key programming concepts
459  // Check if complete
475  // Compare with original code
488  // Provide specific feedback
491  // Check for missing concepts
522  // Reveal a hint
531  // Reset exercise
535  // Reset solution editor to original code (should already be there)
538  // Reset student editor to template (inline generation)
541  // Same inline template generation as in the effect
607  // Removed setStudentCode - no longer needed
609  // Reset UI state
616  // Show solution (read mode)
618  // VERIFY: Check solution editor content before mode switch
624  // VERIFY: Check editor states after mode switch
631  // Switch to write mode
696  {/* Progress Bar */}
716  {/* WRITE MODE - always rendered but visible only in write mode */}
778  {/* READ MODE - always rendered but visible only in read mode */}
862  // Writeme lens - unified interface
```

**Lines 168–174 are the one block that is unambiguously commented-out code**
rather than a section comment — a `console.error` diagnostic for a
solution-editor setup failure, with line 176's `// Retry once more` beside it.
It is carried here **for Pass 2 to adjudicate**, and it opens no row now.

Two further entries a Pass-2 reader is owed a pointer to, both prose comments
naming a **removal** rather than describing live code: line 27
(`// Removed studentCode state …`) and line 607 (`// Removed setStudentCode …`).
Whether they mark a lost affordance or a refactor is a reading.

</details>

### Seed census

| instrument         | hits                 | rows opened | ids       | note                                                                      |
| ------------------ | -------------------- | ----------- | --------- | ------------------------------------------------------------------------- |
| lister 1/3 README  | 17 headings          | **15**      | `001–015` | less the H1 title; less `## Glossary`, whose terms seed at `034–045`      |
| lister 1/3 DOCS    | 19 headings          | **18**      | `016–033` | less the H1 title                                                         |
| lister 2           | ref 10 · port **10** | **0**       |           | every `^#+ Why` is already a lister-1 row; lister 2 marks them, adds none |
| lister 3 glossary  | 12 terms             | **12**      | `034–045` |                                                                           |
| lister 4           | **0** orphans of 43  | **0**       |           | measured zero, not an instrument limit                                    |
| lister 5 channel B | **0**                | **0**       |           | measured zero, not an instrument limit                                    |
| lister 5 channel A | list                 | **0**       |           | carried above for Pass 2; never counted                                   |
|                    |                      | **45**      | `001–045` |                                                                           |

**Remainders — instrument output that opened no row, named rather than
dropped:**

- **Three port-only headings**, which lister 1's diff produces from the port
  side and this ledger's seeding order does not reach: README
  `## The lens contract` (the candidate successor to ref `## Public API`,
  `writeme-001`); DOCS `## Why the honest line-count is the feedback` and
  `## Why paste is always blocked` (the candidate renames at `writeme-027` and
  `writeme-031`). A port-only heading carrying no reference ancestor is an
  `ADDITION` candidate, and `ADDITION` rows owe `walked`/`found`, which Pass 1
  cannot write. **They are Pass 2's to open.**
- **Lister 2 found no fall, and that is this lens's headline result:** ref
  **10** `^#+ Why` headings → port **10**, with **0** generic `## Decisions`
  appearing [measured 2026-08-16: `grep -cE '^#+ Why[[:space:]]'` over both
  documents each side; `grep -c '^## Decisions'` over the port's README and DOCS
  → `0` and `0`]. Note the convention: FIDELITY-METHOD § 2's table reads **9**
  for writeme because it counts DOCS-only `^## Why`; both documents at
  `^#+ Why[[:space:]]` gives **10**. Both reproduce — **do not "correct" the
  method's table.** ⚠️ **The count is preserved while two of the ten names are
  not** — `writeme-027` and `writeme-031` carry no `G3` under the exact-match
  rule and record candidate renames instead. A count comparison cannot see a
  rename; that is what the per-row exact-match rule is for, and it is why lister
  2 is a severity marker on rows rather than a row-opener.
- **Glossary literal-presence counts in the port**, evidence for Pass 2 and not
  a survival verdict: the port **does** carry a `## Glossary`, and **11 of the
  12 reference terms are still defined in it**. `Diff` is the one that is not
  [measured 2026-08-16].
- **One instrument caveat on `glossterm` itself**, recorded because it changes
  which cells below are trustworthy: **the published `glossterm` matches its
  term as an awk regex, so a term containing `(` or `)` never matches.**
  `Diff (toggle)` returns nothing on **both** the reference and the port
  [measured 2026-08-16], which would read as a definitional loss and is not one.
  This is the same defect class FIDELITY-METHOD § The minimum walk set already
  records for `grep -E` against the six `does NOT do` headings, one helper over.
  Rows `034`–`045` were therefore taken with a literal-prefix check —
  `index($0, "- **" n "** —") == 1` — matching the discipline `resolve` and
  `firstblock` already use; `writeme-038`'s quote is a verbatim substring of the
  same bullet the published helper failed to reach.

---

## Rows

Columns and their rules: [§ Columns](../FIDELITY-METHOD.md#columns). What Pass 1
fills and what it leaves:
[`_TEMPLATE.md` § What Pass 1 writes](./_TEMPLATE.md#what-pass-1-writes-and-what-it-leaves)
— which also carries the `G3` exact-match rule, the
`heading absent from the port` wording, and the three permitted annotation
classes. This ledger follows them and does not restate them.

**Which extractor produced a cell is a property of the row's seed class, not a
blanket fact about the ledger:**

| rows        | seed class         | extractor                                                                                   |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `001`–`033` | reference headings | `firstblock` — the cited section's first non-blank block, truncated at 240 chars            |
| `034`–`045` | glossary terms     | `glossterm` — the term's own bullet, cut at the source's line wrap; see the caveat on `038` |

`\|` is `firstblock`'s pipe escape. No row below comes from lister 4 or lister
5: both measured zero.

⚠️ **`…` does NOT reliably mark the extractor's own cut in the heading rows, and
that is a defect this ledger carries rather than one it has fixed.** An earlier
revision of this line claimed it did. Measured 2026-08-16 by re-running
`firstblock` for every cited heading and diffing normalised: **13 of the 33
heading rows** quote less than the extractor returns, the seeder having cut
earlier by hand and appended a `…` the tool never produced — `004`, `006`,
`009`, `011`, `013`, `015`, `018`, `020`, `023`, `025`, `028`, `029`, `032`.
**The glossary rows are clean: 0 of 12 diverge** from today's `glossterm`.

`writeme-011` is the sharpest case: `firstblock` on the port's § Two-layer
module returns a complete **240-character** block ending in `:` and makes **no
cut at all** — `length(buf) > 240` is false at exactly 240 — while the cell
shows a truncated sentence plus `…`. Nothing quoted anywhere is fabricated, and
no row cites a heading that does not resolve [both checked, 2026-08-16]; what
these 13 rows drop is real trailing content a reader pasting the published
command would get.

**Owed: re-cut those 13 cells from the extractor's verbatim output.** Left as a
named defect rather than a rushed re-transcription, because verbatim transport
is exactly what went wrong here and a hasty second pass is how this campaign has
twice introduced new defects while fixing old ones.

| #             | affordance                                                                                                                              | provenance                  | evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | disposition | discharged by | gate |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------- | ---- |
| `writeme-001` | A reader can find the module's single default export and the frozen type it conforms to, named in one place.                            | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Public API: _"The module's default export is a frozen `LensModule` per [`../types.ts`](../types.ts) § LensModule:"_ — **heading absent from the port**; candidate successor: port README § The lens contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |             |               |      |
| `writeme-002` | A reader can find out what this lens asks of the learner, and how that differs from the two lenses that scaffold more.                  | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Why this lens exists: _"`writeme` is the learner's **reproduction workbench**. Where `parsons` asks the learner to order given lines and `blanks` asks them to fill given holes, `writeme` asks them to **produce the whole program from memory** — the furthest …"_ · Gen-3 `README.md` § Why this lens exists: the same opening block, verbatim.                                                                                                                                                                                                                                                                                                                                                                               |             |               |      |
| `writeme-003` | A reader can find the lens's rendered DOM shape, including the `data-lens` attribute a stylesheet or test keys off.                     | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § UI structure: _"`<div data-lens="writeme"`"_ (a fence; the extractor takes its first line) · Gen-3 `README.md` § UI structure: _"`<div data-lens="writeme"`"_ — the heading and its opening line both survive.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |             |               |      |
| `writeme-004` | The learner can switch between the write and read views without losing the code they have typed.                                        | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Toolbar contract: _"- **View toggle** — two `<button>`s ("Write" / "Read"). The active view is reflected by `data-view-mode` on the root. Toggling **preserves the learner's code** (parity with legacy) — Read is a study affordance (read and memorize …"_ · Gen-3 `README.md` § Toolbar contract: _"…Toggling **preserves the learner's code** — Read is a study affordance (read and memorize the solution, then …"_                                                                                                                                                                                                                                                                                                         |             |               |      |
| `writeme-005` | The learner types into a paste-blocked editor that starts from either a comment skeleton or an empty document.                          | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Write-view contract: _"- The write view renders a CodeMirror editor (`javascript()` language, `oneDark` theme, the vendored `noPasteExtension`) seeded with the starting template: the comment skeleton (when `keepComments`) or an empty document. The editor …"_ · Gen-3 `README.md` § Write-view contract: the same block with `the vendored noPasteExtension` reading `the noPasteExtension`.                                                                                                                                                                                                                                                                                                                                |             |               |      |
| `writeme-006` | The learner can see which of their typed code lines do not match the solution, without being told what the correct text is.             | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Diff contract: _"- When `diff` is on the write editor highlights each **code line the learner has typed that does not match** the corresponding solution line (a `diff` status — compared by line index, see \[Diff semantics\](#diff-semantics)). Matching …"_ · Gen-3 `README.md` § Diff contract: the same opening block, verbatim.                                                                                                                                                                                                                                                                                                                                                                                           |             |               |      |
| `writeme-007` | A reader can find out exactly how two lines are judged equal — by index, trimmed — rather than having to infer it.                      | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Diff semantics: _"`lib/diff-lines.ts` compares the learner's code to the solution **line by line, by index** (learner line \_i\_ vs solution line \_i\_), each compared **trimmed** (we grade line content, not indentation or trailing whitespace). The comment …"_ · Gen-3 `README.md` § Diff semantics: the same block, with _"we grade line content"_ reading _"line content is graded"_.                                                                                                                                                                                                                                                                                                                                    |             |               |      |
| `writeme-008` | The learner can study the solution in an editor configured to match the one they type into, with their own code hidden.                 | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Read-view contract: _"The read view renders the solution in a **read-only CodeMirror editor** (carrying `data-writeme-solution`, inside a `data-writeme-solution-view` figure) configured to **match the write editor** — the two are a **pair**. It mirrors …"_ · Gen-3 `README.md` § Read-view contract: the same opening block, verbatim.                                                                                                                                                                                                                                                                                                                                                                                     |             |               |      |
| `writeme-009` | A reader can find out what the lens does with a degenerate program, including an empty one.                                             | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Edge cases: _"- **Empty source** (`embodiment.source.code === ''`). The comment skeleton of `''` is `''`; the write editor starts empty; the diff has zero code lines; the tally is `0 / 0`. No crash, no `NaN` — this also fixes a latent legacy …"_ · Gen-3 `README.md` § Edge cases: _"- **Empty source** (`facts.source.value === ''`). … the tally is `0 / 0` — vacuously complete, no `NaN`. - \*\*Comment-only …"_                                                                                                                                                                                                                                                                                                        |             |               |      |
| `writeme-010` | A reader can find every affordance this lens deliberately does not offer, each with its reason.                                         | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § What this lens does NOT do (lens-specific drops only): _"Inherited from the lenses peer (single-writer state, disposable practice, no `embody/`-top imports, no consumer branching on `source.code`): see [`../README.md` § Conventions](../README.md#conventions). Lens-specific drops vs. the …"_ — **heading absent from the port**, and no port heading contains the string `does NOT do` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                             |             |               |      |
| `writeme-011` | A reader can find which file holds which layer, and why the core is split one file per internal subsystem.                              | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Two-layer module: _"Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the lens lives across the two required layers (pure-TS core + React wrapper). The core is split into a `lib/` subdirectory with one file per internal subsystem so …"_ · Gen-3 `README.md` § Two-layer module: _"Per [`../README.md`](../README.md) § Anatomy of a lens, the lens lives across the two layers …"_                                                                                                                                                                                                                                                                                                                  |             |               |      |
| `writeme-012` | A reader can find out which third-party packages this lens needs, and that none of them has to be installed.                            | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Dependencies (no install needed): _"- **`@codemirror/view`, `@codemirror/state`, `@codemirror/lang-javascript`, `@codemirror/theme-one-dark`, `codemirror`** — already in `package.json` (used by the editor and the `blanks` / `annotate` lenses). No AST parser (writeme …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                               |             |               |      |
| `writeme-013` | A reader can find what this lens defers, and the restoration path for each deferral.                                                    | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Future direction: _"- **WS2 `recommend()`.** Lens ships with `recommend: () => []`. Once WS2's analysis surface lands, `recommend(embodiment)` populates Block-Model placements (and down-ranks snippets too short to be worth retyping). - \*\*Order-insensitive …"_ · Gen-3 `README.md` § Future direction: _"- **`recommend()` heuristics.** … - \*\*Order-insensitive line …"_                                                                                                                                                                                                                                                                                                                                               |             |               |      |
| `writeme-014` | A reader can find which peer conventions bind this lens and how they apply here specifically.                                           | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Conventions inherited: _"Follows all conventions in [`../README.md`](../README.md) and [`../DOCS.md`](../DOCS.md). Notable lens-specific application:"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |             |               |      |
| `writeme-015` | A reader can reach every sibling document of this lens from its README.                                                                 | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Navigation: _"- **Parent**: [`../README.md`](../README.md) — lenses peer. - **Architectural sketch**: [`./DOCS.md`](./DOCS.md). - **Type contract**: [`./types.ts`](./types.ts). - **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + …"_ · Gen-3 `README.md` § Navigation: _"- **Region**: [`../README.md`](../README.md) — the lens kind's mechanics. …"_                                                                                                                                                                                                                                                                                                                                                        |             |               |      |
| `writeme-016` | A reader can find out what the module is for, in the learner's terms, before reading any of its structure.                              | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Why this module exists: _"The `writeme` lens is the learner's **reproduction workbench**: a place to type a program back from memory into a paste-blocked CodeMirror editor, with an optional comment skeleton as scaffolding and a per-line diff **pair** as the …"_ · Gen-3 `DOCS.md` § Why this module exists: the same opening block, verbatim.                                                                                                                                                                                                                                                                                                                                                                                |             |               |      |
| `writeme-017` | A reader can find out where this lens came from and what its predecessor actually shipped.                                              | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Migration: _"The pre-refactor lens lived at `zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/lenses/WritemeLens.jsx` (875 lines, Preact) with `WritemeLens.module.css`. The V2 redo preserves the **pedagogical surface** while replacing …"_ — **heading absent from the port** [measured 2026-08-16: prefix `Migration` resolves **0** against the port's DOCS].                                                                                                                                                                                                                                                                                                                                               |             |               |      |
| `writeme-018` | A reader can find a per-file table naming each module's layer and purpose.                                                              | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Modules: _"\| File \| Layer \| Purpose …"_ (a table; the extractor takes its first line) · Gen-3 `DOCS.md` § Modules: _"\| File \| Layer \| Purpose …"_ — heading survives on both sides.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |             |               |      |
| `writeme-019` | A reader can find the structural target the implementation was held against, written before any code.                                   | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Architectural sketch: _"> Written Phase 0, before implementation. The Refactor step of each increment is > held against this sketch. Domain terms only — no function names, no variable > names, no pseudocode (React hook names like `useState` / `useEffect` / > …"_ · Gen-3 `DOCS.md` § Architectural sketch — the heading survives. ⚠️ Instrument caveat: `firstblock` returns **empty** against the port's copy, because the port's heading is followed immediately by its first child heading — so the heading survives while its own opening block does not, and no quote can be extracted to compare.                                                                                                                      |             |               |      |
| `writeme-020` | A reader can find the ordered phases a mount passes through, from config resolution onward.                                             | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Execution phases: _"1. **Mount + resolve config** (sync, pure) — the orchestrator passes a frozen embodiment and a frozen lens config via props. The wrapper reads the known config fields (view mode; the four scaffold toggles colorize / suggestions / …"_ · Gen-3 `DOCS.md` § Execution phases: _"1. **Mount + resolve config** (sync, pure) — the orchestrator passes a frozen embodiment and the lens's resolved config via props. …"_                                                                                                                                                                                                                                                                                       |             |               |      |
| `writeme-021` | A reader can find the module's data path as a diagram rather than as prose.                                                             | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Data flow: _"flowchart TD"_ (a Mermaid fence; the extractor takes its first line) · Gen-3 `DOCS.md` § Data flow: _"flowchart TD"_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |             |               |      |
| `writeme-022` | A reader can find the constraints the implementation must not violate, stated separately from what it does.                             | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Structural constraints: _"- **Two-layer module shape** — `core.ts` + the files under `lib/` do NOT `import React`. Three lib files import `@codemirror/*` (a third-party library whose extension types are React-free): `no-paste-extension.ts`, …"_ · Gen-3 `DOCS.md` § Structural constraints: the same opening bullet, whose `import React` appears without backticks.                                                                                                                                                                                                                                                                                                                                                          |             |               |      |
| `writeme-023` | A reader can find what the lens deliberately leaves to another owner, separately from what it defers.                                   | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Out of scope: _"- **Cross-mount persistence** of learner code. Per-mount React state only; nothing survives unmount. - **URL state.** v1 ships none. A Future-direction item; would lift to the orchestrator per the blanks precedent. \*\*Deliberate …"_ · Gen-3 `DOCS.md` § Out of scope: _"- **Cross-mount persistence** of learner code. … - **URL state.** None; persistence of study settings is orchestrator-domain. - **Program mutation / editing.** The lens is a read-only …"_                                                                                                                                                                                                                                          |             |               |      |
| `writeme-024` | A reader can find out why toggling a scaffold swaps an editor extension instead of rebuilding the editor.                               | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Why scaffold toggles use compartments: _"The four scaffold toggles (colorize / suggestions / comments / diff) each swap an editor extension on or off. The naive implementation — list the toggle states in the mount-effect deps and rebuild the `EditorView` on every change — …"_ · Gen-3 `DOCS.md` § Why scaffold toggles use compartments: the same opening block, verbatim.                                                                                                                                                                                                                                                                                                                                                  |             |               |      |
| `writeme-025` | A reader can find out why the learner sees feedback on first paint rather than having to switch it on.                                  | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Why default the editor to diff: _"The `diff` toggle defaults ON (feedback on), not off. A feedback-off default is a feedback-free box — the precise shape of the weak-shell failure this redo exists to prevent (per `./README.md` § Why this lens exists). Defaulting `diff` …"_ · Gen-3 `DOCS.md` § Why default the editor to diff: _"…A feedback-off default is a feedback-free box. Defaulting `diff` on makes the honest-feedback mechanism visible on first paint: …"_                                                                                                                                                                                                                                                       |             |               |      |
| `writeme-026` | A reader can find out why the read view shows the solution alone rather than the learner's code beside it.                              | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Why Read is the paired solution editor: _"The read view shows the solution in a **read-only editor configured to match the write editor** — a pair — not the learner's code beside it. The learner's typed code is never shown in Read; only the solution (mirroring `colorize`, and, …"_ · Gen-3 `DOCS.md` § Why Read is the paired solution editor: the same opening block, verbatim.                                                                                                                                                                                                                                                                                                                                            |             |               |      |
| `writeme-027` | A reader can find out why the lens counts reproduced lines honestly instead of scoring the learner on a concept-presence heuristic.     | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Why the honest line-count replaces the legacy score: _"The legacy `checkProgress` (legacy lines 405–473) computed an `overallProgress` that averaged a regex-concept-presence count (how many of ~10 patterns — `function`, `if`, `for`, `return`, … — appear in the learner's text vs the …"_ — **heading absent from the port** under the exact-match rule; candidate rename: port DOCS § Why the honest line-count is the feedback [measured 2026-08-16: prefix `Why the honest line-count` resolves **1** against the port's DOCS].                                                                                                                                                                                            |             |               |      |
| `writeme-028` | A reader can find out why the diff compares whole lines rather than characters.                                                         | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Why per-line (not per-char) diff: _"The `blanks` diff highlights per-character mismatches, which works only because its blanked source is **length-matched** to the original (each blanked token is replaced by an equal-length run of `_`), so character offset `i`in the …"_ · Gen-3`DOCS.md` § Why per-line (not per-char) diff: _"A per-character positional diff works only when the learner's document is **length-matched** to the original, …"_                                                                                                                                                                                                                                                                            |             |               |      |
| `writeme-029` | A reader can find out what the keep-comments toggle does once the learner has started typing.                                           | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Why keep-comments re-seeds only while pristine: _"The keep-comments toggle selects the starting template (comment skeleton vs blank slate). The question is what it does mid-exercise. The legacy guarded its student-editor seed effect with `studentEditorInitialized` (legacy lines 194 / …"_ · Gen-3 `DOCS.md` § Why keep-comments re-seeds only while pristine: _"…The question is what it does mid-exercise. Two failure modes bound the design: a dead control …"_                                                                                                                                                                                                                                                          |             |               |      |
| `writeme-030` | A reader can find out why flipping any scaffold leaves the learner's typed code, cursor and history intact.                             | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Why toggling a scaffold preserves learner code: _"Every scaffold toggle — colorize, suggestions, comments, diff — leaves the learner's typed code, cursor, and history intact, because none of them remounts the editor. The editor mounts once (mount-effect deps `[]`); colorize / …"_ · Gen-3 `DOCS.md` § Why toggling a scaffold preserves learner code: the same opening block, verbatim.                                                                                                                                                                                                                                                                                                                                     |             |               |      |
| `writeme-031` | A reader can find out why paste stays blocked even in the mode where the solution is already on screen.                                 | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Why paste is blocked in diff too: _"`blanks` permits paste in its `diff` mode because its placeholders are position-locked — a paste cannot smuggle the answer into the locked anchor regions. writeme has no anchors: the editor is a free-form document and the whole exercise …"_ — **heading absent from the port** under the exact-match rule; candidate rename: port DOCS § Why paste is always blocked [measured 2026-08-16: prefix `Why paste is` resolves **1** against the port's DOCS].                                                                                                                                                                                                                                 |             |               |      |
| `writeme-032` | A reader can find out exactly which files this lens owns, and by implication which it must not edit.                                    | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Module ownership: _"The lens owns its own `README.md`, `DOCS.md`, `types.ts`, source (`core.ts`, `lib/no-paste-extension.ts`, `lib/comment-skeleton.ts`, `lib/code-lines.ts`, `lib/diff-lines.ts`, `lib/diff-decorations.ts`, `lib/snippet-free-autocomplete.ts`, …"_ · Gen-3 `DOCS.md` § Module ownership: _"The lens owns its own `README.md`, `DOCS.md`, `types.ts`, source (`core.ts`, the `lib/` subsystems, `index.tsx`, `writeme.css`), and tests. …"_                                                                                                                                                                                                                                                                      |             |               |      |
| `writeme-033` | A reader can find the architecture-level deferrals separately from the README's feature-level ones.                                     | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Future direction: _"See [`./README.md` § Future direction](./README.md#future-direction) for the full list. Key directions in scope of this lens's evolution:"_ — **heading absent from the port's DOCS** [measured 2026-08-16: prefix `Future direction` resolves **0** there]. Distinct from `writeme-013`, the README's section of the same name, which does survive.                                                                                                                                                                                                                                                                                                                                                           |             |               |      |
| `writeme-034` | A reader can look up what the **Solution** is, and that the lens never mutates it.                                                      | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Solution** — the snippet's `embodiment.source.code`: the correct, complete…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |             |               |      |
| `writeme-035` | A reader can look up what **Learner code** is and where it lives.                                                                       | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Learner code** — the text the learner has typed into the write editor. Lives…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |             |               |      |
| `writeme-036` | A reader can look up what the **Write view** is and that it is paste-blocked.                                                           | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Write view** — the editable reconstruction surface: a CodeMirror editor the…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |             |               |      |
| `writeme-037` | A reader can look up what the **Read view** is and that no learner code is shown in it.                                                 | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Read view** — the read-only study surface: the solution in a \*\*read-only…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |             |               |      |
| `writeme-038` | A reader can look up what the **Diff (toggle)** scaffold switches on, on both sides of the pair.                                        | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Diff (toggle)** — the `diff` boolean scaffold. When on, the **write** editor…"_ — still defined in the port's `## Glossary`, verbatim to the wrap [measured 2026-08-16]. ⚠️ Instrument caveat: the published `glossterm` **as published when this cell was cut** returned nothing for this term on **either** side, because it interpolated the term into an awk regex where `(` and `)` are metacharacters; this cell was taken with the literal-prefix form `index($0, "- **" n "** —") == 1`, which `_TEMPLATE.md` adopted at `e8f81de8`. **Re-running today's published `glossterm` reproduces this cell** — the caveat records why the cell could not be taken mechanically at the time, not a live defect. |             |               |      |
| `writeme-039` | A reader can look up what the **Comment skeleton** preserves from the solution and what it strips.                                      | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Comment skeleton** — the write editor's optional starting template: the…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |             |               |      |
| `writeme-040` | A reader can look up what **Keep comments** selects between.                                                                            | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Keep comments** — the toggle that selects the starting template: the comment…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |             |               |      |
| `writeme-041` | A reader can look up what counts as a **Code line**, and that these are the only lines graded.                                          | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Code line** — a solution line that bears executable code (its text, with…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |             |               |      |
| `writeme-042` | A reader can look up what counts as a **Comment line**, and that such lines are ungraded freebies.                                      | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Comment line** — a solution line that is blank, whitespace-only, or…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |             |               |      |
| `writeme-043` | A reader can look up the closed set of per-line diff verdicts.                                                                          | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Line status** — the per-line diff verdict: `match` (learner's trimmed line…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |             |               |      |
| `writeme-044` | A reader can look up what **Diff** names as a mechanism — the per-line comparison itself, distinct from the toggle that switches it on. | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Diff** — the per-line comparison of learner code against the solution (line…"_ — **term absent from the port's glossary**: it carries 11 of the reference's 12 terms and this is the one it does not define [measured 2026-08-16]. ⚠️ Instrument caveat: a substring grep for `Diff` matches the surviving `- **Diff (toggle)**` bullet at port README line 99 and would report a false survival; exact bold-term equality is what separates them.                                                                                                                                                                                                                                                               |             |               |      |
| `writeme-045` | A reader can look up what **Paste-blocked** means and which paste routes are rejected.                                                  | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Glossary: _"- **Paste-blocked** — the write editor rejects keyboard (`Mod-V`) and…"_ — still defined in the port's `## Glossary` [measured 2026-08-16].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |             |               |      |

---

## Close conditions

**The Pass-1 gate** — run and recorded at the seeding commit, not asserted. Use
the **row-scoped** form in
[`_TEMPLATE.md` § Close conditions](./_TEMPLATE.md#close-conditions), never a
whole-file grep: this ledger explains the marker and names the banner in running
prose, so an unscoped `grep -c 'UNSETTLED'` returns **47** against 45 rows and
the banner counts **2** [measured 2026-08-16, this ledger]. Row-scoped, all
eight checks pass: 45 rows, 45 carrying `UNSETTLED`, banner once, zero `—`
cells, zero disposition values, zero `walked`/`found`/`Design owed`, ids
`001–045` with no gap or duplicate.

Campaign-close conditions, none of which this ledger yet meets:

- **Every** row has a non-empty `discharged by` that **resolves** — on any
  disposition (human ruling 2026-08-14);
  [§ At AR-5](../FIDELITY-METHOD.md#at-ar-5) is the single definition.
- **Open rows = 0**, under § At AR-5's four-part definition.
- **No `UNSETTLED` survives**, and the `PASS 1 — SEEDED` banner is gone.
- Every `restore — DEFERRED` row names an owner **and** a ruling, and the ruling
  resolves as a heading in the reference it cites.
- Pass 2 has run — a whole-file read by a **fresh** agent — and has opened the
  rows no lister could see. Three are already named for it in
  [§ Seed census](#seed-census)'s remainders, plus channel A's lines 168–174.
- Pass 3's counter-ledger has been run and can no longer answer either question
  ([§ Pass 3](../FIDELITY-METHOD.md#pass-3--the-counter-ledger)).
- This lens's row in [SPEC.md § Roll-up](../SPEC.md#roll-up) has no blank cells.
