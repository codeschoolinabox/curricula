/**
 * @file Post-generation filtering of CodeQuestions by config.
 *
 * @remarks Pure function. Takes the full question list and
 * a config, returns a filtered and capped subset.
 *
 * Filtering rules (from DOCS.md):
 * - AND between groups (all applicable filters must pass)
 * - OR within multi-value groups (any match is sufficient)
 * - Single-value fields: question value must be enabled
 * - Register filter prunes individual entries from `questions`
 * - All-false group = empty result (differs from omitted group)
 * - Omitted group = no filter (all pass)
 */

import type { CodeQuestion, MicroDecisionConfig, Question } from './types.js';

/**
 * Filters a list of CodeQuestions by the given config.
 *
 * @param questions - The unfiltered question list.
 * @param config - The filtering configuration (all fields optional).
 * @returns A new array of filtered, sorted, and optionally capped questions.
 */
export default function filterQuestions(
	questions: readonly CodeQuestion[],
	config: MicroDecisionConfig,
): readonly CodeQuestion[] {
	const result: CodeQuestion[] = [];

	for (const question of questions) {
		// 1. Kind filter (single-value)
		if (
			!passesSingleValueFilter(
				question.kind,
				config.kind as Record<string, boolean | undefined> | undefined,
				KIND_KEY_MAP,
			)
		) {
			continue;
		}

		// 2. Feature filter (single-value)
		if (
			!passesSingleValueFilter(
				question.feature,
				config.features as Record<string, boolean | undefined> | undefined,
			)
		) {
			continue;
		}

		// 3. Levels filter (multi-value)
		if (
			!passesMultiValueFilter(
				question.levels,
				config.levels as Record<string, boolean | undefined> | undefined,
			)
		) {
			continue;
		}

		// 4. Audiences filter (multi-value)
		if (
			!passesMultiValueFilter(
				question.audiences,
				config.audiences as Record<string, boolean | undefined> | undefined,
			)
		) {
			continue;
		}

		// 5. Categories filter (single-value)
		if (
			!passesSingleValueFilter(
				question.category,
				config.categories as Record<string, boolean | undefined> | undefined,
				CATEGORY_KEY_MAP,
			)
		) {
			continue;
		}

		// 6. Range filter
		if (!passesRangeFilter(question, config.range)) {
			continue;
		}

		// 7. Register filter (prunes individual entries)
		const filteredQuestions = filterByRegister(
			question.questions,
			config.register as Record<string, boolean | undefined> | undefined,
		);
		if (filteredQuestions === null) {
			continue;
		}

		// If register filtering removed some entries, create a new
		// CodeQuestion with the pruned array
		if (filteredQuestions !== question.questions) {
			result.push(
				Object.freeze({
					...question,
					questions: Object.freeze(filteredQuestions),
				}),
			);
		} else {
			result.push(question);
		}
	}

	// 8. Sort by source location (ascending line, then column)
	result.sort((a, b) => {
		const lineDiff = a.location.start.line - b.location.start.line;
		if (lineDiff !== 0) {
			return lineDiff;
		}
		return a.location.start.column - b.location.start.column;
	});

	// 9. Cap at config.count if specified and > 0
	if (config.count && config.count > 0 && result.length > config.count) {
		return Object.freeze(result.slice(0, config.count));
	}

	return Object.freeze(result);
}

// ─── Config toggle helpers ─────────────────────────────────

/**
 * Checks if a single value passes a config group.
 * If the group is undefined (omitted), all values pass.
 * If all toggles in the group are false, nothing passes.
 */
function passesSingleValueFilter(
	value: string,
	group: Record<string, boolean | undefined> | undefined,
	keyMap?: Record<string, string>,
): boolean {
	if (group === undefined) {
		return true;
	}
	const key = keyMap?.[value] ?? value;
	return group[key] !== false;
}

/**
 * Checks if a multi-value array passes a config group.
 * At least one value must match an enabled toggle.
 */
function passesMultiValueFilter(
	values: readonly string[],
	group: Record<string, boolean | undefined> | undefined,
): boolean {
	if (group === undefined) {
		return true;
	}
	return values.some((v) => group[v] !== false);
}

/**
 * Checks if a question's location overlaps a configured range.
 */
function passesRangeFilter(
	question: CodeQuestion,
	range: { start: number; end: number } | undefined,
): boolean {
	if (range === undefined) {
		return true;
	}
	const qStart = question.location.start.line;
	const qEnd = question.location.end.line;
	// Any overlap — not full containment
	return qStart <= range.end && qEnd >= range.start;
}

// ─── Category key mapping ──────────────────────────────────

/**
 * Maps Category string values to config key names.
 * Only entries that differ need to be listed.
 */
const CATEGORY_KEY_MAP: Record<string, string> = {
	'easter-egg': 'easterEgg',
};

// ─── Kind key mapping ──────────────────────────────────────

/**
 * Maps CodeQuestionKind string values to config key names.
 */
const KIND_KEY_MAP: Record<string, string> = {
	'micro-decision': 'microDecision',
};

// ─── Register filter ───────────────────────────────────────

/**
 * Filters the `questions` array within a CodeQuestion by register.
 * Returns the pruned array, or null if all entries were removed.
 */
function filterByRegister(
	questions: readonly Question[],
	registerConfig: Record<string, boolean | undefined> | undefined,
): readonly Question[] | null {
	if (registerConfig === undefined) {
		return questions;
	}
	const filtered = questions.filter(
		(q) => registerConfig[q.register] !== false,
	);
	return filtered.length > 0 ? filtered : null;
}
