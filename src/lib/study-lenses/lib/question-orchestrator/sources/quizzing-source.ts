/**
 * @file The quizzing SOURCE adapter — wraps the CLOSED / gradable register
 * (`generateQuiz`) as an orchestrator `QuestionSource`.
 *
 * @remarks Maps each `QuizItem` to a CLOSED `OrchestratedItem`: namespaces the
 * native id (`quizzing:${item.id}`), carries the whole `QuizItem` on the `item`
 * arm (grading + mastery need it), unifies `cells` from `item.cells`, and copies
 * the native `anchorRange` (already character offsets) straight into
 * `anchorOffsets` — no projection. `generateQuiz` THROWS on an unparsed snippet,
 * so the call is wrapped in try/catch → `[]` (defense-in-depth; the entry also
 * gates). Total — never throws; deep-frozen output. See `../DOCS.md` § Execution
 * phases (Run sources).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import generateQuiz from '../../quizzing/generate-quiz.js';
import type { QuizItem } from '../../quizzing/types.js';
import type {
	ClosedOrchestratedItem,
	OrchestratedItem,
	QuestionSource,
	SourceInputs,
} from '../types.js';

/**
 * Run the quizzing source: generate the closed quiz items (forwarding this
 * source's filter slice) and normalize each `QuizItem` to a closed
 * `OrchestratedItem`. Total: an unparsed snippet yields `[]`; never throws.
 */
function runQuizzingSource(inputs: SourceInputs): readonly OrchestratedItem[] {
	const quizItems = generateOrEmpty(inputs);
	return deepFreezeInPlace(quizItems.map((item) => toClosedItem(item)));
}

/**
 * Call `generateQuiz`, defending its one throw site (an unparsed snippet):
 * success → the native items; a throw → `[]`. The try/catch is narrow by design —
 * only the boundary call is guarded, so a bug in this adapter's own mapping
 * surfaces rather than being silently swallowed as `[]`.
 */
function generateOrEmpty(inputs: SourceInputs): readonly QuizItem[] {
	try {
		return generateQuiz(
			inputs.embodiment,
			inputs.classified,
			inputs.config.sources?.quizzing,
		);
	} catch {
		return [];
	}
}

/**
 * Normalize one `QuizItem` to a CLOSED `OrchestratedItem`. The native `QuizItem`
 * rides the `item` arm untouched; the base carries the namespaced id, the native
 * `anchorRange` copied as-is (already char offsets — no projection), and the
 * unified `cells` (a reference to the item's own frozen `cells`).
 */
function toClosedItem(item: QuizItem): ClosedOrchestratedItem {
	return {
		id: `quizzing:${item.id}`,
		sourceId: 'quizzing',
		register: 'closed',
		anchorOffsets: item.anchorRange,
		cells: item.cells,
		item,
	};
}

const quizzingSource: QuestionSource = {
	id: 'quizzing',
	run: runQuizzingSource,
};

export default quizzingSource;
