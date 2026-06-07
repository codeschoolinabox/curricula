import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import core from '../core.js';

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return { ...embody('OK'), ...overrides };
}

describe('blanks core', () => {
	describe('config', () => {
		describe('Zero — no overrides applies all four defaults', () => {
			it('difficulty defaults to 50', () => {
				expect(core.config().difficulty).toBe(50);
			});

			it('contentTypes defaults to all five categories (Inc 6.6 adds delimiters)', () => {
				expect(core.config().contentTypes).toEqual([
					'keywords',
					'identifiers',
					'operators',
					'literals',
					'delimiters',
				]);
			});

			it('viewMode defaults to "blankenated"', () => {
				expect(core.config().viewMode).toBe('blankenated');
			});

			it('hintsMode defaults to "on" (orthogonal to difficulty)', () => {
				expect(core.config().hintsMode).toBe('on');
			});

			it('editorMode defaults to "helpful"', () => {
				expect(core.config().editorMode).toBe('helpful');
			});
		});

		describe('One — single-field overrides win', () => {
			it('difficulty override wins over default', () => {
				expect(core.config({ difficulty: 75 }).difficulty).toBe(75);
			});

			it('contentTypes override wins over default', () => {
				expect(
					core.config({ contentTypes: ['keywords'] }).contentTypes,
				).toEqual(['keywords']);
			});

			it('viewMode override wins over default', () => {
				expect(core.config({ viewMode: 'complete' }).viewMode).toBe('complete');
			});

			it('hintsMode override wins over default', () => {
				expect(core.config({ hintsMode: 'off' }).hintsMode).toBe('off');
			});

			it('editorMode override wins over default', () => {
				expect(core.config({ editorMode: 'diff' }).editorMode).toBe('diff');
			});
		});

		describe('Boundaries — open-shape preserves unknown keys', () => {
			it('preserves unknown keys verbatim', () => {
				const resolved = core.config({ unknownField: 'preserved' });
				expect(resolved['unknownField']).toBe('preserved');
			});

			it('still applies defaults when unknown keys are also present', () => {
				const resolved = core.config({ unknownField: 'preserved' });
				expect(resolved.difficulty).toBe(50);
			});

			it('null override is preserved verbatim (SerializableValue includes null)', () => {
				// Triangulates against the `overrides?.field ?? defaultValue`
				// anti-pattern: `??` would silently coerce a null override to
				// the default. Spread `{ ...overrides }` preserves null.
				expect(core.config({ difficulty: null }).difficulty).toBe(null);
			});
		});

		describe('Interfaces — frozen return + no caller-side mutation', () => {
			it('returns a deep-frozen LensConfig', () => {
				expect(Object.isFrozen(core.config())).toBe(true);
			});

			it('returned contentTypes array is frozen', () => {
				const resolved = core.config();
				expect(
					Object.isFrozen(resolved.contentTypes as ReadonlyArray<string>),
				).toBe(true);
			});

			it('contentTypes override is a fresh array (caller-side reference not retained)', () => {
				// Locks the contract: config() MUST NOT freeze the caller's
				// array as a side-effect. Use cloneAndFreeze (deep-clone)
				// rather than freezeInPlace on the spread result.
				const input: string[] = ['keywords'];
				const resolved = core.config({ contentTypes: input });
				expect(resolved.contentTypes).not.toBe(input);
			});

			it('caller-side input array remains mutable after config() returns', () => {
				const input: string[] = ['keywords'];
				core.config({ contentTypes: input });
				expect(() => input.push('identifiers')).not.toThrow();
			});
		});

		describe('Many — all four fields overridden simultaneously', () => {
			it('all four documented fields can be overridden in one call', () => {
				const resolved = core.config({
					difficulty: 75,
					contentTypes: ['operators'],
					viewMode: 'complete',
					hintsMode: 'off',
				});
				expect(resolved.difficulty).toBe(75);
				expect(resolved.contentTypes).toEqual(['operators']);
				expect(resolved.viewMode).toBe('complete');
				expect(resolved.hintsMode).toBe('off');
			});
		});

		describe('Exceptions — defensive', () => {
			it('accepts undefined overrides (matches the Partial<LensConfig> signature)', () => {
				expect(() => core.config()).not.toThrow();
			});

			it('accepts an empty-object overrides (defaults still apply)', () => {
				expect(core.config({}).difficulty).toBe(50);
			});
		});
	});

	describe('applicableTo (Tier 2 — gated on status.parsed)', () => {
		it('returns true for the apex snippet (parsed)', () => {
			expect(core.applicableTo(embody('OK'))).toBe(true);
		});

		it('returns false for a parse-fail snippet (Tier 2 gates)', () => {
			// Use embody() directly — spreading two frozen Snippets via
			// makeSnippet({ ...embody(...) }) produces a structurally
			// incoherent shallow merge; the named scenarios are already
			// complete Snippets.
			expect(core.applicableTo(embody('FAIL_AT_PARSE'))).toBe(false);
		});

		it('returns false for a tokenize-fail snippet (no parse possible)', () => {
			expect(core.applicableTo(embody('FAIL_AT_TOKENIZE'))).toBe(false);
		});
	});

	describe('recommend (WS2-deferred — empty array)', () => {
		it('returns an empty array', () => {
			expect(core.recommend(makeSnippet())).toEqual([]);
		});

		it('returns the same frozen reference across calls (module-level shared)', () => {
			const a = core.recommend(makeSnippet());
			const b = core.recommend(makeSnippet());
			expect(a).toBe(b);
		});

		it('returned array is frozen', () => {
			expect(Object.isFrozen(core.recommend(makeSnippet()))).toBe(true);
		});
	});
});
