/**
 * @file Tests for verifyOptions() — semantic validation of tracer options.
 *
 * Constraints:
 *   - range.start must be <= range.end when both are present
 *   - iterations must be a positive number when present
 *   - seconds must be a positive number when present
 */

import { describe, expect, it } from 'vitest';

import verifyOptions from '../verify-options.js';

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

	it('throws Error when start > end', () => {
		expect(() => verifyOptions({ range: { start: 10, end: 5 } })).toThrow(Error);
	});

	it('includes start and end values in error message', () => {
		expect(() => verifyOptions({ range: { start: 10, end: 5 } })).toThrow(
			'range.start (10) must be <= range.end (5)',
		);
	});

	describe('iterations constraint', () => {
		it('does not throw when iterations is absent', () => {
			expect(() => verifyOptions({ range: { start: 1, end: 10 } })).not.toThrow();
		});

		it('does not throw when iterations is positive', () => {
			expect(() => verifyOptions({ iterations: 100 })).not.toThrow();
		});

		it('throws when iterations is 0', () => {
			expect(() => verifyOptions({ iterations: 0 })).toThrow(
				'iterations (0) must be a positive number',
			);
		});

		it('throws when iterations is negative', () => {
			expect(() => verifyOptions({ iterations: -1 })).toThrow(
				'iterations (-1) must be a positive number',
			);
		});
	});

	describe('seconds constraint', () => {
		it('does not throw when seconds is absent', () => {
			expect(() => verifyOptions({ range: { start: 1, end: 10 } })).not.toThrow();
		});

		it('does not throw when seconds is positive', () => {
			expect(() => verifyOptions({ seconds: 30 })).not.toThrow();
		});

		it('throws when seconds is 0', () => {
			expect(() => verifyOptions({ seconds: 0 })).toThrow(
				'seconds (0) must be a positive number',
			);
		});

		it('throws when seconds is negative', () => {
			expect(() => verifyOptions({ seconds: -1 })).toThrow(
				'seconds (-1) must be a positive number',
			);
		});
	});

	describe('regression: absent iterations/seconds must not skip range validation', () => {
		it('still throws for invalid range when iterations is absent', () => {
			expect(() => verifyOptions({ range: { start: 5, end: 2 } })).toThrow(
				'range.start (5) must be <= range.end (2)',
			);
		});

		it('still throws for invalid range when seconds is absent', () => {
			expect(() => verifyOptions({ range: { start: 99, end: 1 } })).toThrow(
				'range.start (99) must be <= range.end (1)',
			);
		});
	});
});
