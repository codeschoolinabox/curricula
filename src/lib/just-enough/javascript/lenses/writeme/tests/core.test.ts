import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import writemeCore from '../core.js';

describe('writeme core', () => {
	describe('config', () => {
		describe('Zero — no overrides applies the documented defaults', () => {
			it('viewMode defaults to write', () => {
				expect(writemeCore.config().viewMode).toBe('write');
			});

			it('colorize defaults to true', () => {
				expect(writemeCore.config().colorize).toBe(true);
			});

			it('suggestions defaults to false', () => {
				expect(writemeCore.config().suggestions).toBe(false);
			});

			it('diff defaults to true', () => {
				expect(writemeCore.config().diff).toBe(true);
			});

			it('keepComments defaults to true', () => {
				expect(writemeCore.config().keepComments).toBe(true);
			});

			it('hintsMode defaults to on', () => {
				expect(writemeCore.config().hintsMode).toBe('on');
			});
		});

		describe('One — a single override wins over its default', () => {
			it('viewMode override wins', () => {
				expect(writemeCore.config({ viewMode: 'read' }).viewMode).toBe('read');
			});

			it('diff false override wins over the true default', () => {
				expect(writemeCore.config({ diff: false }).diff).toBe(false);
			});

			it('suggestions true override wins over the false default', () => {
				expect(writemeCore.config({ suggestions: true }).suggestions).toBe(
					true,
				);
			});

			it('colorize false override wins over the true default', () => {
				expect(writemeCore.config({ colorize: false }).colorize).toBe(false);
			});

			it('keepComments false override wins over the true default', () => {
				expect(writemeCore.config({ keepComments: false }).keepComments).toBe(
					false,
				);
			});

			it('hintsMode override wins', () => {
				expect(writemeCore.config({ hintsMode: 'off' }).hintsMode).toBe('off');
			});
		});

		describe('Many — all documented fields overridden simultaneously', () => {
			it('all documented fields can be overridden in one call', () => {
				const resolved = writemeCore.config({
					viewMode: 'read',
					colorize: false,
					suggestions: true,
					keepComments: false,
					diff: false,
					hintsMode: 'off',
				});
				expect(resolved.viewMode).toBe('read');
				expect(resolved.colorize).toBe(false);
				expect(resolved.suggestions).toBe(true);
				expect(resolved.keepComments).toBe(false);
				expect(resolved.diff).toBe(false);
				expect(resolved.hintsMode).toBe('off');
			});
		});

		describe('Boundaries — open shape preserves unknown and falsy overrides', () => {
			it('preserves an unknown key verbatim', () => {
				expect(writemeCore.config({ unknownField: 'kept' }).unknownField).toBe(
					'kept',
				);
			});

			it('still applies the defaults alongside an unknown key', () => {
				expect(writemeCore.config({ unknownField: 'kept' }).viewMode).toBe(
					'write',
				);
			});

			it('preserves a null override verbatim', () => {
				expect(writemeCore.config({ hintsMode: null }).hintsMode).toBe(null);
			});
		});

		describe('Interfaces — frozen return, caller input untouched', () => {
			it('returns a deep-frozen LensConfig', () => {
				expect(Object.isFrozen(writemeCore.config())).toBe(true);
			});

			it('does not freeze the caller-supplied overrides object', () => {
				const input = { diff: false as const };
				writemeCore.config(input);
				expect(Object.isFrozen(input)).toBe(false);
			});
		});

		describe('Exceptions — degenerate inputs', () => {
			it('config({}) still applies the defaults', () => {
				expect(writemeCore.config({}).viewMode).toBe('write');
			});
		});
	});

	describe('applicableTo — Tier 1, always applicable', () => {
		it('returns true for a parseable snippet', () => {
			expect(writemeCore.applicableTo(embody('const x = 1;'))).toBe(true);
		});

		it('returns true for an unparseable snippet', () => {
			expect(writemeCore.applicableTo(embody('FAIL_AT_PARSE'))).toBe(true);
		});

		it('returns true for an un-tokenizable snippet', () => {
			expect(writemeCore.applicableTo(embody('FAIL_AT_TOKENIZE'))).toBe(true);
		});
	});

	describe('recommend — WS2-deferred', () => {
		it('returns an empty array', () => {
			expect(writemeCore.recommend(embody('OK'))).toEqual([]);
		});

		it('returns a deep-frozen array', () => {
			expect(Object.isFrozen(writemeCore.recommend(embody('OK')))).toBe(true);
		});

		it('returns the shared reference across calls', () => {
			expect(writemeCore.recommend(embody('OK'))).toBe(
				writemeCore.recommend(embody('FAIL_AT_PARSE')),
			);
		});
	});
});
