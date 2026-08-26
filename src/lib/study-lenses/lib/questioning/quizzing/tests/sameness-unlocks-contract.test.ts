// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/sameness-unlocks-contract.test.ts
// @ blob a84b71e1d2c42613253da6e05dd3051babf1418b
// rewires: embody-facts fixtures, classifying depth, classify-from-facts
// cspell:ignore formedness
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import generateQuiz from '../generate-quiz.js';
import type { QuizItem } from '../types.js';

/**
 * Cross-form well-formedness of the `unlocks` propagation-reference data contract,
 * over the FULL `generateQuiz` output (every generator). The per-generator suites
 * pin each sameness form's own `unlocks`; this suite pins the holistic invariants
 * the inc-5 AR-5 directive asked for: an entry is a real namespaced groupKey carried
 * by some peer item, entries are deduped, the sameness-vs-non-sameness boundary
 * holds, the membership rule (V10a/b in their own group, V10c not), and the V7
 * bulk-credit linkage.
 */

function classifyOf(facts: Facts): readonly ClassifiedToken[] {
	if (!facts.tokens.ok || !facts.ast.ok) {
		throw new Error('classifyOf requires parsed facts');
	}
	return classifyTokens({
		code: facts.source.value,
		tokens: facts.tokens.value.tokens,
		ast: facts.ast.value,
	});
}

function quizOf(code: string): readonly QuizItem[] {
	const { facts } = embody(code);
	return generateQuiz(facts, classifyOf(facts));
}

function unlocksOf(item: QuizItem): readonly string[] {
	return item.unlocks ?? [];
}

const SAMENESS_FORMS = new Set(['V10a', 'V10b', 'V10c']);
const KEY_GRAMMAR = /^(binding|usage|usage-kind):/u;

// RICH exercises all three sameness forms and their propagation peers:
// `a` declared / read / assigned, `b` declared / read, and a free global `g`.
const RICH = 'let a = 1; a; a = 2; let b = 2; b; g;';

describe('sameness unlocks contract (cross-form)', () => {
	describe('well-formedness', () => {
		it('emits some unlocks at all (the producers are wired)', () => {
			expect(
				quizOf(RICH).flatMap((item) => unlocksOf(item)).length,
			).toBeGreaterThan(0);
		});

		it('every unlocks entry is a namespaced groupKey string', () => {
			const entries = quizOf(RICH).flatMap((item) => unlocksOf(item));
			expect(entries.length).toBeGreaterThan(0);
			expect(entries.every((entry) => KEY_GRAMMAR.test(entry))).toBe(true);
		});

		it('every unlocks entry equals some emitted item groupKey', () => {
			const items = quizOf(RICH);
			const groupKeys = new Set(items.map((item) => item.groupKey));
			expect(
				items
					.flatMap((item) => unlocksOf(item))
					.every((entry) => groupKeys.has(entry)),
			).toBe(true);
		});

		it('lists no duplicate entries within one item', () => {
			const offenders = quizOf(RICH).filter(
				(item) => new Set(unlocksOf(item)).size !== unlocksOf(item).length,
			);
			expect(offenders).toEqual([]);
		});

		it('only the sameness forms carry unlocks; every other form omits the field', () => {
			const items = quizOf(RICH);
			// Guard: the non-sameness producers we are asserting about are present, so
			// the "others omit unlocks" check below is not vacuous.
			expect(items.some((item) => item.form === 'V1')).toBe(true);
			expect(items.some((item) => item.form === 'V8')).toBe(true);
			const withUnlocks = items.filter((item) => item.unlocks !== undefined);
			expect(withUnlocks.length).toBeGreaterThan(0);
			expect(withUnlocks.every((item) => SAMENESS_FORMS.has(item.form))).toBe(
				true,
			);
			expect(
				items
					.filter((item) => !SAMENESS_FORMS.has(item.form))
					.every((item) => item.unlocks === undefined),
			).toBe(true);
		});
	});

	describe('membership invariant', () => {
		it('V10a and V10b are members of the group they unlock (groupKey ∈ unlocks)', () => {
			const items = quizOf(RICH).filter(
				(item) => item.form === 'V10a' || item.form === 'V10b',
			);
			expect(items.length).toBeGreaterThan(0);
			expect(
				items.every((item) => unlocksOf(item).includes(item.groupKey)),
			).toBe(true);
		});

		it('V10c is NOT a member of the groups it unlocks (the deliberate exception)', () => {
			const items = quizOf(RICH).filter((item) => item.form === 'V10c');
			expect(items.length).toBeGreaterThan(0);
			expect(
				items.every((item) => !unlocksOf(item).includes(item.groupKey)),
			).toBe(true);
		});
	});

	describe('bulk-credit linkage / re-key stability', () => {
		it('every V10b unlock equals a re-keyed V7 item groupKey (V7 bulk-credit)', () => {
			const items = quizOf(RICH);
			const v7Keys = new Set(
				items.filter((item) => item.form === 'V7').map((item) => item.groupKey),
			);
			const v10bUnlocks = items
				.filter((item) => item.form === 'V10b')
				.flatMap((item) => unlocksOf(item));
			expect(v10bUnlocks.length).toBeGreaterThan(0);
			expect(v10bUnlocks.every((entry) => v7Keys.has(entry))).toBe(true);
		});

		it('links the declared use-type specifically (the self-resolution case)', () => {
			const items = quizOf('let a = 1;');
			const v10bDeclared = items.find((item) => item.form === 'V10b');
			const v7Declared = items.find((item) => item.form === 'V7');
			expect(v10bDeclared?.unlocks).toEqual([v7Declared?.groupKey]);
			expect(v7Declared?.groupKey).toBe('usage:4-5:declared');
		});

		it('every V10a unlock is a binding-identity key carried by a peer', () => {
			const items = quizOf(RICH);
			const bindingKeys = new Set(
				items
					.filter((item) => item.groupKey.startsWith('binding:'))
					.map((item) => item.groupKey),
			);
			const v10aUnlocks = items
				.filter((item) => item.form === 'V10a')
				.flatMap((item) => unlocksOf(item));
			expect(v10aUnlocks.length).toBeGreaterThan(0);
			expect(v10aUnlocks.every((entry) => bindingKeys.has(entry))).toBe(true);
		});

		it('every V10c unlock is a binding-scoped V7 usage key (not the cross-variable axis, not a global fallback)', () => {
			const items = quizOf(RICH);
			const v7Keys = new Set(
				items.filter((item) => item.form === 'V7').map((item) => item.groupKey),
			);
			const v10cUnlocks = items
				.filter((item) => item.form === 'V10c')
				.flatMap((item) => unlocksOf(item));
			expect(v10cUnlocks.length).toBeGreaterThan(0);
			expect(
				v10cUnlocks.every(
					(entry) =>
						entry.startsWith('usage:') && !entry.startsWith('usage:occ:'),
				),
			).toBe(true);
			expect(v10cUnlocks.every((entry) => v7Keys.has(entry))).toBe(true);
		});

		it('every re-keyed V7 usage key is unlocked by some V10b item (full bulk-credit coverage)', () => {
			const items = quizOf(RICH);
			const v7UsageKeys = items
				.filter(
					(item) =>
						item.form === 'V7' &&
						item.groupKey.startsWith('usage:') &&
						!item.groupKey.startsWith('usage:occ:'),
				)
				.map((item) => item.groupKey);
			const v10bUnlocks = new Set(
				items
					.filter((item) => item.form === 'V10b')
					.flatMap((item) => unlocksOf(item)),
			);
			expect(v7UsageKeys.length).toBeGreaterThan(0);
			expect(v7UsageKeys.every((key) => v10bUnlocks.has(key))).toBe(true);
		});
	});

	describe('V10c cross-binding unlocks', () => {
		it('lists one unlock per distinct binding for a cross-variable group, source-ordered', () => {
			const read = quizOf('let a = 1; a; let b = 2; b;').find(
				(item) => item.form === 'V10c' && item.groupKey === 'usage-kind:read',
			);
			expect(read?.unlocks).toEqual(['usage:4-5:read', 'usage:18-19:read']);
		});
	});
});
