// cspell:ignore spellme

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import spellmeCore from '../core.js';
import type { Claim, SessionState } from '../types.js';

const emptySession: SessionState = {
	cursor: 0,
	attempts: 0,
	fallen: [],
	lastVerdicts: null,
};

function streamOf(source: string) {
	return spellmeCore.readStream(embody(source).facts);
}

function claim(
	elementKind: Claim['elementKind'],
	extent: number,
	oneMore: Claim['oneMore'] = null,
): Claim {
	return { elementKind, extent, oneMore };
}

describe('spellme core', () => {
	describe('Zero', () => {
		it.skip('reads an empty stream from an empty program', () => {
			expect(streamOf('')).toEqual([]);
		});

		it.skip('positions the cursor past the end of a program with nothing claimable', () => {
			expect(spellmeCore.positionCursor(streamOf('  '), 0)).toBe(1);
		});
	});

	describe('One', () => {
		it.skip('reads one element from a one-element program', () => {
			expect(streamOf('x')).toHaveLength(1);
		});

		it.skip('gives a claimable element the token-tape fate', () => {
			expect(streamOf('x')[0]?.fate).toBe('token-tape');
		});
	});

	describe('Many', () => {
		it.skip('reads every element of a short declaration', () => {
			expect(streamOf('const x = 1')).toHaveLength(7);
		});

		it.skip('rests the cursor on the first claimable element', () => {
			expect(spellmeCore.positionCursor(streamOf('  x'), 0)).toBe(1);
		});

		it.skip('advances the cursor past a run of trivia between claimable elements', () => {
			expect(spellmeCore.positionCursor(streamOf('a  b'), 1)).toBe(2);
		});
	});

	describe('The three fates, and the mark', () => {
		it.skip('sends a comment to the jar', () => {
			expect(streamOf('// hi')[0]?.fate).toBe('set-aside');
		});

		it.skip('sends a hashbang to the jar', () => {
			expect(streamOf('#!/usr/bin/env node\nx')[0]?.fate).toBe('set-aside');
		});

		it.skip('evaporates whitespace', () => {
			expect(streamOf('a b')[1]?.fate).toBe('consumed');
		});

		it.skip('evaporates a line terminator', () => {
			expect(streamOf('a\nb')[1]?.fate).toBe('consumed');
		});

		it.skip('marks a block comment carrying a line terminator', () => {
			expect(streamOf('/* a\nb */')[0]?.marked).toBe(true);
		});

		it.skip('leaves a block comment without a line terminator unmarked', () => {
			expect(streamOf('/* ab */')[0]?.marked).toBe(false);
		});

		it.skip('leaves a line comment unmarked', () => {
			expect(streamOf('// hi')[0]?.marked).toBe(false);
		});

		it.skip('leaves a hashbang unmarked', () => {
			expect(streamOf('#!/usr/bin/env node\nx')[0]?.marked).toBe(false);
		});
	});

	describe('Verdicts — judged independently', () => {
		it.skip('attests a wholly correct claim on the element kind', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('const x'),
					0,
					claim('IdentifierName', 5),
				).elementKind,
			).toBe('attested');
		});

		it.skip('attests a wholly correct claim on the extent', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('const x'),
					0,
					claim('IdentifierName', 5),
				).extent,
			).toBe('attested');
		});

		it.skip('attests the kind while diverging on the extent', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('const x'),
					0,
					claim('IdentifierName', 3),
				).elementKind,
			).toBe('attested');
		});

		it.skip('diverges on the extent while attesting the kind', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('const x'),
					0,
					claim('IdentifierName', 3),
				).extent,
			).toBe('diverging');
		});

		it.skip('judges a reserved word an IdentifierName', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('if (a) {}'),
					0,
					claim('IdentifierName', 2),
				).elementKind,
			).toBe('attested');
		});

		it.skip('diverges when a boolean is claimed as a literal kind', () => {
			expect(
				spellmeCore.judgeClaim(streamOf('true'), 0, claim('StringLiteral', 4))
					.elementKind,
			).toBe('diverging');
		});

		it.skip('leaves the one-more verdict absent when the claim carried no answer', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('const x'),
					0,
					claim('IdentifierName', 5),
				).oneMore,
			).toBeNull();
		});
	});

	describe('The one-more-character question', () => {
		it.skip('attests not-an-element when the shown extent already exceeds the true one', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('a+++b'),
					1,
					claim('Punctuator', 3, 'not-an-element'),
				).oneMore,
			).toBe('attested');
		});

		it.skip('attests not-an-element at the true extent of a maximal munch', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('a+++b'),
					1,
					claim('Punctuator', 2, 'not-an-element'),
				).oneMore,
			).toBe('attested');
		});

		it.skip('diverges on a different-kind answer where no table row would help', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('a?.5:b'),
					1,
					claim('Punctuator', 1, 'different-kind'),
				).oneMore,
			).toBe('diverging');
		});

		it.skip('attests same-kind where the run is exactly the element and the kind matches', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('a+++b'),
					1,
					claim('Punctuator', 1, 'same-kind'),
				).oneMore,
			).toBe('attested');
		});

		it.skip('attests different-kind where the run is exactly the element but the kind does not match', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('a+++b'),
					1,
					claim('NumericLiteral', 1, 'different-kind'),
				).oneMore,
			).toBe('attested');
		});

		it.skip('diverges on a same-kind answer where the run falls short of the element', () => {
			expect(
				spellmeCore.judgeClaim(
					streamOf('1_000'),
					0,
					claim('NumericLiteral', 1, 'same-kind'),
				).oneMore,
			).toBe('diverging');
		});
	});

	describe('Fall or wait — the gate', () => {
		it.skip('advances the cursor when kind and extent both attest', () => {
			const stream = streamOf('const x');
			const verdicts = spellmeCore.judgeClaim(
				stream,
				0,
				claim('IdentifierName', 5),
			);
			expect(
				spellmeCore.settle(emptySession, stream, verdicts).cursor,
			).toBeGreaterThan(0);
		});

		it.skip('moves nothing when a blocking field diverges', () => {
			const stream = streamOf('const x');
			const verdicts = spellmeCore.judgeClaim(
				stream,
				0,
				claim('IdentifierName', 3),
			);
			expect(spellmeCore.settle(emptySession, stream, verdicts).cursor).toBe(0);
		});

		it.skip('raises the attempt count when a blocking field diverges', () => {
			const stream = streamOf('const x');
			const verdicts = spellmeCore.judgeClaim(
				stream,
				0,
				claim('IdentifierName', 3),
			);
			expect(spellmeCore.settle(emptySession, stream, verdicts).attempts).toBe(
				1,
			);
		});

		it.skip('falls despite a diverging one-more answer, which never blocks', () => {
			const stream = streamOf('a+++b');
			const verdicts = spellmeCore.judgeClaim(
				stream,
				1,
				claim('Punctuator', 2, 'same-kind'),
			);
			expect(
				spellmeCore.settle({ ...emptySession, cursor: 1 }, stream, verdicts)
					.cursor,
			).toBeGreaterThan(1);
		});

		it.skip('resets the attempt count when the cursor advances', () => {
			const stream = streamOf('const x');
			const verdicts = spellmeCore.judgeClaim(
				stream,
				0,
				claim('IdentifierName', 5),
			);
			expect(
				spellmeCore.settle({ ...emptySession, attempts: 3 }, stream, verdicts)
					.attempts,
			).toBe(0);
		});

		it.skip('records a fallen element as the learner claimed', () => {
			const stream = streamOf('const x');
			const verdicts = spellmeCore.judgeClaim(
				stream,
				0,
				claim('IdentifierName', 5),
			);
			expect(
				spellmeCore.settle(emptySession, stream, verdicts).fallen[0]
					?.provenance,
			).toBe('claimed');
		});
	});

	describe('The way past', () => {
		it.skip('advances the cursor when the element is handed to the machine', () => {
			const stream = streamOf('const x');
			expect(
				spellmeCore.handOver({ ...emptySession, attempts: 4 }, stream).cursor,
			).toBeGreaterThan(0);
		});

		it.skip('records a handed-over element as unclaimed', () => {
			const stream = streamOf('const x');
			expect(
				spellmeCore.handOver({ ...emptySession, attempts: 4 }, stream).fallen[0]
					?.provenance,
			).toBe('unclaimed');
		});

		it.skip('resets the attempt count after handing over', () => {
			const stream = streamOf('const x');
			expect(
				spellmeCore.handOver({ ...emptySession, attempts: 4 }, stream).attempts,
			).toBe(0);
		});
	});

	describe('config', () => {
		it('applies the one-more threshold default', () => {
			expect(spellmeCore.config().oneMoreAfter).toBe(2);
		});

		it('applies the way-past threshold default', () => {
			expect(spellmeCore.config().skipAfter).toBe(4);
		});

		it('lets an override win', () => {
			expect(spellmeCore.config({ oneMoreAfter: 0 }).oneMoreAfter).toBe(0);
		});

		it('treats a key present with undefined as absent', () => {
			expect(spellmeCore.config({ oneMoreAfter: undefined }).oneMoreAfter).toBe(
				2,
			);
		});

		it('preserves an unknown key verbatim', () => {
			expect(spellmeCore.config({ future: 'value' }).future).toBe('value');
		});

		it('freezes the result', () => {
			expect(Object.isFrozen(spellmeCore.config())).toBe(true);
		});

		it('does not freeze the caller overrides object', () => {
			const overrides = { skipAfter: 6 };
			spellmeCore.config(overrides);
			expect(Object.isFrozen(overrides)).toBe(false);
		});

		it('accepts a threshold below the other, leaving the one-more field unreachable', () => {
			expect(spellmeCore.config({ skipAfter: 1 }).skipAfter).toBe(1);
		});
	});

	describe('applicability', () => {
		it.skip('holds for a program that lexes and parses', () => {
			expect(spellmeCore.applicability(embody('const x = 1').facts)).toBe(true);
		});

		it.skip('holds for a program that lexes but does not parse', () => {
			expect(spellmeCore.applicability(embody('const x = ').facts)).toBe(true);
		});

		it.skip('fails for a program that does not lex', () => {
			expect(spellmeCore.applicability(embody('const x = "').facts)).toBe(
				false,
			);
		});
	});

	describe('recommend', () => {
		it.skip('returns the empty array', () => {
			expect(spellmeCore.recommend()).toEqual([]);
		});

		it.skip('returns a frozen array', () => {
			expect(Object.isFrozen(spellmeCore.recommend())).toBe(true);
		});

		it.skip('returns a stable reference across calls', () => {
			expect(spellmeCore.recommend()).toBe(spellmeCore.recommend());
		});
	});

	describe('Exceptions', () => {
		it.skip('refuses a negative threshold', () => {
			expect(() => spellmeCore.config({ skipAfter: -1 })).toThrow(TypeError);
		});

		it.skip('refuses a fractional threshold', () => {
			expect(() => spellmeCore.config({ oneMoreAfter: 1.5 })).toThrow(
				TypeError,
			);
		});

		it.skip('refuses a non-finite threshold', () => {
			expect(() => spellmeCore.config({ skipAfter: Number.NaN })).toThrow(
				TypeError,
			);
		});
	});
});
