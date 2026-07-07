/**
 * @file `composeQuestions` — the question-orchestrator entry point. Runs both
 * question sources over one embodiment and merges them into a single frozen,
 * coverage-aware, difficulty-laddered `QuestionSet`.
 *
 * @remarks Pure and TOTAL — never throws. An unparsed embodiment short-circuits
 * to a degenerate set (no items; coverage reported over the empty pool, so every
 * configured target is an honest gap) BEFORE any source runs — this is why the
 * two sources' divergent unparsed failure modes (`generateQuiz` throws;
 * `analyzeMicroDecisions` returns `{ ok: false }`) never surface. The single
 * classify pass happens after the gate (parsed ⇒ `raw.tokens`/`raw.ast`
 * non-null); the sources are never re-parsed. See `./DOCS.md` § Execution phases.
 */

import type { Snippet } from '../../embody/types.js';
import classifyTokens from '../classifying/classify-tokens.js';
import type { ClassifyInput } from '../classifying/types.js';

import ladder from './ladder.js';
import reportCoverage from './report-coverage.js';
import SOURCES from './sources/registry.js';
import type { CompositionConfig, QuestionSet, SourceInputs } from './types.js';

/**
 * Compose the question set for one embodiment: gate on parse status, build the
 * shared source inputs (the one classify pass), run every source and merge the
 * pool, ladder it (unless disabled), cap it, report coverage over the delivered
 * items, and freeze. Total — returns an empty-item set on an unparsed embodiment,
 * never throws.
 */
function composeQuestions(
	embodiment: Snippet,
	config: CompositionConfig = {},
): QuestionSet {
	// Total-safety gate: short-circuit to the degenerate set before any source
	// runs. Parsed implies `raw.tokens`/`raw.ast` are non-null by embody's
	// contract; the extra null checks are defense-in-depth so the entry point
	// stays total even if that upstream invariant is ever violated (rather than
	// letting classifyTokens throw through this "never throws" boundary).
	if (
		!embodiment.status.parsed ||
		embodiment.raw.tokens === null ||
		embodiment.raw.ast === null
	) {
		return Object.freeze({
			items: Object.freeze([]),
			coverage: reportCoverage([], config.coverage?.cells ?? []),
		});
	}

	const inputs: SourceInputs = {
		embodiment,
		// Past the gate `raw.tokens`/`raw.ast` are non-null; the cast only bridges
		// their loose `unknown`/`Node` types to classifying's `acorn.Token[]`/`Node`.
		classified: classifyTokens({
			code: embodiment.source.code,
			tokens: embodiment.raw.tokens,
			ast: embodiment.raw.ast,
		} as unknown as ClassifyInput),
		config,
	};

	const pool = SOURCES.flatMap((source) => source.run(inputs));
	const laddered = config.ladder === false ? pool : ladder(pool);
	const capped =
		config.count && config.count > 0
			? laddered.slice(0, config.count)
			: laddered;
	const coverage = reportCoverage(capped, config.coverage?.cells ?? []);
	// Freeze only what compose owns — the wrapper object and the items array. The
	// items, the coverage report, and its arrays are already frozen by the passes
	// that built them; a deep freeze here would reach through `coverage.gaps` and
	// freeze the CALLER's borrowed target cells in place.
	return Object.freeze({ items: Object.freeze(capped), coverage });
}

export default composeQuestions;
