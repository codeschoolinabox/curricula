import { describe, it, expect } from 'vitest';

import createViolation from '../create-violation.js';

describe('createViolation', () => {
	describe('returns a Violation with all fields populated', () => {
		it('has the given nodeType', () => {
			const violation = createViolation(
				'FunctionDeclaration',
				'FunctionDeclaration is not allowed',
				{ start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
			);
			expect(violation.nodeType).toBe('FunctionDeclaration');
		});

		it('has the given message', () => {
			const violation = createViolation(
				'FunctionDeclaration',
				'FunctionDeclaration is not allowed',
				{ start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
			);
			expect(violation.message).toBe('FunctionDeclaration is not allowed');
		});

		it('has the given location', () => {
			const location = {
				start: { line: 3, column: 4 },
				end: { line: 5, column: 1 },
			};
			const violation = createViolation(
				'ForStatement',
				'ForStatement is not allowed',
				location,
			);
			expect(violation.location).toStrictEqual(location);
		});
	});

	describe('severity', () => {
		it('defaults to rejection when no severity is provided', () => {
			const violation = createViolation(
				'FunctionDeclaration',
				'FunctionDeclaration is not allowed',
				{ start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
			);
			expect(violation.severity).toBe('rejection');
		});

		it('accepts rejection as an explicit severity', () => {
			const violation = createViolation(
				'BinaryExpression',
				"Binary operator '==' is not allowed",
				{ start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
				'rejection',
			);
			expect(violation.severity).toBe('rejection');
		});
	});

	describe('returned object is frozen', () => {
		it('is frozen at the top level', () => {
			const violation = createViolation(
				'SwitchStatement',
				'SwitchStatement is not allowed',
				{ start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
			);
			expect(Object.isFrozen(violation)).toBe(true);
		});

		it('has a frozen location object', () => {
			const violation = createViolation(
				'SwitchStatement',
				'SwitchStatement is not allowed',
				{ start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
			);
			expect(Object.isFrozen(violation.location)).toBe(true);
		});

		it('has frozen start and end positions', () => {
			const violation = createViolation(
				'SwitchStatement',
				'SwitchStatement is not allowed',
				{ start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
			);
			expect(Object.isFrozen(violation.location.start)).toBe(true);
			expect(Object.isFrozen(violation.location.end)).toBe(true);
		});
	});
});
