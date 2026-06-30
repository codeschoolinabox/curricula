/**
 * Pure tests for the mastery-decoration projector (`masteryDecorations`, inc 5).
 * No jsdom — the projection from quiz items + `MasteryState` to the two
 * color-free channels (`MasteryDecos`) is pure and CodeMirror-independent.
 * Fixtures are real V1 items from `buildQuiz`: the two `x` tokens of
 * `let x = 1; x;` share groupKey `category:identifier`, so a single progressed
 * group must decorate BOTH tokens — the same-group propagation the channels
 * exist for. The painted CodeMirror result is verified at the 🔍 sandbox.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import buildQuiz from '../lib/build-quiz.js';
import masteryDecorations from '../lib/decorations.js';

describe('masteryDecorations — project mastery onto the two channels', () => {
	const items = buildQuiz(embody('let x = 1; x;'))?.items ?? [];
	// Filter on `groupKey` (what the projector reads), not the V1 answer key.
	const identifierItems = items.filter(
		(item) => item.groupKey === 'category:identifier',
	);
	const keywordItem = items.find(
		(item) => item.groupKey === 'category:keyword',
	);

	it('fixture: two identifier tokens share category:identifier (guard)', () => {
		expect(identifierItems).toHaveLength(2);
	});

	it('fixture: the let keyword is its own group (guard)', () => {
		expect(keywordItem?.groupKey).toBe('category:keyword');
	});

	// ── Z — zero ────────────────────────────────────────────────

	it('empty mastery → both channels empty', () => {
		expect(masteryDecorations(items, {})).toEqual({ progress: [], wrong: [] });
	});

	it('no items → both channels empty', () => {
		expect(
			masteryDecorations([], {
				'category:identifier': { progress: 0.5, wrong: true },
			}),
		).toEqual({ progress: [], wrong: [] });
	});

	// ── O — one progressed group decorates every same-group token ─

	it('a progressed group underlines every same-group token at its bucket', () => {
		const decos = masteryDecorations(items, {
			'category:identifier': { progress: 0.25, wrong: false },
		});
		expect(decos.progress).toEqual(
			identifierItems.map((item) => ({ range: item.anchorRange, bucket: 1 })),
		);
	});

	// ── M — bucket mapping over the reachable 0.25-step values ───

	it('progress 0.5 → bucket 2', () => {
		const decos = masteryDecorations(items, {
			'category:identifier': { progress: 0.5, wrong: false },
		});
		expect(decos.progress[0]?.bucket).toBe(2);
	});

	it('progress 0.75 → bucket 3', () => {
		const decos = masteryDecorations(items, {
			'category:identifier': { progress: 0.75, wrong: false },
		});
		expect(decos.progress[0]?.bucket).toBe(3);
	});

	it('progress 1 → bucket 4', () => {
		const decos = masteryDecorations(items, {
			'category:identifier': { progress: 1, wrong: false },
		});
		expect(decos.progress[0]?.bucket).toBe(4);
	});

	// ── B — channel boundaries / independence ───────────────────

	it('a wrong-but-unprogressed group marks channel 2 only (progress 0 guard)', () => {
		const decos = masteryDecorations(items, {
			'category:identifier': { progress: 0, wrong: true },
		});
		expect(decos).toEqual({
			progress: [],
			wrong: identifierItems.map((item) => item.anchorRange),
		});
	});

	it('a group both progressed and wrong carries both channels', () => {
		const decos = masteryDecorations(items, {
			'category:identifier': { progress: 0.5, wrong: true },
		});
		expect(decos).toEqual({
			progress: identifierItems.map((item) => ({
				range: item.anchorRange,
				bucket: 2,
			})),
			wrong: identifierItems.map((item) => item.anchorRange),
		});
	});

	// ── I — interface / multiple groups ─────────────────────────

	it('a mastery key no item references contributes nothing', () => {
		const decos = masteryDecorations(items, {
			'category:nonexistent': { progress: 1, wrong: true },
		});
		expect(decos).toEqual({ progress: [], wrong: [] });
	});

	it('two distinct progressed groups are each decorated, in source order', () => {
		if (keywordItem === undefined) throw new Error('no keyword fixture item');
		const decos = masteryDecorations(items, {
			'category:keyword': { progress: 0.25, wrong: false },
			'category:identifier': { progress: 0.5, wrong: false },
		});
		expect(decos.progress).toEqual([
			{ range: keywordItem.anchorRange, bucket: 1 },
			...identifierItems.map((item) => ({
				range: item.anchorRange,
				bucket: 2,
			})),
		]);
	});

	// ── dedup — co-anchored same-group items decorate a token once ──

	it('co-anchored items sharing a token AND group decorate it once, not per item', () => {
		// `let`[0,3) carries V1 AND V2, both groupKey category:keyword (inc 6
		// co-anchoring). Without dedup the projector would emit two identical
		// [0,3] entries; the contract is one entry per token.
		const decos = masteryDecorations(items, {
			'category:keyword': { progress: 0.25, wrong: false },
		});
		expect(decos.progress).toEqual([{ range: [0, 3], bucket: 1 }]);
	});

	it('a token mastered in two groups at different buckets gets ONE entry at the higher bucket', () => {
		// decl `x`[4,5) is in category:identifier (V1) AND binding:4-5 (V6). With
		// the two groups progressed to different levels, the token reads as ONE
		// underline at the densest (highest) bucket — one entry per token.
		const decos = masteryDecorations(items, {
			'category:identifier': { progress: 0.25, wrong: false }, // bucket 1
			'binding:4-5': { progress: 0.5, wrong: false }, // bucket 2
		});
		const atDeclaration = decos.progress.filter(
			(entry) => entry.range[0] === 4 && entry.range[1] === 5,
		);
		expect(atDeclaration).toEqual([{ range: [4, 5], bucket: 2 }]);
	});

	it('the wrong channel also dedupes co-anchored same-group items to one per token', () => {
		// `let`[0,3) carries V1 AND V2, both category:keyword; a wrong flag on that
		// group marks the token once, not once per co-anchored item.
		const decos = masteryDecorations(items, {
			'category:keyword': { progress: 0, wrong: true },
		});
		expect(decos.wrong).toEqual([[0, 3]]);
	});

	// ── S — strings / exact-key matching ────────────────────────

	it('keys on exact groupKey — a role-refined key matches no role-less item', () => {
		const decos = masteryDecorations(items, {
			'category:identifier:read': { progress: 1, wrong: false },
		});
		expect(decos.progress).toEqual([]);
	});
});
