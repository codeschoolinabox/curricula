import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import deriveInterpretedDiagnostics from '../derive-interpreted-diagnostics.js';
import interpretError from '../interpret-error.js';

describe('deriveInterpretedDiagnostics', () => {
	describe('Zero — no error', () => {
		it('returns no diagnostics when the embodiment has no error', () => {
			const result = deriveInterpretedDiagnostics(embody('OK'));
			expect(result).toHaveLength(0);
		});
	});

	describe('One — a located error', () => {
		it('returns exactly one diagnostic', () => {
			const result = deriveInterpretedDiagnostics(
				embody('let x = 1;\nlet y = ;'),
			);
			expect(result).toHaveLength(1);
		});

		it('targets the error line from loc', () => {
			const embodiment = embody('let x = 1;\nlet y = ;');
			const { errors } = embodiment;
			if (errors === null) throw new Error('expected an error');
			if (errors.loc === null) throw new Error('expected a located error');
			const result = deriveInterpretedDiagnostics(embodiment);
			expect(result[0].line).toBe(errors.loc.start.line);
		});

		it('targets the error column from loc', () => {
			const embodiment = embody('let x = 1;\nlet y = ;');
			const { errors } = embodiment;
			if (errors === null) throw new Error('expected an error');
			if (errors.loc === null) throw new Error('expected a located error');
			const result = deriveInterpretedDiagnostics(embodiment);
			expect(result[0].column).toBe(errors.loc.start.column);
		});

		it('tags the diagnostic source as interpreted', () => {
			const result = deriveInterpretedDiagnostics(
				embody('let x = 1;\nlet y = ;'),
			);
			expect(result[0].source).toBe('interpreted');
		});

		it('marks the diagnostic severity as error', () => {
			const result = deriveInterpretedDiagnostics(
				embody('let x = 1;\nlet y = ;'),
			);
			expect(result[0].severity).toBe('error');
		});

		it('uses the parse-phase whatWentWrong interpretation as the message', () => {
			const embodiment = embody('let x = 1;\nlet y = ;');
			const error = embodiment.errors;
			if (error === null) throw new Error('expected a parse error');
			const { loc } = error;
			if (loc === null) throw new Error('expected a located error');
			const expected = interpretError(
				embodiment,
				{
					name: error.kind,
					message: error.message,
					line: loc.start.line,
					column: loc.start.column,
				},
				{ phase: 'parse' },
			).whatWentWrong;
			const result = deriveInterpretedDiagnostics(embodiment);
			expect(result[0].message).toBe(expected);
		});
	});

	describe('Boundaries — a location-less error', () => {
		it('falls back to file-level line 1', () => {
			const result = deriveInterpretedDiagnostics(embody('FAIL_AT_PARSE'));
			expect(result[0].line).toBe(1);
		});

		it('falls back to column 0', () => {
			const result = deriveInterpretedDiagnostics(embody('FAIL_AT_PARSE'));
			expect(result[0].column).toBe(0);
		});
	});

	describe('Simple — a second static phase (creation)', () => {
		it('threads a creation-phase error message through interpretError', () => {
			const result = deriveInterpretedDiagnostics(embody('FAIL_AT_CREATE'));
			expect(result[0].message).toContain('create-phase failure');
		});
	});

	describe('Boundaries — frozen output', () => {
		it('returns a frozen array', () => {
			const result = deriveInterpretedDiagnostics(embody('FAIL_AT_PARSE'));
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('deep-freezes the diagnostic object', () => {
			const result = deriveInterpretedDiagnostics(embody('FAIL_AT_PARSE'));
			expect(Object.isFrozen(result[0])).toBe(true);
		});

		it('returns a frozen array when there is no error', () => {
			const result = deriveInterpretedDiagnostics(embody('OK'));
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
