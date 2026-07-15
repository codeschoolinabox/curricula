/**
 * @file Types for the question-orchestrator module.
 *
 * @remarks This lib composes the curriculum's two question *registers* —
 * the OPEN / Socratic register (`socratizing`) and the CLOSED / gradable
 * register (`quizzing`) — into one item stream on the shared Block Model
 * grid. It reuses both libs' item types **as-is** (by reference); it never
 * forks or widens them.
 *
 * Naming note: this module's public verbs/types (`composeQuestions`,
 * `OrchestratedItem`, `QuestionSet`) are deliberately distinct from
 * `quizzing`'s `generateQuiz` / `QuizItem`, which name a different (closed
 * only) thing.
 *
 * Homonym note: `OrchestratedRegister` (`open | closed`) is the whole-kind
 * axis. It is NOT socratizing's `QuestionRegister` (`open | pointed |
 * comparative`), which tags each *inner* `Question`. Both use the token
 * `'open'` with different meanings; consumers read each axis at its level.
 */

import type { Snippet } from '../../../embody/types.js';
import type {
	BlockCell,
	CodeQuestion,
	MicroDecisionConfig,
} from '../../orchestrate/lib/socratizing/types.js';
import type { ClassifiedToken } from '../classifying/types.js';
import type { QuizFilter, QuizItem } from '../quizzing/types.js';

// ─── Register (the whole-kind axis) ─────────────────────────

/**
 * The register an `OrchestratedItem` belongs to.
 *
 * @remarks quizzing's "two registers of the same Block Model":
 * - `open`: Socratic, non-gradable prose (from `socratizing`)
 * - `closed`: machine-gradable (from `quizzing`)
 *
 * NOT socratizing's `QuestionRegister` (`open | pointed | comparative`),
 * which is a finer rhetorical axis on each inner `Question`.
 */
type OrchestratedRegister = 'open' | 'closed';

// ─── The unified item ───────────────────────────────────────

/**
 * The computed shared coordinate every orchestrated item carries,
 * regardless of register. This is the "one grid" both registers sit on.
 *
 * @remarks Every field here is *derived by the orchestrator* — the native
 * source object lives on the register arm (see below), untouched.
 */
type OrchestratedItemBase = Readonly<{
	/** Namespaced by source: `` `${sourceId}:${nativeId}` `` (e.g.
	 *  `'quizzing:V1@12-13'`, `'quizzing:V6/binding:x@4-8'`,
	 *  `'socratizing:what-is-declared'` — native id shapes vary per source/form).
	 *  NOT globally unique. Quizzing's native ids are unique per snippet today
	 *  (each encodes its span, or is one-per-key like `V10c/use-type:read`),
	 *  though not guaranteed by charter; socratizing's are constant per analyzer
	 *  (`'what-is-declared'`, `'what-value-stored'`), so a repeated node-type
	 *  yields several items sharing one `id`. There is **no** per-item
	 *  unique-identity field — do not dedup on `id`. For co-anchoring, key on
	 *  `anchorOffsets`, which is intentionally many-to-one (`itemsAt` bundles
	 *  cross-register items sharing an anchor) — a bundling key, not an identity.
	 *  The native id is preserved so a consumer can drive socratizing's
	 *  shown/dismissed adaptive fading, which keys on the stable analyzer id,
	 *  not on per-item uniqueness. */
	id: string;
	/** Which registered source emitted this item (`'quizzing'` | `'socratizing'` | …). */
	sourceId: string;
	/** Normalized half-open `[start, end)` character-offset span into
	 *  `source.code`. The one field co-anchoring / coverage / `itemsAt` key on. */
	anchorOffsets: readonly [number, number];
	/** Unified Block Model cells: `item.cells` (closed) or `question.block`
	 *  (open), copied unchanged (both are the same `BlockCell` type). */
	cells: readonly BlockCell[];
}>;

/**
 * The CLOSED, gradable arm — carries the whole `quizzing` `QuizItem` by
 * reference (grading via `grade(item, response)` and mastery folding need
 * the full item; there is no lighter option).
 */
type ClosedOrchestratedItem = OrchestratedItemBase &
	Readonly<{
		register: 'closed';
		item: QuizItem;
	}>;

/**
 * The OPEN, non-gradable arm — carries the whole `socratizing` `CodeQuestion`
 * by reference (including its stable `id`, its `context` prose, and its
 * `questions[]` register list). No answer key; open by charter.
 */
type OpenOrchestratedItem = OrchestratedItemBase &
	Readonly<{
		register: 'open';
		question: CodeQuestion;
	}>;

/**
 * The unified item. Discriminated on `register`. A third register later is
 * one additive union member — no existing arm changes.
 */
type OrchestratedItem = ClosedOrchestratedItem | OpenOrchestratedItem;

// ─── The source registry ────────────────────────────────────

/**
 * The pre-computed, shared inputs the orchestrator builds ONCE per run and
 * offers to every source. A source reads only what it needs: socratize reads
 * `embodiment`; quizzing reads `embodiment` + `classified`; each reads its own
 * filter slice off `config.sources` (the quizzing source reads
 * `config.sources?.quizzing`, etc. — a literal key, never a dynamic index).
 * Adding a shared input is an additive field.
 */
type SourceInputs = Readonly<{
	embodiment: Snippet;
	classified: readonly ClassifiedToken[];
	config: CompositionConfig;
}>;

/**
 * One registered generator SOURCE — the orchestrator-level plug-in, one
 * level above quizzing's internal generator registry. A source may emit items
 * of either register; each item carries its own `register`, so a source is not
 * pinned to one.
 *
 * @remarks `run` is total and non-throwing: it defends its source and
 * contributes `[]` on internal failure. It is SYNCHRONOUS today; an async
 * (e.g. LLM-backed) source is a deliberate, localized future change — see
 * DOCS.md § Async evolution — not accommodated by a `Promise` union here (a
 * sync composition pass cannot honor one).
 */
type QuestionSource = Readonly<{
	id: string;
	run: (inputs: SourceInputs) => readonly OrchestratedItem[];
}>;

// ─── Composition config + result ────────────────────────────

/**
 * Configuration for `composeQuestions`. All fields optional.
 *
 * @remarks Per-source filters pass straight through to each source's own
 * native filter — this lib does not re-implement filtering. The rest are the
 * composition knobs.
 */
type CompositionConfig = {
	/** Native per-source filters, forwarded unchanged, keyed by source id.
	 *  New sources add their own key. NOTE: `quizzing`'s filter is a no-op stub
	 *  upstream today (accepted-and-ignored); `socratizing`'s is implemented. */
	sources?: {
		quizzing?: QuizFilter;
		socratizing?: MicroDecisionConfig;
	};
	/** Coverage targets on the shared Block Model grid. Omitted = report over
	 *  whatever the pool covers (no `gaps`). */
	coverage?: {
		cells?: readonly BlockCell[];
	};
	/** Order items atom → block → relation → macro. Default: `true`. */
	ladder?: boolean;
	/** Max items in the composed set (`0` or omitted = no cap). Applied after
	 *  ladder, before the coverage report (so coverage describes the capped set). */
	count?: number;
};

/**
 * The Block Model coverage of a composed set.
 *
 * @remarks Report only — the orchestrator cannot generate an item to fill a
 * gap. Computed LAST, over the final (post-cap) `items`, so it truthfully
 * describes the delivered set: `spanned` = distinct cells the emitted `items`
 * cover; `gaps` = `config.coverage.cells` minus `spanned` (empty when no
 * target set). A cap (per-source or composition) that drops a cell's only item
 * therefore honestly shows that cell as a gap.
 */
type CoverageReport = Readonly<{
	spanned: readonly BlockCell[];
	gaps: readonly BlockCell[];
}>;

/**
 * The result of `composeQuestions`. A frozen composed set over both
 * registers. There is no `ok: false` arm: an unparsed embodiment yields an
 * empty set (`items: []`), not an error — the function is total.
 *
 * The success field is `items` (not `questions`) to stay distinct from
 * socratize's inner `Question[]`.
 */
type QuestionSet = Readonly<{
	items: readonly OrchestratedItem[];
	coverage: CoverageReport;
}>;

// ─── Exports ────────────────────────────────────────────────

export type {
	ClosedOrchestratedItem,
	CompositionConfig,
	CoverageReport,
	OpenOrchestratedItem,
	OrchestratedItem,
	OrchestratedItemBase,
	OrchestratedRegister,
	QuestionSet,
	QuestionSource,
	SourceInputs,
};
