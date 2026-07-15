/**
 * Pure tests for the quiz lens's mastery fold (`quizCore.masteryFold`, inc 5 +
 * earned propagation inc 7). No jsdom — the fold is a pure reducer
 * `(prior, item, verdict) → MasteryState`, keyed per `groupKey`. Fixtures are
 * real items from `buildQuiz` (mcq V1 for the inc-5 cases; select-in-code
 * V10a/b/c for the inc-7 propagation cases) and real verdicts from `gradeOption`
 * / `gradeRanges`, so the fold is exercised against the live `lib/quizzing`
 * contract, not hand-rolled literals. The two-channel decoration that renders
 * this state is wired in `index.tsx` and verified at the 🔍 sandbox checkpoint
 * (the paint needs a real browser; jsdom can't lay out CodeMirror).
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type {
	McqQuizItem,
	SelectInCodeQuizItem,
} from '../../../lib/quizzing/types.js';
import quizCore from '../core.js';
import buildQuiz from '../lib/build-quiz.js';
import gradeOption from '../lib/grade-option.js';
import gradeRanges from '../lib/grade-ranges.js';
import type { MasteryState } from '../types.js';

describe('masteryFold — fold a graded verdict into MasteryState', () => {
	// `let x = 1; x;` → V1 items. The two `x` tokens are role-less identifiers, so
	// both carry the bare groupKey `category:identifier` (see
	// `lib/quizzing/keying/classification-group-key.ts`); `let` is the keyword item
	// on `category:keyword`. Real items + real verdicts ground the fold in the live
	// contract.
	// `items` is the wide `QuizItem` union (build-quiz filters by mode, not to a
	// narrow type); narrow the lookups to the mcq form so `answerOptionIds` is typed.
	const items = buildQuiz(embody('let x = 1; x;'))?.items ?? [];
	const identifierItem = items.find(
		(item): item is McqQuizItem =>
			item.mode === 'mcq' && item.answerOptionIds.includes('identifier'),
	);
	const keywordItem = items.find(
		(item): item is McqQuizItem =>
			item.mode === 'mcq' && item.answerOptionIds.includes('keyword'),
	);

	it('the fixture yields the identifier V1 item on category:identifier (guard)', () => {
		expect(identifierItem?.groupKey).toBe('category:identifier');
	});

	it('the fixture yields the keyword V1 item on category:keyword (guard)', () => {
		expect(keywordItem?.groupKey).toBe('category:keyword');
	});

	// ── Z — zero / new group ────────────────────────────────────

	it('a first correct answer accrues progress one step on the item groupKey', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		expect(next).toEqual({
			[identifierItem.groupKey]: { progress: 0.25, wrong: false },
		});
	});

	it('a first incorrect answer marks the new group wrong at zero progress', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'keyword'),
		);
		expect(next).toEqual({
			[identifierItem.groupKey]: { progress: 0, wrong: true },
		});
	});

	// ── O — one more step ───────────────────────────────────────

	it('a correct answer on an existing group accrues one more step', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const correct = gradeOption(identifierItem, 'identifier');
		const afterFirst = quizCore.masteryFold({}, identifierItem, correct);
		const afterSecond = quizCore.masteryFold(
			afterFirst,
			identifierItem,
			correct,
		);
		expect(afterSecond).toEqual({
			[identifierItem.groupKey]: { progress: 0.5, wrong: false },
		});
	});

	// ── M — many / monotonic saturation ─────────────────────────

	it('saturates progress at 1 after four correct answers and never exceeds it', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const correct = gradeOption(identifierItem, 'identifier');
		let state: MasteryState = {};
		for (const verdict of [correct, correct, correct, correct, correct]) {
			state = quizCore.masteryFold(state, identifierItem, verdict);
		}
		expect(state[identifierItem.groupKey].progress).toBe(1);
	});

	// ── B — boundaries / two-channel interaction ────────────────

	it('an incorrect answer sets wrong and leaves progress unchanged (monotonic)', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const correct = gradeOption(identifierItem, 'identifier');
		let atThreeQuarters: MasteryState = {};
		for (const verdict of [correct, correct, correct]) {
			atThreeQuarters = quizCore.masteryFold(
				atThreeQuarters,
				identifierItem,
				verdict,
			);
		}
		const afterWrong = quizCore.masteryFold(
			atThreeQuarters,
			identifierItem,
			gradeOption(identifierItem, 'keyword'),
		);
		expect(afterWrong).toEqual({
			[identifierItem.groupKey]: { progress: 0.75, wrong: true },
		});
	});

	it('a correct answer clears the wrong flag and accrues (re-mastery)', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const correct = gradeOption(identifierItem, 'identifier');
		const incorrect = gradeOption(identifierItem, 'keyword');
		let wrongAtHalf: MasteryState = {};
		for (const verdict of [correct, correct, incorrect]) {
			wrongAtHalf = quizCore.masteryFold(wrongAtHalf, identifierItem, verdict);
		}
		const reMastered = quizCore.masteryFold(
			wrongAtHalf,
			identifierItem,
			correct,
		);
		expect(reMastered).toEqual({
			[identifierItem.groupKey]: { progress: 0.75, wrong: false },
		});
	});

	// ── I — interface / malformed no-op + independence ──────────

	it('a malformed verdict is a no-op — returns the prior state by reference', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const prior = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		const afterMalformed = quizCore.masteryFold(
			prior,
			identifierItem,
			gradeOption(identifierItem, 'not-a-category'),
		);
		expect(afterMalformed).toBe(prior);
	});

	it('accumulates two distinct groups independently', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		if (keywordItem === undefined) throw new Error('no keyword fixture item');
		const afterId = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		const afterBoth = quizCore.masteryFold(
			afterId,
			keywordItem,
			gradeOption(keywordItem, 'keyword'),
		);
		expect(afterBoth).toEqual({
			[identifierItem.groupKey]: { progress: 0.25, wrong: false },
			[keywordItem.groupKey]: { progress: 0.25, wrong: false },
		});
	});

	it('folds co-anchored declaration mcq items into distinct groupKeys, each independently (multi-group fold)', () => {
		// The declaration co-anchors several mcq forms (V1 category:identifier, V6
		// binding:4-5, V7 usage:4-5:declared, plus any others M2 adds) with DISTINCT
		// groupKeys. Answering all accrues each independently: the fold keys on
		// groupKey, so co-anchoring at one token neither collapses nor cross-credits
		// the groups. Scope to the mcq items (6c admits select-in-code at the same
		// anchor); the count is not hardcoded — the live M2 registry adds forms.
		const declItems = items.filter(
			(item) =>
				item.mode === 'mcq' &&
				item.anchorRange[0] === 4 &&
				item.anchorRange[1] === 5,
		) as McqQuizItem[];
		expect(declItems.length).toBeGreaterThanOrEqual(3); // at least V1/V6/V7
		const distinctKeys = [...new Set(declItems.map((item) => item.groupKey))];
		expect(distinctKeys.length).toBeGreaterThanOrEqual(3);
		let state: MasteryState = {};
		for (const item of declItems) {
			state = quizCore.masteryFold(
				state,
				item,
				gradeOption(item, item.answerOptionIds[0]),
			);
		}
		// The fold produces EXACTLY the decl's distinct groupKeys (none collapsed, no
		// phantom key), each accrued (progress >= one step) and none wrong.
		expect(new Set(Object.keys(state))).toEqual(new Set(distinctKeys));
		for (const key of distinctKeys) {
			expect(state[key].progress).toBeGreaterThanOrEqual(0.25);
			expect(state[key].wrong).toBe(false);
		}
	});

	it('a wrong answer on one co-anchored group leaves its co-anchored peers untouched (no contamination)', () => {
		// The critical isolation property of the multi-group anchor: a wrong answer on
		// binding:4-5 (V6) marks ONLY that group wrong. Because the fold keys on
		// groupKey, the peers co-anchored at the same token — category:identifier (V1)
		// and usage:4-5:declared (V7) — keep their prior mastery, uncontaminated.
		// Scope to the mcq items at the declaration — 6c admits select-in-code (V10a)
		// at the same anchor, so filter by mode to keep this fold about the mcq forms
		// (and to keep the `as McqQuizItem[]` cast sound).
		const declItems = items.filter(
			(item) =>
				item.mode === 'mcq' &&
				item.anchorRange[0] === 4 &&
				item.anchorRange[1] === 5,
		) as McqQuizItem[];
		const v6 = declItems.find((item) => item.groupKey === 'binding:4-5');
		const peers = declItems.filter((item) => item.groupKey !== 'binding:4-5');
		if (v6 === undefined || peers.length < 2) {
			throw new Error('fixture: expected V6 + at least two co-anchored peers');
		}
		// Master every peer first, then answer V6 wrong.
		let state: MasteryState = {};
		for (const peer of peers) {
			state = quizCore.masteryFold(
				state,
				peer,
				gradeOption(peer, peer.answerOptionIds[0]),
			);
		}
		const wrongOption = v6.options.find(
			(option) => !v6.answerOptionIds.includes(option.id),
		);
		if (wrongOption === undefined) throw new Error('V6 has no wrong option');
		const afterWrong = quizCore.masteryFold(
			state,
			v6,
			gradeOption(v6, wrongOption.id),
		);
		expect(afterWrong['binding:4-5']).toEqual({ progress: 0, wrong: true });
		// The wrong flag did NOT spread — every peer keeps its prior (correct) mastery.
		for (const peer of peers) {
			expect(afterWrong[peer.groupKey].wrong).toBe(false);
			expect(afterWrong[peer.groupKey].progress).toBeGreaterThanOrEqual(0.25);
		}
	});

	// ── E — exceptions / immutability ───────────────────────────

	it('returns a frozen MasteryState', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		expect(Object.isFrozen(next)).toBe(true);
	});

	it('freezes each GroupMastery entry', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		expect(Object.isFrozen(next[identifierItem.groupKey])).toBe(true);
	});

	it('does not mutate the prior state when folding a different group', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		if (keywordItem === undefined) throw new Error('no keyword fixture item');
		const prior = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		const priorGroup = prior[identifierItem.groupKey];
		quizCore.masteryFold(
			prior,
			keywordItem,
			gradeOption(keywordItem, 'keyword'),
		);
		expect(prior[identifierItem.groupKey]).toBe(priorGroup);
	});

	// ── S — strings / keying ────────────────────────────────────

	it('keys mastery on the item groupKey, never the item id', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		expect(Object.keys(next)).toEqual([identifierItem.groupKey]);
	});

	// ── inc 7 — earned propagation via unlocks ──────────────────
	describe('earned propagation — a correct sameness gesture credits item.unlocks', () => {
		// Sameness (select-in-code) items are sourced LIVE from buildQuiz (which admits
		// select-in-code since 6c). Their groupKey/unlocks come from lib/quizzing —
		// guarded below, then used in the assertions so a re-key surfaces loudly. On
		// `let x = 1; x;`: V10a is a member of its own unlock group; V10c-read is
		// self-excluded (it unlocks a binding-usage peer, not its own usage-kind group).
		const v10a = items.find(
			(item): item is SelectInCodeQuizItem =>
				item.mode === 'select-in-code' && item.form === 'V10a',
		);
		const v10bRead = items.find(
			(item): item is SelectInCodeQuizItem =>
				item.mode === 'select-in-code' &&
				item.form === 'V10b' &&
				item.groupKey === 'usage:4-5:read',
		);
		const v10cRead = items.find(
			(item): item is SelectInCodeQuizItem =>
				item.mode === 'select-in-code' &&
				item.form === 'V10c' &&
				item.groupKey === 'usage-kind:read',
		);
		// Cross-variable source: V10c "read" unlocks BOTH bindings' read groups, so one
		// gesture fans out to peers on different tokens (the visible-spread case).
		const crossItems =
			buildQuiz(embody('let a = 1; a; let b = 2; b;'))?.items ?? [];
		const v10cReadCross = crossItems.find(
			(item): item is SelectInCodeQuizItem =>
				item.mode === 'select-in-code' &&
				item.form === 'V10c' &&
				item.groupKey === 'usage-kind:read',
		);
		// All-global source: a free global has no resolvable binding, so V10c's unlocks
		// is EMPTY — the fold must still credit the own group and not crash.
		const globalItems = buildQuiz(embody('g;'))?.items ?? [];
		const v10cGlobal = globalItems.find(
			(item): item is SelectInCodeQuizItem =>
				item.mode === 'select-in-code' && item.form === 'V10c',
		);

		it('the fixture yields a V10a item that is a member of its own unlock group (guard)', () => {
			expect(v10a?.groupKey).toBe('binding:4-5');
			expect(v10a?.unlocks).toEqual(['binding:4-5']);
		});

		it('the fixture yields a self-excluded V10c read item unlocking a binding-usage peer (guard)', () => {
			expect(v10cRead?.groupKey).toBe('usage-kind:read');
			expect(v10cRead?.unlocks).toEqual(['usage:4-5:read']);
			expect(v10cRead?.unlocks).not.toContain('usage-kind:read');
			expect(v10bRead?.groupKey).toBe('usage:4-5:read'); // the peer's carrier
		});

		// ── Z — zero / propagation onto a not-yet-seen peer group ───

		it('a correct sameness gesture credits both the own group and a not-yet-seen peer', () => {
			if (v10cRead === undefined) throw new Error('no V10c read fixture');
			const next = quizCore.masteryFold(
				{},
				v10cRead,
				gradeRanges(v10cRead, v10cRead.targetRanges),
			);
			expect(next['usage-kind:read']).toEqual({ progress: 0.25, wrong: false });
			expect(next['usage:4-5:read']).toEqual({ progress: 0.25, wrong: false });
		});

		// ── O — one / self-membership dedup (credited once, not twice) ─

		it('dedups a self-membership unlock — V10a credits its own group exactly one step', () => {
			if (v10a === undefined) throw new Error('no V10a fixture');
			const next = quizCore.masteryFold(
				{},
				v10a,
				gradeRanges(v10a, v10a.targetRanges),
			);
			// own key === the only unlock → exactly one entry at one step (NOT 0.5)
			expect(Object.keys(next)).toEqual([v10a.groupKey]);
			expect(next[v10a.groupKey]).toEqual({ progress: 0.25, wrong: false });
		});

		// ── M — many / self-excluded V10c fans out across bindings ──

		it('credits the own group AND every peer for a self-excluded V10c across bindings', () => {
			if (v10cReadCross === undefined) {
				throw new Error('no cross-variable V10c fixture');
			}
			const expectedKeys = new Set([
				v10cReadCross.groupKey,
				...(v10cReadCross.unlocks ?? []),
			]);
			expect(expectedKeys.size).toBeGreaterThanOrEqual(3); // own + two peers
			const next = quizCore.masteryFold(
				{},
				v10cReadCross,
				gradeRanges(v10cReadCross, v10cReadCross.targetRanges),
			);
			expect(new Set(Object.keys(next))).toEqual(expectedKeys);
			for (const key of expectedKeys) {
				expect(next[key]).toEqual({ progress: 0.25, wrong: false });
			}
		});

		it('propagating to a peer with prior progress accrues ON TOP (not a flat reset)', () => {
			// The peer path is new code; guard against a flat `progress: MASTERY_STEP`
			// credit by giving the peer non-zero prior progress via direct answers first.
			if (v10bRead === undefined) throw new Error('no V10b read fixture');
			if (v10cRead === undefined) throw new Error('no V10c read fixture');
			const correctPeer = gradeRanges(v10bRead, v10bRead.targetRanges);
			let afterDirect: MasteryState = {};
			for (const verdict of [correctPeer, correctPeer]) {
				afterDirect = quizCore.masteryFold(afterDirect, v10bRead, verdict);
			}
			expect(afterDirect['usage:4-5:read']).toEqual({
				progress: 0.5,
				wrong: false,
			});
			const afterPropagation = quizCore.masteryFold(
				afterDirect,
				v10cRead,
				gradeRanges(v10cRead, v10cRead.targetRanges),
			);
			expect(afterPropagation['usage:4-5:read']).toEqual({
				progress: 0.75,
				wrong: false,
			});
		});

		it('propagating to a peer already at the ceiling stays capped at 1', () => {
			if (v10bRead === undefined) throw new Error('no V10b read fixture');
			if (v10cRead === undefined) throw new Error('no V10c read fixture');
			const correctPeer = gradeRanges(v10bRead, v10bRead.targetRanges);
			let saturated: MasteryState = {};
			for (const verdict of [
				correctPeer,
				correctPeer,
				correctPeer,
				correctPeer,
			]) {
				saturated = quizCore.masteryFold(saturated, v10bRead, verdict);
			}
			expect(saturated['usage:4-5:read'].progress).toBe(1);
			const afterPropagation = quizCore.masteryFold(
				saturated,
				v10cRead,
				gradeRanges(v10cRead, v10cRead.targetRanges),
			);
			expect(afterPropagation['usage:4-5:read']).toEqual({
				progress: 1,
				wrong: false,
			});
		});

		// ── B — boundaries: peer wrong preserved; incorrect never propagates ─

		it('correct propagation credits a peer progress but PRESERVES its prior wrong mark', () => {
			if (v10bRead === undefined) throw new Error('no V10b read fixture');
			if (v10cRead === undefined) throw new Error('no V10c read fixture');
			// Mark the peer group wrong via an incorrect V10b-read gesture ([] ≠ targets).
			const afterWrong = quizCore.masteryFold(
				{},
				v10bRead,
				gradeRanges(v10bRead, []),
			);
			expect(afterWrong['usage:4-5:read']).toEqual({
				progress: 0,
				wrong: true,
			});
			// A correct V10c-read gesture unlocks the peer: progress accrues, wrong stays.
			const afterPropagation = quizCore.masteryFold(
				afterWrong,
				v10cRead,
				gradeRanges(v10cRead, v10cRead.targetRanges),
			);
			expect(afterPropagation['usage:4-5:read']).toEqual({
				progress: 0.25,
				wrong: true,
			});
			expect(afterPropagation['usage-kind:read']).toEqual({
				progress: 0.25,
				wrong: false,
			});
		});

		it('an incorrect sameness gesture flags only the own group and does NOT propagate', () => {
			if (v10cRead === undefined) throw new Error('no V10c read fixture');
			const next = quizCore.masteryFold(
				{},
				v10cRead,
				gradeRanges(v10cRead, []),
			);
			expect(next['usage-kind:read']).toEqual({ progress: 0, wrong: true });
			expect(next['usage:4-5:read']).toBeUndefined();
			expect(Object.keys(next)).toEqual(['usage-kind:read']);
		});

		// ── I — interface / empty unlocks tolerated ─────────────────

		it('tolerates an empty unlocks list — credits only the own group (all-global V10c)', () => {
			if (v10cGlobal === undefined) {
				throw new Error('no all-global V10c fixture');
			}
			expect(v10cGlobal.unlocks).toEqual([]); // guard: the empty-unlocks case
			const next = quizCore.masteryFold(
				{},
				v10cGlobal,
				gradeRanges(v10cGlobal, v10cGlobal.targetRanges),
			);
			expect(Object.keys(next)).toEqual([v10cGlobal.groupKey]);
			expect(next[v10cGlobal.groupKey]).toEqual({
				progress: 0.25,
				wrong: false,
			});
		});

		// ── E — exceptions / every propagated entry is frozen ───────

		it('deep-freezes the state including every propagated peer entry', () => {
			if (v10cReadCross === undefined) {
				throw new Error('no cross-variable V10c fixture');
			}
			const next = quizCore.masteryFold(
				{},
				v10cReadCross,
				gradeRanges(v10cReadCross, v10cReadCross.targetRanges),
			);
			expect(Object.isFrozen(next)).toBe(true);
			for (const key of Object.keys(next)) {
				expect(Object.isFrozen(next[key])).toBe(true);
			}
		});

		it('leaves a group outside the credited set untouched by reference', () => {
			if (identifierItem === undefined) throw new Error('no fixture item');
			if (v10cRead === undefined) throw new Error('no V10c read fixture');
			// An mcq group unrelated to V10c-read's {usage-kind:read} ∪ {usage:4-5:read}.
			const prior = quizCore.masteryFold(
				{},
				identifierItem,
				gradeOption(identifierItem, 'identifier'),
			);
			const unrelated = prior['category:identifier'];
			const next = quizCore.masteryFold(
				prior,
				v10cRead,
				gradeRanges(v10cRead, v10cRead.targetRanges),
			);
			// The fold rebuilt only {groupKey} ∪ unlocks; the unrelated group is shared
			// by reference across the spreads, never re-created.
			expect(next['category:identifier']).toBe(unrelated);
		});

		// ── S — strings / keying: concept-group strings, never the item id ──

		it('credits concept-group strings, never the item id', () => {
			if (v10cReadCross === undefined) {
				throw new Error('no cross-variable V10c fixture');
			}
			const next = quizCore.masteryFold(
				{},
				v10cReadCross,
				gradeRanges(v10cReadCross, v10cReadCross.targetRanges),
			);
			// Propagation operates in the groupKey namespace — not the item id space.
			expect(Object.keys(next)).not.toContain(v10cReadCross.id);
			for (const key of Object.keys(next)) {
				expect(key).toMatch(/^(binding|usage-kind|usage):/);
			}
		});

		// regression ─ mcq fold unchanged (undefined unlocks → own group only)

		it('an mcq fold (undefined unlocks) still credits exactly its own group — inc-5 parity', () => {
			if (identifierItem === undefined) throw new Error('no fixture item');
			expect(identifierItem.unlocks).toBeUndefined();
			const next = quizCore.masteryFold(
				{},
				identifierItem,
				gradeOption(identifierItem, 'identifier'),
			);
			expect(Object.keys(next)).toEqual([identifierItem.groupKey]);
			expect(next[identifierItem.groupKey]).toEqual({
				progress: 0.25,
				wrong: false,
			});
		});
	});
});
