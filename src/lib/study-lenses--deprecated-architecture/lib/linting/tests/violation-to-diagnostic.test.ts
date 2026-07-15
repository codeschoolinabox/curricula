import { describe, it, expect } from 'vitest';

import type { Violation } from '../../../../embody/lib/validating/types.js';
import violationToDiagnostic from '../violation-to-diagnostic.js';

function fakeViolation(overrides: Partial<Violation> = {}): Violation {
	return {
		nodeType: 'VariableDeclaration',
		message: "'var' declarations are not allowed",
		severity: 'rejection',
		location: { start: { line: 2, column: 4 }, end: { line: 2, column: 10 } },
		nodePath: '$.body[0]',
		...overrides,
	};
}

describe('violationToDiagnostic', () => {
	describe('flattens the source range', () => {
		it('line comes from location.start.line', () => {
			const d = violationToDiagnostic(fakeViolation());
			expect(d.line).toBe(2);
		});

		it('line is start.line, not end.line, on a multi-line range', () => {
			const d = violationToDiagnostic(
				fakeViolation({
					location: {
						start: { line: 3, column: 0 },
						end: { line: 5, column: 1 },
					},
				}),
			);
			expect(d.line).toBe(3);
		});

		it('column comes from location.start.column', () => {
			const d = violationToDiagnostic(fakeViolation());
			expect(d.column).toBe(4);
		});

		it('endLine comes from location.end.line', () => {
			const d = violationToDiagnostic(
				fakeViolation({
					location: {
						start: { line: 3, column: 0 },
						end: { line: 5, column: 1 },
					},
				}),
			);
			expect(d.endLine).toBe(5);
		});

		it('endColumn comes from location.end.column, exclusive, no +1', () => {
			const d = violationToDiagnostic(fakeViolation());
			expect(d.endColumn).toBe(10);
		});

		it('endColumn is end.column, not end.line, on a multi-line range', () => {
			const d = violationToDiagnostic(
				fakeViolation({
					location: {
						start: { line: 3, column: 0 },
						end: { line: 5, column: 1 },
					},
				}),
			);
			expect(d.endColumn).toBe(1);
		});
	});

	describe('carries severity and message through', () => {
		it('severity passes through unchanged', () => {
			const d = violationToDiagnostic(fakeViolation());
			expect(d.severity).toBe('rejection');
		});

		it('message is verbatim', () => {
			const d = violationToDiagnostic(
				fakeViolation({ message: 'Computed method calls are not allowed' }),
			);
			expect(d.message).toBe('Computed method calls are not allowed');
		});
	});

	describe('source', () => {
		it("is tagged 'JEJ'", () => {
			const d = violationToDiagnostic(fakeViolation());
			expect(d.source).toBe('JEJ');
		});
	});

	describe('drops AST-navigation fields', () => {
		it('does not carry nodeType', () => {
			const d = violationToDiagnostic(fakeViolation());
			expect(d).not.toHaveProperty('nodeType');
		});

		it('does not carry nodePath', () => {
			const d = violationToDiagnostic(fakeViolation());
			expect(d).not.toHaveProperty('nodePath');
		});
	});

	describe('return value is frozen', () => {
		it('returns a frozen diagnostic', () => {
			const d = violationToDiagnostic(fakeViolation());
			expect(Object.isFrozen(d)).toBe(true);
		});
	});
});
