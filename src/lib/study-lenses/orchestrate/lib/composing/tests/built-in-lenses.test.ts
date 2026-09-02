import { describe, expect, it } from 'vitest';

import builtInLenses from '../built-in-lenses.js';

describe('builtInLenses', () => {
	describe('what a default mount offers', () => {
		it('offers at least one lens', () => {
			expect(builtInLenses.length).toBeGreaterThan(0);
		});

		it('carries no development harness', () => {
			expect(builtInLenses.map((lens) => lens.name)).not.toContain(
				'debug-props',
			);
		});
	});

	describe('every built-in label is learner-facing', () => {
		it('authors a label for every lens', () => {
			expect(builtInLenses.every((lens) => lens.label.trim().length > 0)).toBe(
				true,
			);
		});

		it('never draws a lens machine name as its label', () => {
			expect(builtInLenses.some((lens) => lens.label === lens.name)).toBe(
				false,
			);
		});

		it('carries no term a learner would need the glossary for', () => {
			const needsTheGlossary =
				/\b(lens|lenses|embodiment|applicability|gateable|barring edge|openable|undetermined|does-not-fit|not-applicable-for-type)\b/i;
			expect(
				builtInLenses.some((lens) => needsTheGlossary.test(lens.label)),
			).toBe(false);
		});

		it('permits a term the operational test admits, such as phase', () => {
			const needsTheGlossary =
				/\b(lens|lenses|embodiment|applicability|gateable|barring edge|openable|undetermined|does-not-fit|not-applicable-for-type)\b/i;
			expect(needsTheGlossary.test('walk the phases in order')).toBe(false);
		});
	});
});
