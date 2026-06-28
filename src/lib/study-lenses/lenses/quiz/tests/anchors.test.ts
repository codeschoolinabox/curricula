/**
 * Pure tests for the quiz lens's anchor resolution (`anchorAt`). No jsdom, no
 * CodeMirror — `anchorAt` operates on the classified-token stream only, so it
 * is testable in node and serves both the CM click path and the span-render
 * fallback unchanged. The classified fixtures are produced by the real
 * `classifyTokens` over an Acorn parse (the genuine input shape), so ranges are
 * realistic, half-open `[start, end)`, and source-ascending.
 *
 * The CM click→highlight path itself (`domEventHandlers` + `posAtCoords` + the
 * `StateField`/`StateEffect` → `Decoration.mark`) is NOT tested here: it needs
 * CodeMirror's layout engine (unavailable in jsdom), so it is verified at the
 * 🔍 sandbox checkpoint (a real-browser click). This file locks the pure
 * resolution `anchorAt` feeds that path.
 */

import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import classifyTokens from '../../../lib/classifying/classify-tokens.js';
import anchors from '../lib/anchors.js';
import buildQuiz from '../lib/build-quiz.js';

// Local acorn → classifyTokens helper (the build-quiz recipe, inlined here so
// the anchorAt test does not depend on build-quiz).
function classify(code: string) {
	const tokens: acorn.Token[] = [];
	const ast = acorn.parse(code, {
		ecmaVersion: 2022,
		sourceType: 'module',
		onToken: (token) => tokens.push(token),
	});
	return classifyTokens({ code, tokens, ast });
}

describe('anchorAt — token resolution', () => {
	// Zero — degenerate input.
	it('returns null for an empty classified stream', () => {
		expect(anchors.anchorAt(0, [])).toBeNull();
	});

	// One + Many over `let x = 1;` —
	// `let`=[0,3), `x`=[4,5), `=`=[6,7), `1`=[8,9), `;`=[9,10).
	describe('over `let x = 1;`', () => {
		const code = 'let x = 1;';
		const classified = classify(code);

		it('resolves an offset inside a token to that token (One)', () => {
			expect(anchors.anchorAt(4, classified)?.text).toBe('x');
		});

		it('resolves the inclusive start offset of a token to that token', () => {
			expect(anchors.anchorAt(0, classified)?.text).toBe('let');
		});

		it('resolves a third, distinct token — eliminates index special-casing (Many)', () => {
			expect(anchors.anchorAt(8, classified)?.text).toBe('1');
		});

		it('returns null for an offset on whitespace between tokens', () => {
			expect(anchors.anchorAt(3, classified)).toBeNull(); // the space after `let`
		});

		it('returns null at exactly source.length (one past the last token)', () => {
			expect(anchors.anchorAt(code.length, classified)).toBeNull(); // 10
		});

		it('returns null for a negative offset', () => {
			expect(anchors.anchorAt(-1, classified)).toBeNull();
		});
	});

	// Boundary seam — the half-open exclusive-end at a ZERO-GAP adjacency.
	// `x;` — `x`=[0,1), `;`=[1,2). Offset 1 is `x`'s exclusive end AND `;`'s
	// inclusive start; it must resolve to `;`, not `x`. This is the case a
	// `start <= offset <= end` bug would silently pass on whitespace-padded
	// fixtures.
	describe('exclusive-end at a zero-gap adjacency (`x;`)', () => {
		const classified = classify('x;');

		it('resolves the shared boundary offset to the NEXT token', () => {
			expect(anchors.anchorAt(1, classified)?.text).toBe(';');
		});

		it('resolves inside the first token to the first token', () => {
			expect(anchors.anchorAt(0, classified)?.text).toBe('x');
		});
	});
});

describe('itemsAt — item resolution', () => {
	// Real-composition snippet (7 classified tokens) → 7 V1 items, one per token.
	const CODE = 'let x = 1; x;';

	it('returns [] for a range with no item (Zero)', () => {
		const items = buildQuiz(embody(CODE))?.items ?? [];
		expect(anchors.itemsAt(items, [9999, 10_000])).toEqual([]);
	});

	it('returns the item anchored exactly at the first token range (One)', () => {
		const model = buildQuiz(embody(CODE));
		const classified = model?.classified ?? [];
		const items = model?.items ?? [];
		const first = classified[0];
		const found = anchors.itemsAt(items, [first.start, first.end]);
		expect(found.length).toBe(1);
		expect(found[0].anchorRange[0]).toBe(first.start);
		expect(found[0].anchorRange[1]).toBe(first.end);
	});

	it('resolves a MIDDLE token (not index 0) — forces exact end-range matching (Many)', () => {
		const model = buildQuiz(embody(CODE));
		const classified = model?.classified ?? [];
		const items = model?.items ?? [];
		const middle = classified[Math.floor(classified.length / 2)];
		const found = anchors.itemsAt(items, [middle.start, middle.end]);
		expect(found.length).toBe(1);
		expect(found[0].anchorRange[0]).toBe(middle.start);
		expect(found[0].anchorRange[1]).toBe(middle.end);
	});
});
