import { describe, expect, it } from 'vitest';

import builtInLenses from '../built-in-lenses.js';

describe('builtInLenses', () => {
	describe('what a default mount offers', () => {
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

		it('carries no contract vocabulary a learner never meets', () => {
			const jargon = ['lens', 'phase', 'embodiment', 'applicability'];
			expect(
				builtInLenses.some((lens) =>
					jargon.some((word) => lens.label.toLowerCase().includes(word)),
				),
			).toBe(false);
		});
	});
});
