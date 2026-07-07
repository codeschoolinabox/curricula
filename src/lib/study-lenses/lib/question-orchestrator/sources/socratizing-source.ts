/**
 * @file The socratizing SOURCE adapter — wraps the OPEN / Socratic register
 * (`analyzeMicroDecisions`) as an orchestrator `QuestionSource`.
 *
 * @remarks Maps each `CodeQuestion` to an OPEN `OrchestratedItem`: namespaces the
 * native id (`socratizing:${cq.id}`), carries the whole `CodeQuestion` on the
 * `question` arm, unifies `cells` from `cq.block`, and normalizes the native
 * line/column `location` to the shared half-open `[start, end)` character-offset
 * span via the embodiment's offset index (`offsets[line - 1] + column`). Total —
 * an unparsed embodiment yields `[]` (it reads `analyzeMicroDecisions`'s
 * `{ ok: false }` arm); it never throws. See `../DOCS.md` § Anchor normalization
 * and § Execution phases (Run sources).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import analyzeMicroDecisions from '../../../orchestrate/lib/socratizing/analyze-micro-decisions.js';
import type { CodeQuestion } from '../../../orchestrate/lib/socratizing/types.js';
import type {
	OpenOrchestratedItem,
	OrchestratedItem,
	QuestionSource,
	SourceInputs,
} from '../types.js';

/**
 * Run the socratizing source: analyze the embodiment's micro-decisions (behind
 * the register's own `{ ok }` gate, forwarding this source's filter slice) and
 * normalize each `CodeQuestion` to an open `OrchestratedItem`. Total: `{ ok:
 * false }` (unparsed) yields `[]`; never throws.
 */
function runSocratizingSource(
	inputs: SourceInputs,
): readonly OrchestratedItem[] {
	const result = analyzeMicroDecisions(
		inputs.embodiment,
		inputs.config.sources?.socratizing,
	);
	if (!result.ok) {
		return [];
	}

	const { offsets } = inputs.embodiment.source;
	const items = result.questions.map((question) =>
		toOpenItem(question, offsets),
	);
	return deepFreezeInPlace(items);
}

/**
 * Normalize one socratizing `CodeQuestion` to an OPEN `OrchestratedItem`. The
 * native `CodeQuestion` rides the `question` arm untouched; the base carries the
 * namespaced id, the offset-normalized anchor, and the unified `cells` (a
 * reference to the question's own frozen `block`).
 */
function toOpenItem(
	question: CodeQuestion,
	offsets: readonly number[],
): OpenOrchestratedItem {
	return {
		id: `socratizing:${question.id}`,
		sourceId: 'socratizing',
		register: 'open',
		anchorOffsets: projectRange(question.location, offsets),
		cells: question.block,
		question,
	};
}

/**
 * Project a socratizing line/column `SourceRange` onto the shared half-open
 * `[start, end)` character-offset span, using the embodiment's precomputed
 * line-offset index (`offsets[line - 1] + column`, column 0-based).
 * `SourceRange.end` is already exclusive, so the result is a clean `[start, end)`
 * with no adjustment. The index is always in range: `location` line numbers come
 * from `embodiment.raw.ast`, parsed from the same `source.code` that produced
 * `offsets`.
 */
function projectRange(
	range: CodeQuestion['location'],
	offsets: readonly number[],
): readonly [number, number] {
	return [
		offsets[range.start.line - 1] + range.start.column,
		offsets[range.end.line - 1] + range.end.column,
	];
}

const socratizingSource: QuestionSource = {
	id: 'socratizing',
	run: runSocratizingSource,
};

export default socratizingSource;
