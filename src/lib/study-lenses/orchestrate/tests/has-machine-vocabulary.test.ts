import { describe, expect, it } from 'vitest';

import hasMachineVocabulary from '../has-machine-vocabulary.js';

describe('hasMachineVocabulary', () => {
	describe('ordinary learner copy (Zero)', () => {
		it('admits a sentence carrying none of it', () => {
			expect(hasMachineVocabulary('rebuild the order')).toBe(false);
		});
	});

	describe('one term a learner never meets (One)', () => {
		it('rejects a region contract noun', () => {
			expect(hasMachineVocabulary('inspect what a lens receives')).toBe(true);
		});
	});

	describe('the operational test, not the etymological one (Boundaries)', () => {
		it('admits phase, which the drawn copy uses', () => {
			expect(hasMachineVocabulary('four phases have nothing to open yet')).toBe(
				false,
			);
		});

		it('admits waiting, an ordinary word this region reclaimed', () => {
			expect(hasMachineVocabulary('waiting for the machine')).toBe(false);
		});

		it('rejects the barring edge, which names a boundary the copy never introduces', () => {
			expect(hasMachineVocabulary('drawn at the barring edge')).toBe(true);
		});
	});

	describe('whole words only (Interfaces)', () => {
		it('admits a word that merely contains a term', () => {
			expect(hasMachineVocabulary('a lensless view')).toBe(false);
		});

		it('ignores case', () => {
			expect(hasMachineVocabulary('Inspect What A Lens Receives')).toBe(true);
		});
	});

	describe('the mark vocabulary (Exceptions)', () => {
		it('rejects a machine mark value', () => {
			expect(hasMachineVocabulary('this is does-not-fit')).toBe(true);
		});
	});
});
