import { describe, expect, it } from 'vitest';

import quizzingSource from '../sources/quizzing-source.js';
import SOURCES from '../sources/registry.js';
import socratizingSource from '../sources/socratizing-source.js';

describe('SOURCES registry', () => {
	it('registers exactly two sources', () => {
		expect(SOURCES.length).toBe(2);
	});

	it('orders sources quizzing then socratizing (emission + tie-break order)', () => {
		expect(SOURCES.map((source) => source.id)).toEqual([
			'quizzing',
			'socratizing',
		]);
	});

	describe('membership (identity, not lookalike)', () => {
		it('entry 0 is the real quizzingSource adapter', () => {
			expect(SOURCES[0]).toBe(quizzingSource);
		});

		it('entry 1 is the real socratizingSource adapter', () => {
			expect(SOURCES[1]).toBe(socratizingSource);
		});
	});

	it('every registered source exposes a run function', () => {
		expect(SOURCES.every((source) => typeof source.run === 'function')).toBe(
			true,
		);
	});
});
