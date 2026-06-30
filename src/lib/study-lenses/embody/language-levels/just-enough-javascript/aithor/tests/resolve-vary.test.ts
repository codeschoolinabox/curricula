import { describe, it, expect } from 'vitest';

import buildPrompt from '../build-prompt.js';
import conform from '../conform.js';
import resolveVary from '../resolve-vary.js';

// Increment 1 — resolveVary: the pure leaf that compiles a VaryConfig down to the
// existing primitives (feature subset + size bounds, hard) plus the held soft
// aspects, read off a parseable, non-empty seed. The precondition throws
// (empty/unparseable seed, vary-beside-raw mutual exclusivity) are increment 2;
// every seed here is a good seed.
//
// Test posture (mirrors build-prompt.test.ts): assert the load-bearing FACTS — the
// permitted set, the round-trip, the rendered clause, the soft-hold list — never a
// literal ALL_FEATURES array by reference (that 19-element order is not the contract).
//
// The round-trip guard (conform(seed, resolved.subset, resolved.size).ok === true)
// is the backbone: it proves resolveVary's inventory IS conform's own detector — the
// optional-chaining-at-root rule, the compound-vs-bitwise split, and the inclusive
// size boundary are all symmetric because both sides call the same featureForNode.

describe('resolveVary', () => {
	describe('zero — vary: {} frees everything (the no-op, ≡ no vary)', () => {
		it('resolves to an empty subset, no size bounds, and no soft holds', () => {
			const resolved = resolveVary('let x = 5;\n', {});

			expect(resolved.subset).toEqual({ include: [], exclude: [] });
			expect(resolved.size).toEqual({});
			expect(resolved.softHolds).toEqual([]);
		});
	});

	describe('one — hold languageLevel, non-empty inventory (the common path)', () => {
		const seed = 'let a = 1;\nif (a) {\n\ta = 2;\n}\n';

		it('resolves the subset to exactly the seed feature inventory', () => {
			const resolved = resolveVary(seed, { languageLevel: false });

			expect(resolved.subset.include).toEqual(['if']);
			expect(resolved.subset.exclude).toEqual([]);
			expect(resolved.size).toEqual({});
			expect(resolved.softHolds).toEqual([]);
		});

		it('the seed conforms to its own resolved inventory (round-trip)', () => {
			const resolved = resolveVary(seed, { languageLevel: false });

			expect(conform(seed, resolved.subset, resolved.size).ok).toBe(true);
		});

		it('the resolved subset is a real restriction — an out-of-inventory feature is rejected', () => {
			const resolved = resolveVary(seed, { languageLevel: false });

			// `while` is not in the seed's inventory, so the held level forbids it.
			expect(conform('while (a) {\n\ta;\n}\n', resolved.subset, {}).ok).toBe(
				false,
			);
		});

		it('dedupes and preserves pre-order across multiple features', () => {
			const resolved = resolveVary(
				'while (a) {\n\tif (b) {\n\t\tb;\n\t}\n}\nif (c) {\n\tc;\n}\n',
				{ languageLevel: false },
			);

			// pre-order: the outer `while`, then the nested `if`; the second `if` dedupes.
			expect(resolved.subset.include).toEqual(['while', 'if']);
		});
	});

	describe('one — hold languageLevel, empty inventory (the exclude-all idiom)', () => {
		const seed = 'let x = 5;\n';

		it('resolves to permit-none, not the empty include that would permit all', () => {
			const resolved = resolveVary(seed, { languageLevel: false });

			// permit-none vs permit-all is the distinction: a freed level's empty
			// `include` permits every feature; the held empty inventory must reject one.
			expect(conform('if (x) {\n\tx;\n}\n', resolved.subset, {}).ok).toBe(
				false,
			);
			expect(resolved.size).toEqual({});
			expect(resolved.softHolds).toEqual([]);
		});

		it('the seed conforms to it (round-trip — a feature-less seed is the simplest level)', () => {
			const resolved = resolveVary(seed, { languageLevel: false });

			expect(conform(seed, resolved.subset, resolved.size).ok).toBe(true);
		});

		it('renders "simple statements", never the forbid-all nonsense', () => {
			const resolved = resolveVary(seed, { languageLevel: false });
			const prompt = buildPrompt('', '', resolved.subset, resolved.size);

			expect(prompt).toContain('simple statements');
			// the forbid-list branch ("do not use: …") must not fire for an empty inventory
			expect(prompt).not.toContain('do not use');
		});
	});

	describe('round-trip backbone — varied admitted-JEJ seeds conform to their own inventory', () => {
		it.each([
			['empty inventory', 'let x = 5;\n'],
			['a control-flow feature', 'let a = 1;\nif (a) {\n\ta = 2;\n}\n'],
			['an operator-family feature', 'const a = 1 || 2;\n'],
			['optional chaining (root-only)', 'const a = b?.c?.d;\n'],
			['a compound assignment', 'let a = 1;\na += 2;\n'],
		])('%s', (_label, seed) => {
			const resolved = resolveVary(seed, { languageLevel: false });

			expect(conform(seed, resolved.subset, resolved.size).ok).toBe(true);
		});
	});

	describe('one — hold size (both dimensions, as ≤ maxima)', () => {
		// 8 physical lines (trailing newline counts); max control-flow nesting depth 2
		// (while → if). lines ≠ complexity guards a transposed { lines, complexity }.
		const seed =
			'const a = 1;\nconst b = 2;\nwhile (a) {\n\tif (b) {\n\t\tb;\n\t}\n}\n';

		it('populates both bounds from the seed metrics, leaving the subset free', () => {
			const resolved = resolveVary(seed, { size: false });

			expect(resolved.size).toEqual({ lines: 8, complexity: 2 });
			expect(resolved.subset).toEqual({ include: [], exclude: [] });
			expect(resolved.softHolds).toEqual([]);
		});

		it('the seed sits exactly on its own inclusive bounds (round-trip)', () => {
			const resolved = resolveVary(seed, { size: false });

			expect(conform(seed, resolved.subset, resolved.size).ok).toBe(true);
		});

		it('reads the metrics off the actual seed, not constants (triangulation)', () => {
			// a different seed → different metrics: lines 5, depth 1. A hardcoded
			// { lines: 8, complexity: 2 } would survive the single-seed test above.
			const resolved = resolveVary('let a = 1;\nif (a) {\n\ta = 2;\n}\n', {
				size: false,
			});

			expect(resolved.size).toEqual({ lines: 5, complexity: 1 });
		});
	});

	describe('soft tier — independent dials, held iff === false', () => {
		const seed = 'let x = 5;\n';

		it.each([
			['behavior', ['behavior']],
			['strategy', ['strategy']],
			['implementation', ['implementation']],
		])('holds %s alone, leaving both hard tiers freed', (aspect, expected) => {
			const resolved = resolveVary(seed, { [aspect]: false });

			expect(resolved.softHolds).toEqual(expected);
			expect(resolved.subset).toEqual({ include: [], exclude: [] });
			expect(resolved.size).toEqual({});
		});

		it('emits soft holds in canonical field order, never caller key order', () => {
			// scrambled input order: implementation before behavior
			const resolved = resolveVary(seed, {
				implementation: false,
				behavior: false,
			});

			expect(resolved.softHolds).toEqual(['behavior', 'implementation']);
		});
	});

	describe('held iff === false — true and absent both free', () => {
		const seed = 'let a = 1;\nif (a) {\n\ta = 2;\n}\n';

		it('an explicit true frees the level exactly as an absent aspect would', () => {
			const explicitFree = resolveVary(seed, { languageLevel: true });
			const absent = resolveVary(seed, {});

			expect(explicitFree).toEqual(absent);
			expect(explicitFree.subset).toEqual({ include: [], exclude: [] });
		});

		it('a freed level on an empty-inventory seed stays freed, never permit-none', () => {
			// guards an impl that branches on inventory-emptiness BEFORE the === false
			// gate: an empty inventory must NOT pull the exclude-all idiom when freed.
			const resolved = resolveVary('let x = 5;\n', { languageLevel: true });

			expect(resolved.subset).toEqual({ include: [], exclude: [] });
		});
	});

	describe('compose all five aspects held at once (field independence)', () => {
		const seed =
			'const a = 1;\nconst b = 2;\nwhile (a) {\n\tif (b) {\n\t\tb;\n\t}\n}\n';

		it('resolves subset, size, and soft holds together — no field clobbers another', () => {
			const resolved = resolveVary(seed, {
				languageLevel: false,
				size: false,
				behavior: false,
				strategy: false,
				implementation: false,
			});

			expect(resolved.subset.include).toEqual(['while', 'if']);
			expect(resolved.subset.exclude).toEqual([]);
			expect(resolved.size).toEqual({ lines: 8, complexity: 2 });
			expect(resolved.softHolds).toEqual([
				'behavior',
				'strategy',
				'implementation',
			]);
			expect(conform(seed, resolved.subset, resolved.size).ok).toBe(true);
		});
	});
});
