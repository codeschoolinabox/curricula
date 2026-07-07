# question-orchestrator

A pure composition lib that runs **qualitatively different question sources**
over one snippet and returns a single, coverage-aware, difficulty-laddered item
stream placed on the shared **Block Model** grid.

It is the reconciliation layer for the curriculum's two question **registers** —
the **open / Socratic** register ([`socratizing`](../../orchestrate/lib/socratizing/README.md),
"why is it written this way?") and the **closed / gradable** register
([`quizzing`](../quizzing/README.md), "what kind of element is this?"). Neither
lib knows about the other; this module is where a learning environment "places
both registers on one grid" (the phrasing is [quizzing's own](../quizzing/README.md)
— this lib makes it real).

> **Design stage.** This module is specified here (`README.md`, `types.ts`,
> `DOCS.md`); its entry function and source adapters are not yet built. Which
> lenses consume the stream is a boundary described in
> [DOCS.md § Consumers](./DOCS.md).

## Glossary (ubiquitous language)

| Term | Meaning |
| --- | --- |
| **register** _(here)_ | A whole _kind_ of question: `open` (Socratic, non-gradable prose) or `closed` (machine-gradable). This is quizzing's "two registers of the same Block Model" axis, and it is the `OrchestratedItem` discriminant (`OrchestratedRegister`). **Not** socratizing's `QuestionRegister` (`open \| pointed \| comparative`, `socratizing/types.ts:168`), which is a finer rhetorical axis tagging each _inner_ `Question`. **Nesting hazard:** an `OrchestratedItem` whose `register` is `'open'` contains `question.questions[]`, each carrying its own `QuestionRegister` — the token `'open'` legitimately appears at both levels with different meanings. Consumers read the two axes at their own levels. |
| **source** | A registered generator of items — the orchestrator-level plug-in. `quizzing-source`, `socratizing-source`, and future sources. One level **above** quizzing's own internal generator registry. A source may emit items of either register. |
| **generator** | quizzing's _internal_ unit (V1, V8, …) — NOT this lib's concern. A source may wrap a whole lib that itself has many generators. "Source" and "generator" are two registry levels (and two `registry.ts` files — `sources/registry.ts` here vs quizzing's `generators/registry.ts`); keep them distinct. |
| **`OrchestratedItem`** | The unified item this lib emits — a discriminated union (`register: 'open' \| 'closed'`) whose base holds the _computed shared coordinate_ and whose arms each carry their **native, frozen** item by reference. Never forks or widens `QuizItem`/`CodeQuestion`. |
| **`anchorOffsets`** | The one coordinate BOTH registers share: a normalized `[start, end)` half-open **character-offset** span into `source.code`. It is what lets a consumer co-anchor items across registers — the lens's `itemsAt` keys on it — because the two libs' native anchors are in different coordinate systems (see below). |
| **coverage** | Which Block Model cells the delivered set spans, plus the cells no delivered item covers (the gaps) — the "one grid" made auditable. Report only; the orchestrator cannot generate an item to fill a gap no source emitted. |

## Why this lib (value-add over either register alone)

`socratizing` and `quizzing` are each complete within their register. But four
things are irreducibly **cross-register** and belong to neither:

| Cross-register concern | Why neither lib can do it |
| --- | --- |
| **Place both registers on one grid** | Each lib emits only its own register's items; only a layer above both can merge them into one item model on the shared `BlockCell` grid. |
| **Normalize anchors to one coordinate** | quizzing anchors in **character offsets**; socratize in **line/column**. Normalizing both to offsets (`anchorOffsets`) is what lets a _consumer_ co-anchor items across registers (e.g. the lens's `itemsAt`) — neither lib can, since each only knows its own coordinate. |
| **Coverage-report the combined pool** | Coverage across the Block Model grid is meaningful only over _both_ registers' delivered items together. |
| **Ladder across registers** | Ordering `atom → block → relation → macro` across a mixed open+closed stream is a whole-set concern. |

This lib owns **only** those concerns. It does **not** re-implement filtering,
grading, generation, or co-anchoring itself — filtering/grading/generation stay
in the source libs, and co-anchoring is a _consumer_ act on the `anchorOffsets`
this lib provides (see § Design constraints).

## The two registers, reused as-is

Both arms carry their **native, frozen** item by reference — neither lib's type
is forked, widened, or projected. The `OrchestratedItem` **base** carries only
what the orchestrator _computes_: a namespaced `id`, the `sourceId`, the
normalized `anchorOffsets`, and a unified `cells` view of the Block Model grid.

- **Closed — [`quizzing`](../quizzing/README.md).** `generateQuiz(embodiment, classified, filter?) → readonly QuizItem[]`, graded by `grade(item, response) → Verdict`. Every `QuizItem` carries machine-derived ground truth. The closed arm holds the whole `QuizItem` (`item: QuizItem`) — grading and mastery need all of it.
- **Open — [`socratizing`](../../orchestrate/lib/socratizing/README.md).** `analyzeMicroDecisions(embodiment) → { ok, questions: readonly CodeQuestion[] }`. Prose questions, no answer key. The open arm holds the whole `CodeQuestion` (`question: CodeQuestion`) — including its stable `id` (which socratizing defines for exactly the shown/dismissed adaptive-fading a Socratic consumer wants).

Carrying both natively (rather than projecting one) is **symmetric and lossless**,
and honors "reuse both registers as-is": the base is the shared grid coordinate;
the arm is the untouched source object.

Both libs already tag items with the **same** `BlockCell` type (quizzing
deep-imports it from socratizing — `quizzing/types.ts:21`), which is why "one
grid" needs no mapping: the base `cells` is `item.cells` (closed) or
`question.block` (open), unchanged.

## The source registry (extensibility)

Each source implements one contract and is appended to a registry array:

```ts
type QuestionSource = Readonly<{
	id: string; // 'quizzing' | 'socratizing' | future…
	run: (inputs: SourceInputs) => readonly OrchestratedItem[];
}>;
```

The orchestrator builds the **shared inputs once** (`SourceInputs = { embodiment, classified, config }`)
and runs every source (`SOURCES.flatMap(run)`). A source reads only what it needs
off `inputs`, including its **own** filter slice off `config.sources` by a
literal key (the quizzing source reads `config.sources?.quizzing`; the socratize
source reads `config.sources?.socratizing`) — never a dynamic index. **Adding a
new kind of question generator** — the user's core requirement — is: write one
adapter that returns `OrchestratedItem[]`, append it to the registry, and (only
if it takes filter config) add its key to `CompositionConfig.sources`. No edits
to the item model or the composition pass.

**On async.** `run` and `composeQuestions` are **synchronous** today. An
LLM-backed source would be async — a _localized, deliberate_ change (widen `run`
to a `Promise`, make `composeQuestions` `async`), **not** zero-change, since
`composeQuestions → Promise<QuestionSet>` is a breaking change consumers adopt.
We keep the sync contract now rather than ship an inert `T[] | Promise<T[]>`
union the sync pass cannot honor; the `QuestionSet` **shape** is stable across
that change. (Open question for the gate — see [DOCS.md](./DOCS.md).)

## The composition model

```text
composeQuestions(embodiment, config?)
  -> if !embodiment.status.parsed: return { items: [], coverage: reportCoverage([], targets) }  — degenerate (spanned [], gaps = configured targets)
  -> build shared inputs ONCE: { embodiment, classifyTokens(embodiment), config }
  -> SOURCES.flatMap(source.run(inputs))      — closed + open + …; each adapter total
                                                (defends its source, [] on failure), and
                                                reads its own config.sources slice
  -> ladder    — order by most-concrete Block level (see rank rule below)
  -> cap       — config.count, applied last
  -> report coverage OVER THE FINAL items      — spanned + gaps, so it describes what shipped
  -> QuestionSet { items, coverage }
```

**Unparseable embodiment (the degenerate path).** The two sources fail
differently — `generateQuiz` **throws** on an unparsed snippet, while
`analyzeMicroDecisions` returns `{ ok: false }`. `composeQuestions` therefore
gates on `embodiment.status.parsed` up front and returns — **before** running any
source — a set with no items, its coverage reported over the empty item pool
(`spanned: []`, and every configured coverage target is a gap): nothing shipped,
so nothing is covered. Each adapter additionally defends its own call
(try/catch → `[]`). The function is total — it never throws.

**Ladder rank (mixed / multi-cell / zero-cell).** An item carries `cells:
BlockCell[]` — possibly several levels, possibly none. The default rank is the
item's **most-concrete** level present (`atom < block < relation < macro`); ties
break by source order; **zero-cell items sort last** (unleveled). This default is
a gate question (see DOCS § Open questions).

**Anchor normalization.** quizzing's `QuizItem.anchorRange` is character offsets;
socratize's `CodeQuestion.location` is a line/column `SourceRange`. The base
`anchorOffsets` normalizes both to offsets: the closed arm copies its native
offsets; the open arm projects `(line, column)` via the offset index the
embodiment already ships — `embodiment.source.offsets[line - 1] + column`
(the canonical formula documented on `Source`). It is an O(1) lookup, not a
newline scan; still worth a focused test for multi-line and program-level spans.

## API

### `composeQuestions`

```ts
function composeQuestions(
	embodiment: Snippet,
	config?: CompositionConfig,
): QuestionSet;
```

Pure function. Reads source + AST from the embodiment (never re-derives beyond
the one classify pass). Mirrors the sibling libs' `embodiment`-first contract.
Total: returns a set with no items (coverage reported over the empty pool) on an
unparsed embodiment, never throws.

```ts
// QuestionSet — a frozen composed set over both registers
{
  items: readonly OrchestratedItem[],   // may be empty
  coverage: CoverageReport,             // spanned cells + gaps, over the delivered items
}
```

The success field is **`items`** (not `questions`) — deliberately distinct from
socratize's inner `Question[]` and from `CodeQuestion.questions`.

### Configuration

All fields optional. Per-source filters pass **straight through** to each source's
own native filter — this lib does not re-implement filtering.

```ts
type CompositionConfig = {
	// Native per-source filters, forwarded unchanged, keyed by source id.
	// New sources add their own key.
	sources?: {
		quizzing?: QuizFilter; // NOTE: quizzing's `filter` is a no-op stub today
		// (accepted-and-ignored upstream); forward-compatible, not yet active.
		socratizing?: MicroDecisionConfig; // socratize's filter IS implemented.
	};

	// Coverage targets on the shared Block Model grid: which cells the report
	// scores gaps against. Omitted = report over whatever the delivered set covers.
	coverage?: {
		cells?: readonly BlockCell[];
	};

	// Order items atom -> block -> relation -> macro. Default: true.
	ladder?: boolean;

	// Max items in the composed set (0 or omitted = no cap). Applied LAST, after
	// ladder and before the coverage report.
	count?: number;
};
```

**`count` interaction.** Coverage is computed **last**, over the delivered
`items`, so it always describes what shipped. Any cap — a per-source
`count` (`QuizFilter.count` / `MicroDecisionConfig.count`, which truncates that
source before the merge) or the composition-level `count` — that drops a cell's
only item will show that cell as a gap. If you want maximum coverage, cap loosely.

## Structure

| File | Purpose |
| --- | --- |
| `types.ts` | All domain types (`OrchestratedItem`, `OrchestratedRegister`, `QuestionSource`, `SourceInputs`, `QuestionSet`, `CoverageReport`, `CompositionConfig`) |
| `compose-questions.ts` | Main entry point — default-exported pure fn (gate → shared inputs → run sources → ladder → cap → coverage → freeze) |
| `sources/registry.ts` | The source registry (the `SOURCES` array) |
| `sources/quizzing-source.ts` | Adapter: `generateQuiz` → closed `OrchestratedItem`s |
| `sources/socratizing-source.ts` | Adapter: `analyzeMicroDecisions` → open `OrchestratedItem`s (incl. the `source.offsets` line/col→offset projection) |
| `ladder.ts` | Order the merged stream by Block level (the rank rule above) |
| `report-coverage.ts` | Spanned-cells + gaps over the delivered items (`CoverageReport`) |
| `tests/` | Unit and integration tests |

The `sources/` adapters and their registry are built; `ladder.ts`,
`report-coverage.ts`, and `compose-questions.ts` land in the remaining
increments. (The empty
[`../../orchestrate/lib/recommender/`](../../orchestrate/lib/recommender/) folder
is a thin precedent for a lib registered before it is built.)

## Consumers (a boundary, built elsewhere)

This lib emits a unified stream; lenses render it. What this lib owns vs. what a
consumer owns:

- **This lib owns:** running the sources, the shared grid coordinate (incl.
  normalized `anchorOffsets`), coverage reporting, laddering, capping.
- **A closed consumer** (the `quiz` lens) owns rendering + grading + mastery over
  `register: 'closed'` items — reading each item's native `QuizItem` for `grade`
  and `masteryFold`, and co-anchoring bundles via `itemsAt` on `anchorOffsets`.
  Grading/mastery are closed-only.
- **An open consumer** (a `socratize` lens) owns rendering `register: 'open'`
  items — each item's native `CodeQuestion` (`context` + `questions[]`). No
  grading, no verdict, no mastery.

Which consumers are built, and in what order, is coordination work tracked in the
handoffs, not this end-state doc.

## Design constraints (durable)

- **Reuse, never fork.** Import `QuizItem`/`Verdict` from `quizzing`, `CodeQuestion`/`BlockCell`/`Question` from `socratizing`. Never widen `QuizItem` with an open mode (violates quizzing's closed-only charter); never add grading to `socratizing`.
- **Own only the cross-register concerns** (grid unification, anchor normalization, coverage, ladder, cap). Filtering, grading, generation, and co-anchoring stay with the source libs and the consumers.
- **Pure TS**, `embodiment: Snippet` first, no React/DOM/module-state, vitest-testable without jsdom — the same locked input shape as its siblings ([`../../orchestrate/lib/README.md`](../../orchestrate/lib/README.md)). Conventions live in the repo's `AGENTS.md` / `DEV.md`.

## Navigation

- [DOCS.md](./DOCS.md) — architecture, the reuse-vs-diverge decision, the anchor normalization, the async evolution path, consumers, the data-flow diagram.
- [../quizzing/README.md](../quizzing/README.md) — the closed register (source).
- [../../orchestrate/lib/socratizing/README.md](../../orchestrate/lib/socratizing/README.md) — the open register (source).
- [../classifying/README.md](../classifying/README.md) — `classifyTokens` (the shared input for the closed source).
- [../../lenses/quiz/README.md](../../lenses/quiz/README.md) — the closed consumer; documents the planned open sibling lens.
