/**
 * @file Post-generation filtering of CodeQuestions by config.
 *
 * @remarks Pure function. Takes the full question list and a config, returns a
 * filtered, offset-sorted, and capped subset.
 *
 * Filtering rules (from DOCS.md):
 * - AND between groups (all applicable filters must pass)
 * - OR within multi-value groups (any match is sufficient)
 * - Single-value fields: question value must be enabled
 * - Register filter prunes individual entries from `questions`
 * - All-false group = empty result (differs from omitted group)
 * - Omitted group = no filter (all pass)
 * - Range filter uses zero-indexed half-open `[start, end)` offset overlap
 * - Sort is by ascending start offset, tie-broken by ascending end offset
 */

import type { CodeQuestion, MicroDecisionConfig, Question } from './types.js';

/**
 * Filters a list of CodeQuestions by the given config.
 *
 * @param questions - The unfiltered question list.
 * @param config - The filtering configuration (all fields optional).
 * @returns A new frozen array of filtered, sorted, and optionally capped questions.
 */
export default function filterQuestions(
	questions: readonly CodeQuestion[],
	config: MicroDecisionConfig,
): readonly CodeQuestion[] {
	// Groups filter, then the register filter prunes individual entries (and may
	// drop a question whose entries are all removed).
	const kept = questions
		.filter((question) => passesGroupFilters(question, config))
		.map((question) => applyRegisterFilter(question, config))
		.filter((question): question is CodeQuestion => question !== null);

	// Sort by source location: ascending start offset, tie-broken by end offset.
	const sorted = kept.toSorted(
		(a, b) =>
			a.location.start - b.location.start || a.location.end - b.location.end,
	);

	// Cap at config.count if specified and > 0.
	const capped =
		config.count && config.count > 0 && sorted.length > config.count
			? sorted.slice(0, config.count)
			: sorted;

	return Object.freeze(capped);
}

// ─── Config key mappings ───────────────────────────────────

/**
 * Maps Category string values to config key names.
 * Only entries that differ need to be listed.
 */
const CATEGORY_KEY_MAP: Record<string, string> = {
	'easter-egg': 'easterEgg',
};

/**
 * Maps CodeQuestionKind string values to config key names.
 */
const KIND_KEY_MAP: Record<string, string> = {
	'micro-decision': 'microDecision',
};

// ─── Group filters ─────────────────────────────────────────

/**
 * Whether a question passes every applicable single/multi-value group and the
 * range filter (AND between groups). Predicates are pure, so evaluating all of
 * them (rather than short-circuiting) is equivalent.
 */
function passesGroupFilters(
	question: CodeQuestion,
	config: MicroDecisionConfig,
): boolean {
	return [
		passesSingleValueFilter(
			question.kind,
			config.kind as Record<string, boolean | undefined> | undefined,
			KIND_KEY_MAP,
		),
		passesSingleValueFilter(
			question.feature,
			config.features as Record<string, boolean | undefined> | undefined,
		),
		passesMultiValueFilter(
			question.levels,
			config.levels as Record<string, boolean | undefined> | undefined,
		),
		passesMultiValueFilter(
			question.audiences,
			config.audiences as Record<string, boolean | undefined> | undefined,
		),
		passesSingleValueFilter(
			question.category,
			config.categories as Record<string, boolean | undefined> | undefined,
			CATEGORY_KEY_MAP,
		),
		passesRangeFilter(question, config.range),
	].every(Boolean);
}

/**
 * Applies the register filter to a question's `questions` array.
 * Returns the question unchanged, a new question with the pruned array, or
 * `null` if every entry was removed.
 */
function applyRegisterFilter(
	question: CodeQuestion,
	config: MicroDecisionConfig,
): CodeQuestion | null {
	const filteredQuestions = filterByRegister(
		question.questions,
		config.register as Record<string, boolean | undefined> | undefined,
	);
	if (filteredQuestions === null) {
		return null;
	}
	if (filteredQuestions === question.questions) {
		return question;
	}
	return Object.freeze({
		...question,
		questions: Object.freeze(filteredQuestions),
	});
}

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
 * Checks if a question's location overlaps a configured offset range.
 *
 * @remarks Half-open `[start, end)` overlap — any overlap, not full
 * containment. A question ending exactly at `range.start` (or starting exactly
 * at `range.end`) does not overlap.
 */
function passesRangeFilter(
	question: CodeQuestion,
	range: { start: number; end: number } | undefined,
): boolean {
	if (range === undefined) {
		return true;
	}
	const qStart = question.location.start;
	const qEnd = question.location.end;
	return qStart < range.end && qEnd > range.start;
}

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
