import { describe, expect, it } from 'vitest';

import hasMachineVocabulary from '../../../has-machine-vocabulary.js';
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
			expect(
				builtInLenses.some((lens) => hasMachineVocabulary(lens.label)),
			).toBe(false);
		});
	});
});
