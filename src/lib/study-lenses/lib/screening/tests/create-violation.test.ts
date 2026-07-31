import { describe, expect, it } from 'vitest';

import createViolation from '../create-violation.js';

describe('createViolation', () => {
	describe('populates the violation from its arguments', () => {
		it('the whole violation equals its arguments', () => {
			const violation = createViolation(
				'ForStatement',
				"ForStatement isn't in the admitted syntax",
				{ start: 3, end: 9 },
				'$.body.0',
			);
			expect(violation).toEqual({
				nodeType: 'ForStatement',
				message: "ForStatement isn't in the admitted syntax",
				location: { start: 3, end: 9 },
				nodePath: '$.body.0',
			});
		});

		it('a different violation carries its own fields', () => {
			const violation = createViolation(
				'BinaryExpression',
				"Binary operator '==' isn't in the admitted syntax",
				{ start: 12, end: 22 },
				'$.body.0.declarations.0.init',
			);
			expect(violation).toEqual({
				nodeType: 'BinaryExpression',
				message: "Binary operator '==' isn't in the admitted syntax",
				location: { start: 12, end: 22 },
				nodePath: '$.body.0.declarations.0.init',
			});
		});
	});

	describe('the location is copied from the argument', () => {
		it('is a distinct object reference', () => {
			const location = { start: 1, end: 5 };
			const violation = createViolation(
				'ForStatement',
				"ForStatement isn't in the admitted syntax",
				location,
				'$.body.0',
			);
			expect(violation.location).not.toBe(location);
		});

		it("does not freeze the caller's location object", () => {
			const location = { start: 1, end: 5 };
			createViolation(
				'ForStatement',
				"ForStatement isn't in the admitted syntax",
				location,
				'$.body.0',
			);
			expect(Object.isFrozen(location)).toBe(false);
		});
	});

	describe('the returned violation is frozen', () => {
		it('is frozen at the top level', () => {
			const violation = createViolation(
				'SwitchStatement',
				"SwitchStatement isn't in the admitted syntax",
				{ start: 0, end: 10 },
				'$.body.0',
			);
			expect(Object.isFrozen(violation)).toBe(true);
		});

		it('has a frozen location', () => {
			const violation = createViolation(
				'SwitchStatement',
				"SwitchStatement isn't in the admitted syntax",
				{ start: 0, end: 10 },
				'$.body.0',
			);
			expect(Object.isFrozen(violation.location)).toBe(true);
		});
	});
});
