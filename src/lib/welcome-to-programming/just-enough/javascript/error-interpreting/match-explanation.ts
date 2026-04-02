/**
 * @file Matches an error against loaded explanation patterns.
 *
 * @remarks Finds the first pattern where `errorName` matches
 * exactly and `match` is a case-insensitive substring of the
 * error message. When `phase` is specified in both the options
 * and the pattern, it must also match.
 */

import type {
	ErrorInput,
	ExplanationPattern,
	InterpretOptions,
} from './types.js';

/**
 * Finds the first explanation pattern matching the given error.
 *
 * @param error - The error to match
 * @param options - Optional interpretation context
 * @param patterns - Loaded explanation patterns
 * @returns The matched pattern, or `undefined` if no match
 */
function matchExplanation(
	error: ErrorInput,
	patterns: readonly ExplanationPattern[],
	{ phase }: InterpretOptions = {},
): ExplanationPattern | undefined {
	const messageLower = error.message.toLowerCase();

	// 1. Try phase-specific match first (when phase is provided)
	if (phase) {
		const phaseMatch = patterns.find(
			(pattern) =>
				pattern.errorName === error.name &&
				pattern.phase === phase &&
				messageLower.includes(pattern.match.toLowerCase()),
		);
		if (phaseMatch) {
			return phaseMatch;
		}
	}

	// 2. Fall back to phase-agnostic match
	return patterns.find(
		(pattern) =>
			pattern.errorName === error.name &&
			messageLower.includes(pattern.match.toLowerCase()),
	);
}

export default matchExplanation;
