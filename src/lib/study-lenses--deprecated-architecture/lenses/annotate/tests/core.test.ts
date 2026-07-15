/**
 * @file Pure-TS tests for the `annotate` lens core. No React, no jsdom.
 * ZOMBIES coverage of the LensModule-defaults trio (`config`,
 * `applicableTo`, `recommend`) per `../README.md` § Public API and
 * `../DOCS.md` § Architectural sketch.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import core from '../core.js';

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return { ...embody('OK'), ...overrides };
}

describe('annotate core', () => {
	describe('config', () => {
		describe('no overrides → three documented defaults', () => {
			it('colorize defaults to true', () => {
				expect(core.config().colorize).toBe(true);
			});

			it('defaultView defaults to "code"', () => {
				expect(core.config().defaultView).toBe('code');
			});

			it('eraserRadius defaults to 20', () => {
				expect(core.config().eraserRadius).toBe(20);
			});
		});

		describe('{ colorize: false } override', () => {
			it('colorize is false', () => {
				expect(core.config({ colorize: false }).colorize).toBe(false);
			});

			it('defaultView still defaults to "code"', () => {
				expect(core.config({ colorize: false }).defaultView).toBe('code');
			});

			it('eraserRadius still defaults to 20', () => {
				expect(core.config({ colorize: false }).eraserRadius).toBe(20);
			});
		});

		describe('{ defaultView: "flowchart" } override', () => {
			it('defaultView is "flowchart"', () => {
				expect(core.config({ defaultView: 'flowchart' }).defaultView).toBe(
					'flowchart',
				);
			});

			it('colorize still defaults to true', () => {
				expect(core.config({ defaultView: 'flowchart' }).colorize).toBe(true);
			});

			it('eraserRadius still defaults to 20', () => {
				expect(core.config({ defaultView: 'flowchart' }).eraserRadius).toBe(20);
			});
		});

		describe('{ eraserRadius: 40 } override', () => {
			it('eraserRadius is 40', () => {
				expect(core.config({ eraserRadius: 40 }).eraserRadius).toBe(40);
			});

			it('colorize still defaults to true', () => {
				expect(core.config({ eraserRadius: 40 }).colorize).toBe(true);
			});

			it('defaultView still defaults to "code"', () => {
				expect(core.config({ eraserRadius: 40 }).defaultView).toBe('code');
			});
		});

		describe('all three overridden at once', () => {
			it('colorize is false', () => {
				expect(
					core.config({
						colorize: false,
						defaultView: 'flowchart',
						eraserRadius: 40,
					}).colorize,
				).toBe(false);
			});

			it('defaultView is "flowchart"', () => {
				expect(
					core.config({
						colorize: false,
						defaultView: 'flowchart',
						eraserRadius: 40,
					}).defaultView,
				).toBe('flowchart');
			});

			it('eraserRadius is 40', () => {
				expect(
					core.config({
						colorize: false,
						defaultView: 'flowchart',
						eraserRadius: 40,
					}).eraserRadius,
				).toBe(40);
			});
		});

		describe('unknown-field passthrough (open-shape contract)', () => {
			it('unknown field is preserved verbatim', () => {
				expect(core.config({ futureKnob: 'x' }).futureKnob).toBe('x');
			});
		});

		describe('null value override (open-shape contract — overrides win)', () => {
			it('null override is preserved verbatim', () => {
				expect(core.config({ colorize: null }).colorize).toBe(null);
			});
		});

		describe('deep-freeze invariant', () => {
			it('returned object is frozen', () => {
				expect(Object.isFrozen(core.config())).toBe(true);
			});

			it('mutating the returned object throws', () => {
				const resolved = core.config();
				expect(() => {
					(resolved as { colorize: boolean }).colorize = false;
				}).toThrow();
			});
		});
	});

	describe('applicableTo (Tier 1 — always applies)', () => {
		it('returns true for the apex snippet', () => {
			expect(core.applicableTo(makeSnippet())).toBe(true);
		});

		it('returns true for a parse-fail snippet (Tier 1 ignores parse status)', () => {
			const parseFail = makeSnippet({
				status: {
					tokenized: true,
					parsed: false,
					validated: false,
					created: false,
				},
				validation: null,
				errors: {
					phase: 'parse:ast',
					kind: 'SyntaxError',
					message: 'unexpected token',
					loc: null,
				},
			});
			expect(core.applicableTo(parseFail)).toBe(true);
		});
	});

	describe('recommend (WS2-deferred placeholder — always empty)', () => {
		it('returns an empty array for the apex snippet', () => {
			expect(core.recommend(makeSnippet())).toEqual([]);
		});

		it('returns an empty array for a parse-fail snippet', () => {
			const parseFail = makeSnippet({
				status: {
					tokenized: true,
					parsed: false,
					validated: false,
					created: false,
				},
				validation: null,
				errors: {
					phase: 'parse:ast',
					kind: 'SyntaxError',
					message: 'unexpected token',
					loc: null,
				},
			});
			expect(core.recommend(parseFail)).toEqual([]);
		});

		it('returned array is frozen', () => {
			expect(Object.isFrozen(core.recommend(makeSnippet()))).toBe(true);
		});
	});
});
