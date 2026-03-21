/**
 * @file Tests for verifyOptions() — semantic validation of tracer options.
 *
 * Constraint: range.start must be <= range.end when both are present.
 */

import { OptionsSemanticInvalidError } from '@study-lenses/tracing';
import { describe, expect, it } from 'vitest';

import verifyOptions from '../index.js';

describe('verifyOptions', () => {
	// --- valid cases (should not throw) ---

	it('does not throw for valid range (start < end)', () => {
		expect(() => verifyOptions({ range: { start: 1, end: 10 } })).not.toThrow();
	});

	it('does not throw when start equals end (single line)', () => {
		expect(() => verifyOptions({ range: { start: 5, end: 5 } })).not.toThrow();
	});

	it('does not throw when no range is provided', () => {
		expect(() => verifyOptions({ operators: true })).not.toThrow();
	});

	it('does not throw when range is empty object', () => {
		expect(() => verifyOptions({ range: {} })).not.toThrow();
	});

	it('does not throw when only start is provided', () => {
		expect(() => verifyOptions({ range: { start: 3 } })).not.toThrow();
	});

	it('does not throw when only end is provided', () => {
		expect(() => verifyOptions({ range: { end: 10 } })).not.toThrow();
	});

	it('does not throw for non-object options', () => {
		expect(() => verifyOptions('string')).not.toThrow();
		expect(() => verifyOptions(42)).not.toThrow();
	});

	it('does not throw for null options', () => {
		expect(() => verifyOptions(null)).not.toThrow();
	});

	// --- invalid cases (should throw) ---

	it('throws OptionsSemanticInvalidError when start > end', () => {
		expect(() => verifyOptions({ range: { start: 10, end: 5 } })).toThrow(
			OptionsSemanticInvalidError,
		);
	});

	it('includes start and end values in error message', () => {
		expect(() => verifyOptions({ range: { start: 10, end: 5 } })).toThrow(
			'range.start (10) must be <= range.end (5)',
		);
	});
});
