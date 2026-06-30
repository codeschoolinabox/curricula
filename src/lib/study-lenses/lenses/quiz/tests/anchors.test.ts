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
	// Real-composition snippet: `x` is declared AND referenced, so the registry
	// co-anchors several mcq forms per identifier (V1 on every token; V6/V7 on the
	// identifiers) — the bundle a clicked range resolves to. `itemsAt` is
	// mode-agnostic (it matches on `anchorRange` only), so it returns the FULL
	// co-anchored bundle build-quiz admits, not just the first item. Token map:
	// `let`=[0,3) `x`=[4,5) `=`=[6,7) `1`=[8,9) `;`=[9,10) `x`=[11,12) `;`=[12,13).
	// These counts also cross-check build-quiz's mode filter (a leaked V8/V10
	// code-answer item at a shared range would inflate the count); build-quiz.test.ts
	// locks that filter in isolation, so a count failure here points there.
	const CODE = 'let x = 1; x;';
	const model = buildQuiz(embody(CODE));
	const items = model?.items ?? [];
	const classified = model?.classified ?? [];
	const tokensWith = (text: string) =>
		classified.filter((token) => token.text === text);
	const [operator] = tokensWith('='); // `=` at [6,7) — only V1 anchors here
	const [declaration, reference] = tokensWith('x'); // decl [4,5); ref [11,12)

	it('returns [] for a range no item anchors to (Zero)', () => {
		expect(anchors.itemsAt(items, [9999, 10_000])).toEqual([]);
	});

	it('returns the single item at a lone-anchor token (One)', () => {
		const found = anchors.itemsAt(items, [operator.start, operator.end]);
		expect(found.length).toBe(1);
		expect(found[0].anchorRange).toEqual([operator.start, operator.end]);
	});

	it('returns EVERY co-anchored item at a shared range, not just the first (Many)', () => {
		const found = anchors.itemsAt(items, [reference.start, reference.end]);
		expect(found.length).toBe(2); // V1 + V7 both anchor the reference `x`
	});

	it('the co-anchored bundle is heterogeneous by form (V1 + V7), not one repeated form (Many)', () => {
		const found = anchors.itemsAt(items, [reference.start, reference.end]);
		const forms = new Set(found.map((item) => item.form));
		expect(forms).toEqual(new Set(['V1', 'V7']));
	});

	it('resolves a deeper bundle at the declaration — the count is range-driven, not constant (Boundary)', () => {
		const found = anchors.itemsAt(items, [declaration.start, declaration.end]);
		expect(found.length).toBe(3); // V1 + V6 + V7
	});
});
