<!-- TRANSITIONAL — this lens's fidelity ledger. Retires with SPEC.md, but only
once every row below carries a resolving `discharged by`. -->
<!-- cspell:ignore socratize dropdowns writeme parsons colorizing blankenate parsonizer -->
<!-- cspell:ignore colour distractor distractors ledgered throughs unrebutted -->
<!-- cspell:ignore Haden Explorotron underscored gsub RSTART RLENGTH oldd clauding -->
<!-- cspell:ignore firstblock glossterm behaviour -->
<!-- quoted verbatim from Gen-2 sources; do not "fix" the spelling: -->
<!-- cspell:ignore misordered lise -->

# `parsons` — fidelity ledger

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

**This ledger is the campaign's row-style reference** — the exemplar the other
seven are cut against. What it demonstrates is mostly **restraint**: 47 rows,
zero dispositions. `parsons-010` is the clearest case — it is
[FIDELITY-METHOD § Worked rows](../FIDELITY-METHOD.md#worked-rows)' own
`parsons-018`, whose disposition the method hands you outright
(`restore-as-doc`), and this ledger leaves the cell **empty** anyway, because
Pass 1 closes none. Its id is `parsons-010` and not `parsons-018`: the worked
ids are illustrative and not reserved (human ruling 2026-08-14).

---

## Reference inventory

Pasted from one run, not retyped.

```bash
REF=src/lib/study-lenses--deprecated-architecture/lenses/parsons
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
1:# lenses/parsons
37:## Public API
86:## Why this lens exists
122:## Glossary
167:## UI structure
244:## Pool + solution contract
262:### Interaction contract (native HTML5 DnD)
295:## Indent contract (when `canIndent`)
327:## Feedback contract (Check)
404:## View contract
425:## Feedback legend
437:## Hint blocks (educator `/* … */` guidance)
468:## Distractor-count hint
481:## Attempt history
507:## Edge cases
542:## What this lens does NOT do (lens-specific drops only)
581:## Two-layer module
641:## Dependencies (no install needed)
647:## Future direction
675:## Conventions inherited
692:## Navigation
== DOCS.md
1:# parsons — Architecture & Decisions
3:## Why this module exists
26:## Migration
53:## Modules
78:## Architectural sketch
85:### Execution phases
165:### Data flow
219:### Structural constraints
311:### Out of scope
336:## Phase-8 additions + browser-checkpoint reconciliations
431:## Why grade per-line independently (vs. the legacy sequential gate)
447:## Why a pure `arrange.ts` reducer (vs. inline drag handlers)
460:## Why restore the original LIS selection (vs. copying the parsonizer bug)
482:## Module ownership
492:## Future direction
== types.ts
     298 src/lib/study-lenses--deprecated-architecture/lenses/parsons/types.ts
30: * @remarks
69: * @remarks
101: * @remarks
129: * @remarks
148: * @remarks
166: * @remarks
198: * @remarks
212: * @remarks
250: * @remarks
277: * @remarks
```

⚠️ **The inventory command's type-declaration arm returned nothing, and that is
a real result rather than a broken command:**

```bash
grep -cE '^type |^\s+readonly ' "$REF/types.ts"   # -> 0 [measured 2026-08-15]
```

`parsons/types.ts` declares its members through `export type` and non-`readonly`
fields, so the type-contract universe that arm is supposed to enumerate is
carried entirely by the **10 `@remarks` blocks** above. Pass 2 reads the file in
full regardless; this note exists so a reviewer does not read the empty arm as a
skipped step. (The regex is shown in a fence rather than inline because both its
alternatives end in a significant space, which `MD038` forbids inside a code
span and prettier is free to wrap.)

**The port side**, which listers 1–3 diff against [measured 2026-08-15: `grep
-nE '^#+ '` over `src/lib/study-lenses/lenses/parsons/`]:

```text
== README.md            == DOCS.md
3:# parsons             3:# parsons — Architecture & Decisions
29:## The lens object    10:## Modules
49:## Configuration      36:## Execution phases
65:## UI structure       84:## Data flow
117:## Interaction contract (native HTML5 drag-and-drop)
138:## Indent contract (when `canIndent`)
150:## Feedback contract (Check)
187:## View contract      115:## Structural constraints
196:## Attempt history    141:## Decisions
206:## Edge cases         184:## Out of scope
221:## Future direction   194:## Navigation
234:## Navigation
```

**Gen-1 source**, for the provenance negative every non-G1 row owes
([§ The exemption needs evidence too](../FIDELITY-METHOD.md#the-exemption-needs-evidence-too)):
`ParsonsLens.jsx` **181** lines + `ParsonsLens.module.css` **664** lines, in the
Gen-1 tree [measured 2026-08-15: `wc -l`]. The `.jsx` is a thin `<iframe>` shell
over a vendored jQuery js-parsons port; the stylesheet describes a native board
it never rendered — which is what makes lister 4 the load-bearing instrument
here.

**Instruments that could run**, matching this lens's row in
[SPEC.md § Roll-up](../SPEC.md#roll-up): **1–5, over `src/lenses/` only.** All
five ran over the `ParsonsLens.jsx` / `.module.css` pair; **none has run over
Gen-1's second root**, `public/static/parsonizer/` — no lister can read that
shape yet, and building one is design work
([SPEC.md § Gen 1's second root](../SPEC.md#gen-1s-second-root--the-lens-file-is-often-only-a-shell)).

That is why this ledger carries **zero `G1-live` rows** while its own
`parsons-010`, `-028` and `-031` quote `component.js` and `lis.js` by name. The
gap is stated rather than left to be inferred from a thin result. Lister 5's
zero over `src/lenses/` is separately a **measured zero** rather than a limit —
see [§ Seed census](#seed-census).

---

## Source inventory

### Lister 4 — orphan CSS

Run verbatim from
[`_TEMPLATE.md` § Lister 4](./_TEMPLATE.md#lister-4--orphan-css) with `<Lens>` =
`ParsonsLens` [measured 2026-08-15]. **27 orphans of 37 defined classes**,
reproducing FIDELITY-METHOD § 4's published count exactly, in **3 clusters**:

```text
(prologue)	blockContent          Modal styles	guess-entry
(prologue)	blockHeader           Modal styles	guess-status
(prologue)	blockNumber           Modal styles	parsons-modal
(prologue)	blockType             Modal styles	parsons-modal-close
(prologue)	blocksContainer       Modal styles	parsons-modal-content
(prologue)	blocksPanel
(prologue)	checkButton           SL1 Parsonizer Integration	codeContainer
(prologue)	codeBlock             SL1 Parsonizer Integration	parsons-fallback
(prologue)	controls
(prologue)	dropMessage
(prologue)	emptyMessage
(prologue)	exerciseContent
(prologue)	feedback
(prologue)	hint
(prologue)	hintButton
(prologue)	insertZone
(prologue)	resetButton
(prologue)	solutionBlock
(prologue)	solutionContainer
(prologue)	solutionPanel
```

⚠️ **The partition is reproducible, not semantic.** The stylesheet carries 9
column-0 banners but the first is at line 287, so **20 of the 27 orphans fall
before any banner** and land in one undifferentiated `(prologue)` cluster
[measured 2026-08-15: `grep -n '^/\*' ParsonsLens.module.css` → 9 banners, first
at 287]. Reading the names, `(prologue)` plainly contains at least a board
(`blocksPanel`, `solutionPanel`, `insertZone`, `dropMessage`), a control bar
(`hintButton`, `resetButton`, `checkButton`, `controls`) and a feedback pair
(`hint`, `feedback`) — but **that reading is Pass 2's**, and Pass 2 splits
`parsons-045` by appending ids, never by renumbering.

**Both direct checks, run and recorded whether or not they found anything** —
FIDELITY-METHOD § 4 calls the counts a lower bound, but computed access and
kebab-case names make the error run in **both** directions:

- **Computed access:** none. [measured 2026-08-15: `grep -c 'styles\['
  ParsonsLens.jsx` → **0**]. So no orphan here is a false positive by that route
  — unlike `BlanksLens.jsx:735` and `WritemeLens.jsx:710`, which do use it.
- **Kebab-case orphans — six, and the lister cannot verify any of them**, since
  `styles.parsons-modal` is not expressible: `guess-entry`, `guess-status`,
  `parsons-fallback`, `parsons-modal`, `parsons-modal-close`,
  `parsons-modal-content`. Each direct-checked: **all six are absent from the
  `.jsx` in every form** [measured 2026-08-15: `grep -c
  "guess-entry\|guess-status\|parsons-fallback\|parsons-modal" ParsonsLens.jsx`
  → **0**], so all six are true orphans. A fact someone checked, which is the
  point.

### Lister 5 — switched-off code

**Channel B — zero, and it is a measured zero** [measured 2026-08-15]:

```bash
grep -nE '^// *export const (render|execute|renderConfig)' ParsonsLens.jsx  # (none)
grep -n '{false &&' ParsonsLens.jsx                                        # (none)
```

`ParsonsLens` has no suppressed exports and no falsy render guards. It is one of
the Gen-1 render lenses where channel B is silent — unlike `BlanksLens` (one
guard, hiding ~190 lines of hints UI) or `TracingLens`/`StepThroughsLens` (whose
`render` exports are commented out entirely). **Channel B therefore opens no
rows in this ledger.**

<details>
<summary>Channel A — candidate lines for Pass 2. A reading list, not a count.</summary>

```text
16   // Get current content from enliven file
23   // Build iframe URL with encoded code
38   // Handle iframe load
44   // Handle iframe error
50   // Fallback component for when iframe fails or code is empty
70   // Get iframe URL
73   // Show fallback if no code or URL generation failed
137  // sandbox="allow-scripts allow-same-origin"
170  // Parsons lens - unified interface
```

Eight of these nine are ordinary section comments. **Line 137 is not**, and it
is exactly the case FIDELITY-METHOD § 5 names as the reason channel A cannot be
counted: a commented-out iframe `sandbox` attribute is a security-relevant
suppression that "no reasonable code-shape regex catches, because the line looks
like prose". It is carried here **for Pass 2 to adjudicate**, and it opens no
row now.

</details>

### Seed census

| instrument         | hits               | rows opened | ids       | note                                                                      |
| ------------------ | ------------------ | ----------- | --------- | ------------------------------------------------------------------------- |
| lister 1/3 README  | 21 headings        | **19**      | `001–019` | less the H1 title; less `## Glossary`, whose terms seed at `034–044`      |
| lister 1/3 DOCS    | 15 headings        | **14**      | `020–033` | less the H1 title                                                         |
| lister 2           | ref 5 · port **0** | **0**       | —         | every `^#+ Why` is already a lister-1 row; lister 2 marks them, adds none |
| lister 3 glossary  | 11 terms           | **11**      | `034–044` |                                                                           |
| lister 4           | 27 orphans         | **3**       | `045–047` | clustered by the stylesheet's own banners                                 |
| lister 5 channel B | **0**              | **0**       | —         | measured zero, not an instrument limit                                    |
| lister 5 channel A | list of 9          | **0**       | —         | carried above for Pass 2; never counted                                   |
|                    |                    | **47**      | `001–047` |                                                                           |

**Remainders — instrument output that opened no row, named rather than
dropped:**

- **Four port-only headings**, which lister 1's diff produces from the port side
  and this ledger's seeding order does not reach: README `## The lens object`
  and `## Configuration` (jointly the candidate successor to ref
  `## Public API`, `parsons-001`); DOCS `## Decisions` and `## Navigation`.
  **`## Decisions` is the one that matters** — it is lister 2's corroborating
  signal, sitting where five named decisions used to be. A port-only heading
  carrying no reference ancestor is an `ADDITION` candidate, and `ADDITION` rows
  owe `walked`/`found`, which Pass 1 cannot write. **They are Pass 2's to
  open.**
- **Lister 2's ratio, which is a severity marker on rows that already exist:**
  ref **5** `^#+ Why` headings → port **0**, with **1** generic `## Decisions`
  appearing [measured 2026-08-15]. Note the convention: FIDELITY-METHOD § 2's
  table reads **4** for parsons because it counts DOCS-only `^## Why`; both
  documents at `^#+ Why[[:space:]]` gives **5**. Both reproduce — **do not
  "correct" the method's table.** The five are `parsons-002`, `-020`, `-029`,
  `-030`, `-031`.
- **Glossary literal-presence counts in the port**, evidence for Pass 2 and not
  a survival verdict: the port has **no `## Glossary` at all**, so no term is
  _defined_ there. Three terms have zero literal hits either —
  `Order correctness`, `Indent correctness`, `Line correctness`, the three
  graded states [measured 2026-08-15: `grep -ciF` over the port's README +
  DOCS].

---

## Rows

Columns and their rules: [§ Columns](../FIDELITY-METHOD.md#columns). What Pass 1
fills and what it leaves:
[`_TEMPLATE.md` § What Pass 1 writes](./_TEMPLATE.md#what-pass-1-writes-and-what-it-leaves)
— which also carries the `G3` exact-match rule, the
`heading absent from the port` wording, and the three permitted annotation
classes. This ledger follows them and does not restate them.

**Which extractor produced a cell is a property of the row's seed class, not a
blanket fact about the ledger.** A single "every quotation came from
`firstblock`" is false the moment a ledger carries a glossary, and every Gen-2
lens has one (8 of 8):

| rows        | seed class         | extractor                                                                        |
| ----------- | ------------------ | -------------------------------------------------------------------------------- |
| `001`–`033` | reference headings | `firstblock` — the cited section's first non-blank block, truncated at 240 chars |
| `034`–`044` | glossary terms     | `glossterm` — the term's own bullet, cut at the source's line wrap               |
| `045`–`047` | lister-4 clusters  | **neither** — a cluster row cites no heading, so it quotes no section            |

`…` marks the cut in both extractors. `\|` is `firstblock`'s pipe escape.

| #             | affordance                                                                                                                                                                                                                                    | provenance                  | evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | disposition | discharged by | gate |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------- | ---- |
| `parsons-001` | A reader can find the module's single default export and the frozen type it conforms to, named in one place.                                                                                                                                  | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Public API: _"The module's default export is a frozen `LensModule` per [`../types.ts`](../types.ts) § LensModule:"_ — **heading absent from the port**; candidate successors are port README §§ The lens object, Configuration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |             |               |      |
| `parsons-002` | A reader can find out what this exercise form isolates pedagogically, and the published work it comes from.                                                                                                                                   | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Why this lens exists: _"`parsons` is the learner's **assembly workbench**. A Parsons problem (Parsons & Haden 2006) gives the learner the correct lines of a program in scrambled order and asks them to assemble it. The pedagogy isolates \*\*program structure and …"_ — **heading absent from the port**; one of the five `^#+ Why` headings that fell to zero.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |             |               |      |
| `parsons-003` | A reader can find the lens's rendered DOM shape, including the view-mode and indent attributes a stylesheet or test keys off.                                                                                                                 | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § UI structure: _"`<div data-lens="parsons" data-view-mode="work\|complete" data-can-indent="true\|false">`"_ · Gen-3 `README.md` § UI structure: _"`<div data-lens="parsons" data-view-mode="work\|complete" data-can-indent="true\|false">`"_ — the heading and its opening block both survive.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |             |               |      |
| `parsons-004` | The learner starts every exercise with the pool shuffled, so the order lines appear in carries no information about the answer.                                                                                                               | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Pool + solution contract: _"- **Initial shuffle.** On mount, all solution lines and the selected distractors are placed in the available pool in a shuffled order (Fisher–Yates, bare `Math.random()` per the mechanical-conversion mandate — see [What this lens …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |             |               |      |
| `parsons-005` | A reader can find the drag interaction specified concretely, and the reason it is — the prior shell satisfied its tests and did nothing in a browser.                                                                                         | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Interaction contract (native HTML5 DnD): _"The drag interaction is the surface where the prior shell silently failed (it satisfied the structural contract but did nothing in a browser). The contract is therefore specified concretely, and the **arrangement logic is a pure reducer** …"_ — **heading absent from the port**; candidate rename to port README § Interaction contract (native HTML5 drag-and-drop), also re-levelled `###`→`##`.                                                                                                                                                                                                                                                                                                                                                                                                            |             |               |      |
| `parsons-006` | The learner can see a placed line's nesting depth as fixed-width guide steps rather than as a literal margin.                                                                                                                                 | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Indent contract (when `canIndent`): _"- Each placed line carries an **indent level** (non-negative integer), exposed semantically as `data-indent="N"`. In the **work view** the level is shown as `N` compact, fixed-width **guide steps** (`data-parsons-indent-step` — faint …"_ · Gen-3 `README.md` § Indent contract (when `canIndent`): _"Each placed line carries an indent level (`data-indent="N"`), shown in the work view as `N` compact fixed-width **guide steps** — a relative nesting cue, not a literal margin — with the indent/outdent buttons on the **right** so the …"_                                                                                                                                                                                                                                                                   |             |               |      |
| `parsons-007` | The learner can press Check and see every placed line resolve to exactly one graded state.                                                                                                                                                    | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Feedback contract (Check): _"Clicking **Check** grades the current arrangement and sets `data-correctness` on each placed line plus the aggregate score. The grader (`lib/evaluate.ts`) computes five internal states, but \*\*two of them never become learner-visible …"_ · Gen-3 `README.md` § Feedback contract (Check): _"Check grades the arrangement via `lib/evaluate.ts` and resolves each placed line to exactly one state under the precedence `distractor > wrong-order > wrong-indent > correct`:"_                                                                                                                                                                                                                                                                                                                                               |             |               |      |
| `parsons-008` | The learner can switch between working the board and reading the model solution in order.                                                                                                                                                     | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § View contract: _"- **Work view** (`data-view-mode="work"`) — the interactive pool + solution board described above. - **Complete view** (`data-view-mode="complete"`) — the model solution rendered read-only in `<pre data-parsons-complete>` (lines in …"_ · Gen-3 `README.md` § View contract: _"One `data-parsons-view-toggle` button flips between the work view (the board) and the complete view (`<pre data-parsons-complete>` — the model solution in order at literal `level * indentSize`, no distractors), seeding from …"_                                                                                                                                                                                                                                                                                                                        |             |               |      |
| `parsons-009` | The learner can open a collapsed legend that keys the per-line feedback, listing only the states they can act on.                                                                                                                             | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Feedback legend: _"A collapsible legend (`data-parsons-legend`, collapsed by default) keys the per-line feedback so a learner can read a Check result without guessing. It lists **only the three placed states a learner can act on** — `correct` / …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |             |               |      |
| `parsons-010` | An educator can attach guidance to the exercise by embedding a block comment in the snippet, extracted with its surrounding whitespace.                                                                                                       | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Hint blocks (educator `/* … */` guidance): _"The educator may embed **hint blocks** in the snippet as C-style block comments. Ported faithfully from the legacy JSParsons parsonizer (`component.js`): each `/* … */` block (with its surrounding horizontal whitespace) is \*\*extracted …"_ — **heading absent from the port**. This is FIDELITY-METHOD § Worked rows' `parsons-018`; its disposition is Pass 2's.                                                                                                                                                                                                                                                                                                                                                                                                                                           |             |               |      |
| `parsons-011` | The learner can find out that some pool lines do not belong, from a collapsed hint that appears only when the exercise has distractors.                                                                                                       | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Distractor-count hint: _"When the exercise includes distractors, a `data-parsons-distractor-count` hint (`<details>`, collapsed; shown only when N > 0) signals that some pool lines do not belong. **The exact count is a spoiler** (it tells the learner how many …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |             |               |      |
| `parsons-012` | The learner can open a modal listing every Check they have made since this lens mounted.                                                                                                                                                      | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Attempt history: _"Each **Check** appends an `Attempt` (see [`./types.ts`](./types.ts)) to an in-mount history. A `data-parsons-history-open` control **in the toolbar** opens a modal (`data-parsons-history-modal`, `role="dialog"`, closed by a …"_ · Gen-3 `README.md` § Attempt history: _"Each Check appends an `Attempt` to in-mount history; a toolbar button opens a modal (`role="dialog"`, closed by button or Escape) listing every attempt — number, pass/fail, score, and a read-only \*\*snapshot of the arrangement as it was …"_                                                                                                                                                                                                                                                                                                              |             |               |      |
| `parsons-013` | A reader can find out what the lens does with a degenerate program, and why an empty one scores 100.                                                                                                                                          | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Edge cases: _"- **Empty snippet** (`embodiment.source.code === ''`). No solution lines, no distractors; pool and solution both empty; Check reports `total === 0` → score 100% (vacuously complete). `evaluate-line-order.ts` \*\*short-circuits on zero …"_ · Gen-3 `README.md` § Edge cases: _"- **Empty program** — pool and solution both empty; Check scores 100 (vacuously complete); the order evaluator short-circuits before the LIS. - **Single solution line** — a degenerate exercise; still offered (the gate is total; …"_                                                                                                                                                                                                                                                                                                                       |             |               |      |
| `parsons-014` | A reader can find every affordance this lens deliberately does not offer, each with its reason.                                                                                                                                               | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § What this lens does NOT do (lens-specific drops only): _"Inherited from the lenses peer (single-writer state, disposable practice, no `embody/`-top imports, no consumer branching on `source.code`): see [`../README.md` § Conventions](../README.md#conventions). Lens-specific drops vs. the …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |             |               |      |
| `parsons-015` | A reader can find which file holds which layer, and why the core is split one file per internal subsystem.                                                                                                                                    | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Two-layer module: _"Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the lens lives across the two required layers (pure-TS core + React wrapper). The core is split into a `lib/` subdirectory with one file per internal subsystem so …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |             |               |      |
| `parsons-016` | A reader can find out that this lens adds no dependency beyond React, and that it does not parse.                                                                                                                                             | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Dependencies (no install needed): _"- **None beyond React.** Native HTML5 Drag-and-Drop is a browser API; the LIS and parsing algorithms are vendored as in-tree TS. No drag library, no jQuery, no AST parser (parsons does not parse)."_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |             |               |      |
| `parsons-017` | A reader can find what this lens defers, and the restoration path for each deferral.                                                                                                                                                          | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Future direction: _"- **WS2 `recommend()`.** Lens ships with `recommend: () => []`. Once WS2's analysis surface lands, `recommend(embodiment)` populates Block-Model placements and down-ranks snippets too trivial to order (single-line, or all-flat). - …"_ · Gen-3 `README.md` § Future direction: _"- **`recommend`** — propose next steps and down-rank programs too trivial to order (single-line, all-flat). - **Seeded RNG** — the shuffle and distractor selection take an injectable `random` (already threaded through …"_                                                                                                                                                                                                                                                                                                                         |             |               |      |
| `parsons-018` | A reader can find which peer conventions bind this lens and how they apply here specifically.                                                                                                                                                 | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Conventions inherited: _"Follows all conventions in [`../README.md`](../README.md) and [`../DOCS.md`](../DOCS.md). Notable lens-specific application:"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |             |               |      |
| `parsons-019` | A reader can reach every sibling document of this lens from its README.                                                                                                                                                                       | `G2-doc` + `G3` + UNSETTLED | Gen-2 `README.md` § Navigation: _"- **Parent**: [`../README.md`](../README.md) — lenses peer. - **Architectural sketch**: [`./DOCS.md`](./DOCS.md). - **Type contract**: [`./types.ts`](./types.ts). - **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + …"_ · Gen-3 `README.md` § Navigation: _"- Region: [`../README.md`](../README.md) — the lens kind's mechanics. - [`DOCS.md`](./DOCS.md) — this lens's architectural sketch and decisions. - [`types.ts`](./types.ts) — the lens-local domain model. - Kind contract: …"_                                                                                                                                                                                                                                                                                                                                    |             |               |      |
| `parsons-020` | A reader can find out what the module is for, in the learner's terms, before reading any of its structure.                                                                                                                                    | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Why this module exists: _"The `parsons` lens is the learner's **assembly workbench**: a place to reconstruct a program from its scrambled lines. The learner sees the snippet's lines shuffled into an available pool (mixed with optional distractor lines that do not …"_ — **heading absent from the port**; one of the five `^#+ Why` headings that fell to zero.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |             |               |      |
| `parsons-021` | A reader can find out where this lens came from and what its predecessor actually shipped.                                                                                                                                                    | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Migration: _"The pre-refactor lens lived at `zz--…/spiral-lens/src/lenses/ParsonsLens.jsx` — a thin React shell that `encodeURIComponent`'d the source into a sandboxed `parsons-iframe.html?code=…`. The pedagogy lived inside that iframe in the …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |             |               |      |
| `parsons-022` | A reader can find a per-file table naming each module's layer and purpose.                                                                                                                                                                    | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Modules: _"\| File \| Layer \| Purpose …"_ (a table; the extractor takes its first line) · Gen-3 `DOCS.md` § Modules: _"\| File \| Layer \| Purpose …"_ — heading survives on both sides.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |             |               |      |
| `parsons-023` | A reader can find the structural target the implementation was held against, written before any code.                                                                                                                                         | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Architectural sketch: _"> Written Phase 0, before implementation. The Refactor step of each increment is > held against this sketch. Domain terms only — no function names, no variable > names, no pseudocode (React hook names like `useState` / `useReducer` / > …"_ — **heading absent from the port**, whose four `###` children were promoted to `##`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |             |               |      |
| `parsons-024` | A reader can find the ordered phases a mount passes through, from config resolution onward.                                                                                                                                                   | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Execution phases: _"1. **Mount + resolve config** (sync, pure) — the orchestrator passes a frozen embodiment and a frozen lens config via props. The wrapper reads four known config fields (`canIndent`, `maxDistractors`, `indentSize`, `viewMode`) with …"_ · Gen-3 `DOCS.md` § Execution phases: _"1. **Mount + resolve config** (sync, pure) — the orchestrator mounts `main` with the frozen embodiment and resolved config. The component reads the four known fields with their defaults; view mode seeds from config into local state."_ (re-levelled `###`→`##`)                                                                                                                                                                                                                                                                                       |             |               |      |
| `parsons-025` | A reader can find the module's data path as a diagram rather than as prose.                                                                                                                                                                   | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Data flow: _"flowchart TD"_ (a Mermaid fence; the extractor takes its first line) · Gen-3 `DOCS.md` § Data flow: _"flowchart TD"_ (re-levelled `###`→`##`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |             |               |      |
| `parsons-026` | A reader can find the constraints the implementation must not violate, stated separately from what it does.                                                                                                                                   | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Structural constraints: _"- **Two-layer module shape** — `core.ts` + the files under `lib/` do NOT `import React`. `lib/lis.ts`, `lib/parse-parsons.ts`, `lib/evaluate*.ts` (the two evaluators + the composing `lib/evaluate.ts`), and `lib/arrange.ts` are pure …"_ · Gen-3 `DOCS.md` § Structural constraints: _"- **Two-layer module.** `core.ts` and `lib/` import no React; `index.tsx` is the only React file. Heavy derivation lives in the core; the component renders what the core derives. - **Purity rule.** The lens imports no runtime value …"_                                                                                                                                                                                                                                                                                                  |             |               |      |
| `parsons-027` | A reader can find what the lens deliberately leaves to another owner, separately from what it defers.                                                                                                                                         | `G2-doc` + `G3` + UNSETTLED | Gen-2 `DOCS.md` § Out of scope: _"- **Cross-mount persistence of the arrangement / feedback.** Per-mount React state only; nothing survives unmount. - **URL state.** v1 ships none (legacy parsons had none beyond `?code=`). A Future-direction item; would lift to the …"_ · Gen-3 `DOCS.md` § Out of scope: _"- **Cross-mount persistence** of the arrangement, feedback, or history. - **URL state** — orchestrator domain, not a per-lens surface. - **Program mutation** — the lens is a read-only view; the source changes only through the …"_                                                                                                                                                                                                                                                                                                                            |             |               |      |
| `parsons-028` | A reader can find the four parity features a second design pass added, and which browser gate reshaped each.                                                                                                                                  | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Phase-8 additions + browser-checkpoint reconciliations: _"> The wrapper's UX was reshaped at the per-increment browser gates, and a second > DDD pass added four parsonizer-parity features (read faithfully from the > legacy `…/parsonizer/component.js`). These are the deltas to the sketch phases …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |             |               |      |
| `parsons-029` | A reader can find out why the grader marks each line independently rather than stopping at the first error.                                                                                                                                   | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Why grade per-line independently (vs. the legacy sequential gate): _"The legacy `LineBasedGrader` stops at the first error class and only marks lines correct when the whole arrangement is error-free — so a learner with one misordered line gets a wall of nothing on every other line, and never sees indent …"_ — **heading absent from the port**; candidate successor is the first bullet of port DOCS § Decisions.                                                                                                                                                                                                                                                                                                                                                                                                                                       |             |               |      |
| `parsons-030` | A reader can find out why arrangement transitions are a pure reducer rather than logic inside the drag handlers.                                                                                                                              | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Why a pure `arrange.ts` reducer (vs. inline drag handlers): _"The prior shell died in the browser despite passing tests — the interaction layer was the gap. Native HTML5 DnD cannot be exercised by jsdom, so RTL component tests cannot prove drag works. Extracting the arrangement transitions into a …"_ — **heading absent from the port**; candidate successor is a bullet of port DOCS § Decisions.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |             |               |      |
| `parsons-031` | A reader can find out which of two vendored LIS lineages this lens restored, and what the other one got wrong.                                                                                                                                | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Why restore the original LIS selection (vs. copying the parsonizer bug): <em>"There are two vendored lineages of the LIS code. The original `Explorotron/libs/js-parsons/lib/lis.js` uses underscore: `best_lise` selects the maximal-consecutive-run subsequence via `_.max(scores, s => s.score)`. The de-underscored …"</em> — **heading absent from the port**; candidate successor is a bullet of port DOCS § Decisions. ⚠️ Instrument caveat: quoted in `<em>` rather than `_…_` because the block carries a code span holding an underscore, which breaks prettier's emphasis pairing for the rest of the cell — the closing marker had been escaped and the quotation left unterminated, so the published transport check read this row as carrying no quotation at all [measured 2026-08-17: `0 of 1 cited` before, clean after].                       |             |               |      |
| `parsons-032` | A reader can find out exactly which files this lens owns, and by implication which it must not edit.                                                                                                                                          | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Module ownership: _"The lens owns its own `README.md`, `DOCS.md`, `types.ts`, source (`core.ts`, `lib/lis.ts`, `lib/parse-parsons.ts`, `lib/evaluate-line-order.ts`, `lib/evaluate-indentation.ts`, `lib/evaluate.ts`, `lib/arrange.ts`, `index.tsx`), and tests. …"_ — **heading absent from the port**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |             |               |      |
| `parsons-033` | A reader can find the architecture-level deferrals separately from the README's feature-level ones.                                                                                                                                           | `G2-doc` + UNSETTLED        | Gen-2 `DOCS.md` § Future direction: _"See [`./README.md` § Future direction](./README.md#future-direction) for the full list. Key directions in scope of this lens's evolution:"_ — **heading absent from the port's DOCS**. Distinct from `parsons-017`, the README's section of the same name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |             |               |      |
| `parsons-034` | A reader can look up what a **Parsons problem** is without leaving the module.                                                                                                                                                                | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Parsons problem** — an exercise where the learner reconstructs a program by…"_ — the port carries **no `## Glossary` heading at all**, so no term below is _defined_ there [measured 2026-08-15].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |             |               |      |
| `parsons-035` | A reader can look up what counts as a **Solution line**, and what is excluded from the count.                                                                                                                                                 | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Solution line** — a non-blank line of the snippet that is **not** a…"_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |             |               |      |
| `parsons-036` | A reader can look up how a **Distractor** is marked in the source.                                                                                                                                                                            | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Distractor** — a line whose source ends with the `// distractor` marker. It…"_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |             |               |      |
| `parsons-037` | A reader can look up what the **Available pool** contains.                                                                                                                                                                                    | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Available pool** — the column of shuffled lines (solution lines +…"_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |             |               |      |
| `parsons-038` | A reader can look up what the **Solution column** is and that its order is meaningful.                                                                                                                                                        | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Solution column** — the column the learner drags lines **into**, in order;…"_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |             |               |      |
| `parsons-039` | A reader can look up what an **Indent level** is and that it is a non-negative integer.                                                                                                                                                       | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Indent level** — a line's nesting depth as a non-negative integer (0 = no…"_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |             |               |      |
| `parsons-040` | A reader can look up what **Order correctness** means as a graded state.                                                                                                                                                                      | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Order correctness** — whether a placed line participates in a correct…"_ — **zero literal hits anywhere in the port** [measured 2026-08-15: `grep -ciF`].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |             |               |      |
| `parsons-041` | A reader can look up what **Indent correctness** means, and that it is judged only on order-correct lines.                                                                                                                                    | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Indent correctness** — whether a placed, order-correct line's indent level…"_ — **zero literal hits anywhere in the port** [measured 2026-08-15].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |             |               |      |
| `parsons-042` | A reader can look up the closed set of per-line graded states.                                                                                                                                                                                | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Line correctness** — the per-line graded state, one of: `correct`,…"_ — **zero literal hits anywhere in the port** [measured 2026-08-15].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |             |               |      |
| `parsons-043` | A reader can look up what the **Score** is a percentage of.                                                                                                                                                                                   | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Score** — the aggregate percentage of solution lines that are fully correct…"_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |             |               |      |
| `parsons-044` | A reader can look up what the **Check** action does.                                                                                                                                                                                          | `G2-doc` + UNSETTLED        | Gen-2 `README.md` § Glossary: _"- **Check** — the learner action that grades the current arrangement and renders…"_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |             |               |      |
| `parsons-045` | Twenty class definitions in the stylesheet's pre-banner region — `blocksPanel`, `solutionPanel`, `insertZone`, `dropMessage`, `checkButton` among them — describe UI surfaces the shipped 181-line `<iframe>` shell never renders.            | `G1-dead` + UNSETTLED       | Gen-1 `ParsonsLens.module.css`, lister-4 cluster `(prologue)` — **20 orphan classes**: `blockContent`, `blockHeader`, `blockNumber`, `blockType`, `blocksContainer`, `blocksPanel`, `checkButton`, `codeBlock`, `controls`, `dropMessage`, `emptyMessage`, `exerciseContent`, `feedback`, `hint`, `hintButton`, `insertZone`, `resetButton`, `solutionBlock`, `solutionContainer`, `solutionPanel`. None referenced from `ParsonsLens.jsx`, which ships a 181-line `<iframe>` shell [measured 2026-08-15]. ⚠️ Cluster boundary is the stylesheet's first banner (line 287), not a semantic reading — Pass 2 splits by appending ids.                                                                                                                                                                                                                                               |             |               |      |
| `parsons-046` | Five class definitions under the stylesheet's `Modal styles` banner — `parsons-modal`, `parsons-modal-content`, `parsons-modal-close`, `guess-entry`, `guess-status` — describe a modal surface the shipped `<iframe>` shell never renders.   | `G1-dead` + UNSETTLED       | Gen-1 `ParsonsLens.module.css`, lister-4 cluster `Modal styles` — **5 orphan classes**: `guess-entry`, `guess-status`, `parsons-modal`, `parsons-modal-close`, `parsons-modal-content`. All five are kebab-case, so `styles.<name>` cannot express them; each direct-checked absent from the `.jsx` in every form [measured 2026-08-15].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |             |               |      |
| `parsons-047` | Two class definitions under the stylesheet's `SL1 Parsonizer Integration` banner — `codeContainer`, whose seven descendant rules style the in-page parsonizer's own markup, and `parsons-fallback` — are unreferenced from the shipped shell. | `G1-dead` + UNSETTLED       | Gen-1 `ParsonsLens.module.css`, lister-4 cluster `SL1 Parsonizer Integration` — **2 orphan classes**: `codeContainer`, `parsons-fallback`. `parsons-fallback` is kebab-case and direct-checked absent [measured 2026-08-15]. `codeContainer` carries a base rule plus **7** descendant rules for the parsonizer's own markup — `.parsons-exercise`, `.sortable-code`, `.parsons-text`, `.parsons-controls`, `.parsons-button`, `.parsons-button:hover`, `.parsons-feedback` [measured 2026-08-16: `grep -nE '^\s*\.codeContainer'`]. ⚠️ Instrument caveat, per the live-sibling rule the lister structurally cannot apply: `.fallbackContainer` **is** referenced at `ParsonsLens.jsx:52` and defined 3× [measured 2026-08-16], so a styled fallback **does** render — via the distinct, referenced `.fallbackContainer`, not via the orphaned `parsons-fallback` in this cluster. |             |               |      |

---

## Close conditions

**The Pass-1 gate** — run and recorded at the seeding commit, not asserted. Use
the **row-scoped** form in
[`_TEMPLATE.md` § Close conditions](./_TEMPLATE.md#close-conditions), never a
whole-file grep: this ledger explains the marker and names the banner in running
prose, so an unscoped `grep -c 'UNSETTLED'` returns **51** against 47 rows and
the banner counts **2** [measured 2026-08-15 — this ledger is what found that
defect in the check as first published]. Row-scoped, all eight checks pass: 47
rows, 47 carrying `UNSETTLED`, banner once, zero `—` cells, zero disposition
values, zero `walked`/`found`/`Design owed`, ids `001–047` with no gap or
duplicate.

Campaign-close conditions, none of which this ledger yet meets:

- **Every** row has a non-empty `discharged by` that **resolves** — on any
  disposition (human ruling 2026-08-14);
  [§ At AR-5](../FIDELITY-METHOD.md#at-ar-5) is the single definition.
- **Open rows = 0**, under § At AR-5's four-part definition.
- **No `UNSETTLED` survives**, and the `PASS 1 — SEEDED` banner is gone.
- Every `restore — DEFERRED` row names an owner **and** a ruling, and the ruling
  resolves as a heading in the reference it cites.
- Pass 2 has run — a whole-file read by a **fresh** agent — and has opened the
  rows no lister could see. Four are already named for it in
  [§ Seed census](#seed-census)'s remainders, plus channel A's line 137.
- Pass 3's counter-ledger has been run and can no longer answer either question
  ([§ Pass 3](../FIDELITY-METHOD.md#pass-3--the-counter-ledger)).
- This lens's row in [SPEC.md § Roll-up](../SPEC.md#roll-up) has no blank cells.
