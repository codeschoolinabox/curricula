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
import generateQuiz from '../../../lib/quizzing/generate-quiz.js';
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
	// co-anchors several forms per identifier across ALL THREE modes — mcq,
	// click-token (V8, on the reference), and select-in-code (V10a/b/c). `itemsAt`
	// is mode-agnostic (it matches on `anchorRange` only), so it returns the FULL
	// co-anchored bundle build-quiz admits, not just the first item. Token map:
	// `let`=[0,3) `x`=[4,5) `=`=[6,7) `1`=[8,9) `;`=[9,10) `x`=[11,12) `;`=[12,13).
	// Assertions below derive from the live bundle rather than hardcoding counts —
	// the M2 registry keeps adding forms (build-quiz.test.ts locks the mode filter).
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

	it('returns a frozen array — immutable at the module boundary', () => {
		// The bundle the panel drives is deep-frozen: the items are already frozen
		// upstream (build-quiz), and the array itself is frozen here so nothing can
		// mutate the returned resolution. (Every other lens boundary freezes.)
		const found = anchors.itemsAt(items, [reference.start, reference.end]);
		expect(Object.isFrozen(found)).toBe(true);
	});

	it('returns the single item at a lone-anchor token (One)', () => {
		const found = anchors.itemsAt(items, [operator.start, operator.end]);
		expect(found.length).toBe(1);
		expect(found[0].anchorRange).toEqual([operator.start, operator.end]);
	});

	it('returns EVERY co-anchored item at a shared range, not just the first (Many)', () => {
		const found = anchors.itemsAt(items, [reference.start, reference.end]);
		// The reference co-anchors several forms; the point is itemsAt returns ALL
		// of them, not just the first. (Exact membership is asserted below; the count
		// is not hardcoded — the live M2 registry adds forms over time.)
		expect(found.length).toBeGreaterThan(1);
	});

	it('the co-anchored bundle is heterogeneous across MODES (mcq + click-token + select-in-code) (Many)', () => {
		const found = anchors.itemsAt(items, [reference.start, reference.end]);
		const modes = new Set(found.map((item) => item.mode));
		// All three answer modes co-anchor the reference — mcq (V1/V7/…),
		// click-token (V8), select-in-code (V10b/c). itemsAt is mode-agnostic, so it
		// returns the whole heterogeneous bundle (this is the load-bearing property).
		expect(modes).toEqual(new Set(['mcq', 'click-token', 'select-in-code']));
	});

	it('resolves a range-driven bundle at the declaration — decl-only forms present, ref-only absent (Boundary)', () => {
		const atDecl = anchors.itemsAt(items, [declaration.start, declaration.end]);
		const atReference = anchors.itemsAt(items, [
			reference.start,
			reference.end,
		]);
		const declForms = new Set(atDecl.map((item) => item.form));
		// The declaration carries decl-only forms (V6 kind-semantics, V10a binding-
		// sameness) that the reference lacks, and lacks V8 (which anchors on a
		// reference, targeting the declaration) — so the bundle is range-driven,
		// not a constant set.
		expect(declForms.has('V6')).toBe(true);
		expect(declForms.has('V10a')).toBe(true);
		expect(declForms.has('V8')).toBe(false);
		expect(atDecl.length).not.toBe(atReference.length);
	});

	it('resolves the keyword bundle at `let` — V1 co-anchors V2, the keyword-vocab form (Interface)', () => {
		// V2 (keyword-vocab) anchors the `let` KEYWORD [0,3), a DISTINCT token from
		// the identifier forms (V6/V7). So the keyword's bundle is V1 + V2, both mcq
		// — the mode filter admits V2 and itemsAt resolves it co-anchored with V1.
		const [keyword] = tokensWith('let'); // `let` at [0,3)
		const found = anchors.itemsAt(items, [keyword.start, keyword.end]);
		const forms = new Set(found.map((item) => item.form));
		expect(forms).toEqual(new Set(['V1', 'V2']));
	});
});

describe('defaultActiveTab — the mode-aware safe default tab', () => {
	const CODE = 'let x = 1; x;';
	const model = buildQuiz(embody(CODE));
	const items = model?.items ?? [];
	const classified = model?.classified ?? [];
	const tokensWith = (text: string) =>
		classified.filter((token) => token.text === text);
	const [operator] = tokensWith('='); // `=` at [6,7) — a single mcq item
	const [, reference] = tokensWith('x'); // ref `x` at [11,12) — V1 + V7

	it('returns null for an empty bundle — no pick, nothing armed (Zero)', () => {
		expect(anchors.defaultActiveTab([])).toBeNull();
	});

	it('returns 0 for a single mcq item (One)', () => {
		const bundle = anchors.itemsAt(items, [operator.start, operator.end]);
		expect(anchors.defaultActiveTab(bundle)).toBe(0);
	});

	it('returns the first mcq index for a multi-mcq bundle (Many)', () => {
		const bundle = anchors.itemsAt(items, [reference.start, reference.end]);
		expect(anchors.defaultActiveTab(bundle)).toBe(0);
	});

	it('skips a leading non-mcq item to the first mcq — never index 0 unconditionally', () => {
		// The full (unfiltered) stream carries code-surface forms too; put one first
		// so a hardcoded `return 0` (which would auto-arm the editor) fails here.
		const all = generateQuiz(embody(CODE), classify(CODE));
		const clickToken = all.find((item) => item.mode === 'click-token');
		const mcq = all.find((item) => item.mode === 'mcq');
		if (clickToken === undefined || mcq === undefined) {
			throw new Error('fixture: expected a click-token and an mcq item');
		}
		expect(anchors.defaultActiveTab([clickToken, mcq])).toBe(1);
	});

	it('scans past several leading non-mcq items to the first mcq', () => {
		// mcq third, after a click-token AND a select-in-code — the index must come
		// from a full scan, not a peek at index 0 or 1.
		const all = generateQuiz(embody(CODE), classify(CODE));
		const clickToken = all.find((item) => item.mode === 'click-token');
		const selectInCode = all.find((item) => item.mode === 'select-in-code');
		const mcq = all.find((item) => item.mode === 'mcq');
		if (
			clickToken === undefined ||
			selectInCode === undefined ||
			mcq === undefined
		) {
			throw new Error('fixture: expected click-token, select-in-code, and mcq');
		}
		expect(anchors.defaultActiveTab([clickToken, selectInCode, mcq])).toBe(2);
	});

	it('returns null for a bundle with no mcq item — stays unarmed', () => {
		const all = generateQuiz(embody(CODE), classify(CODE));
		const codeItems = all.filter((item) => item.mode !== 'mcq');
		expect(codeItems.length).toBeGreaterThan(0);
		expect(anchors.defaultActiveTab(codeItems)).toBeNull();
	});
});
