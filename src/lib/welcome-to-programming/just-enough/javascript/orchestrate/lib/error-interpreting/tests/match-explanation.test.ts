import { describe, it, expect } from 'vitest';

import matchExplanation from '../match-explanation.js';

import type { ExplanationPattern } from '../types.js';

const PATTERNS: readonly ExplanationPattern[] = Object.freeze([
	Object.freeze({
		id: 'reference-error-not-defined',
		errorName: 'ReferenceError',
		match: 'is not defined',
		phase: 'runtime' as const,
		seeAlso: 'variables',
		whatWentWrong: 'template {{name}}',
		howToFix: 'template',
		likelyMisunderstanding: 'template',
		howToAdjust: 'template',
	}),
	Object.freeze({
		id: 'unexpected-token',
		errorName: 'SyntaxError',
		match: 'Unexpected token',
		phase: 'parse' as const,
		whatWentWrong: 'template',
		howToFix: 'template',
		likelyMisunderstanding: 'template',
		howToAdjust: 'template',
	}),
	Object.freeze({
		id: 'syntax-error-runtime-regex',
		errorName: 'SyntaxError',
		match: 'Invalid regular expression',
		phase: 'runtime' as const,
		whatWentWrong: 'template',
		howToFix: 'template',
		likelyMisunderstanding: 'template',
		howToAdjust: 'template',
	}),
]);

describe('matchExplanation', () => {
	describe('basic matching', () => {
		it('matches a ReferenceError with "is not defined"', () => {
			const result = matchExplanation(
				{ name: 'ReferenceError', message: 'x is not defined' },
				PATTERNS,
			);
			expect(result?.id).toBe('reference-error-not-defined');
		});
	});

	describe('SyntaxError matching', () => {
		it('matches a SyntaxError with "Unexpected token"', () => {
			const result = matchExplanation(
				{ name: 'SyntaxError', message: 'Unexpected token (1:5)' },
				PATTERNS,
			);
			expect(result?.id).toBe('unexpected-token');
		});
	});

	describe('no match', () => {
		it('returns undefined when no pattern matches', () => {
			const result = matchExplanation(
				{ name: 'InternalError', message: 'something unknown' },
				PATTERNS,
			);
			expect(result).toBeUndefined();
		});
	});

	describe('phase-specific matching', () => {
		it('prefers the phase-specific pattern for SyntaxError', () => {
			const result = matchExplanation(
				{
					name: 'SyntaxError',
					message: 'Invalid regular expression: /[/: Unterminated',
				},
				PATTERNS,
				{ phase: 'runtime' },
			);
			expect(result?.id).toBe('syntax-error-runtime-regex');
		});
	});

	describe('phase fallback', () => {
		it('falls back to any match when no phase-specific match exists', () => {
			const result = matchExplanation(
				{ name: 'ReferenceError', message: 'y is not defined' },
				PATTERNS,
				{ phase: 'parse' },
			);
			// no parse-phase ReferenceError pattern, falls back to runtime one
			expect(result?.id).toBe('reference-error-not-defined');
		});
	});

	describe('case-insensitive message matching', () => {
		it('matches regardless of message case', () => {
			const result = matchExplanation(
				{ name: 'ReferenceError', message: 'x IS NOT DEFINED' },
				PATTERNS,
			);
			expect(result?.id).toBe('reference-error-not-defined');
		});
	});
});
