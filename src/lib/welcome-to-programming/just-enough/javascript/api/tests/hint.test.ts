import { describe, it, expect } from 'vitest';

import hint from '../hint.js';
import { format } from '../format.js';

describe('hint', () => {
	describe('parse errors', () => {
		it('returns ok false for unparseable code', () => {
			const result = hint('let = ;');
			expect(result.ok).toBe(false);
		});

		it('sets parse error', () => {
			const result = hint('let = ;');
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('parse');
		});

		it('returns empty warnings on parse error', () => {
			const result = hint('let = ;');
			expect(result.warnings).toEqual([]);
		});

		it('returns formatted false on parse error', () => {
			const result = hint('let = ;');
			expect(result.formatted).toBe(false);
		});
	});

	describe('rejections', () => {
		it('returns ok false for non-JeJ code', () => {
			const result = hint('var x = 5;\n');
			expect(result.ok).toBe(false);
		});

		it('sets rejections', () => {
			const result = hint('var x = 5;\n');
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('returns empty warnings for non-JeJ code', () => {
			const result = hint('var x = 5;\n');
			expect(result.warnings).toEqual([]);
		});

		it('returns formatted false for non-JeJ code', () => {
			const result = hint('var x = 5;\n');
			expect(result.formatted).toBe(false);
		});
	});

	describe('valid code', () => {
		it('returns ok true for valid JeJ code', () => {
			const code = format('let x = 5;\n');
			const result = hint(code);
			expect(result.ok).toBe(true);
		});

		it('includes warnings array', () => {
			const code = format('let x = 5;\n');
			const result = hint(code);
			expect(result.warnings).toBeDefined();
		});

		it('returns formatted true for properly formatted code', () => {
			const code = format('let x = 5;\n');
			const result = hint(code);
			expect(result.formatted).toBe(true);
		});

		it('returns formatted false for unformatted JeJ code', () => {
			const result = hint('let x=5;');
			// unformatted but still valid JeJ
			expect(result.formatted).toBe(false);
		});
	});

	describe('warning content', () => {
		it('warns about assignment in condition', () => {
			const code = format(
				'let x = 5;\nif (x = 10) {\n\tconsole.log(x);\n}\n',
			);
			const result = hint(code);
			expect(result.ok).toBe(true);
			expect(
				result.warnings.some((w) =>
					w.message.includes("'=' in condition"),
				),
			).toBe(true);
		});

		it('warns about unused expression', () => {
			const code = format('let x = 5;\nx;\n');
			const result = hint(code);
			expect(result.ok).toBe(true);
			expect(
				result.warnings.some((w) =>
					w.message.includes('not used'),
				),
			).toBe(true);
		});

		it('warns about non-camelCase variable', () => {
			const code = format('let my_var = 5;\n');
			const result = hint(code);
			expect(result.ok).toBe(true);
			expect(
				result.warnings.some((w) =>
					w.message.includes('camelCase'),
				),
			).toBe(true);
		});

		it('warns about empty block', () => {
			const code = format('if (true) {\n}\n');
			const result = hint(code);
			expect(result.ok).toBe(true);
			expect(
				result.warnings.some((w) =>
					w.message.includes('Empty block'),
				),
			).toBe(true);
		});

		it('includes scope warnings from validation', () => {
			// unused variable is a scope-analysis warning from validating/
			const code = format('let x = 5;\n');
			const result = hint(code);
			expect(result.ok).toBe(true);
			expect(
				result.warnings.some((w) => w.message.includes("'x'")),
			).toBe(true);
		});

		it('all warnings have severity warning', () => {
			const code = format(
				'let my_var = 5;\nif (my_var = 10) {\n}\n',
			);
			const result = hint(code);
			expect(result.ok).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0);
			for (const w of result.warnings) {
				expect(w.severity).toBe('warning');
			}
		});
	});

	describe('result is frozen', () => {
		it('result is frozen on success', () => {
			const code = format('let x = 5;\n');
			const result = hint(code);
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('result is frozen on failure', () => {
			const result = hint('let = ;');
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('property assignment', () => {
		it('rejects console.log = 5', () => {
			const result = hint('console.log = 5;\n');
			expect(result.ok).toBe(false);
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});
	});
});
