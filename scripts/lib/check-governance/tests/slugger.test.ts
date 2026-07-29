import { describe, expect, it } from 'vitest';
import slugify from '../slugger.mjs';

describe('slugify', () => {
	it('returns an empty list for no headings', () => {
		expect(slugify([])).toEqual([]);
	});

	it('lowercases a single-word heading', () => {
		expect(slugify(['Scripts'])).toEqual(['scripts']);
	});

	it('joins words with single hyphens', () => {
		expect(slugify(['Data flow'])).toEqual(['data-flow']);
	});

	it('slugs each heading of a document in order', () => {
		expect(slugify(['Phases', 'Data flow', 'Constraints'])).toEqual([
			'phases',
			'data-flow',
			'constraints',
		]);
	});

	it('preserves hyphen runs where an em-dash vanishes between spaces', () => {
		expect(slugify(['Vibetoading and Frogramming — house terms'])).toEqual([
			'vibetoading-and-frogramming--house-terms',
		]);
	});

	it('drops the trademark sign', () => {
		expect(slugify(['Always Works™ Reality Check'])).toEqual([
			'always-works-reality-check',
		]);
	});

	it('drops backticks and dots', () => {
		expect(slugify(['7. No `this` Keyword'])).toEqual(['7-no-this-keyword']);
	});

	it('glues words together with no hyphen when no space is adjacent', () => {
		expect(slugify(['Spir@Learn'])).toEqual(['spirlearn']);
	});

	it('drops a trailing character without leaving a trailing hyphen', () => {
		expect(slugify(['Tendencies)'])).toEqual(['tendencies']);
	});

	it('keeps existing hyphens', () => {
		expect(slugify(['Sandbox Checkpoints — User-Observable Features'])).toEqual(
			['sandbox-checkpoints--user-observable-features'],
		);
	});

	it('counts duplicate headings github-style', () => {
		expect(slugify(['Data flow', 'Data flow'])).toEqual([
			'data-flow',
			'data-flow-1',
		]);
	});

	it('counts a third duplicate independently of the second', () => {
		expect(slugify(['Data flow', 'Data flow', 'Data flow'])).toEqual([
			'data-flow',
			'data-flow-1',
			'data-flow-2',
		]);
	});
});
