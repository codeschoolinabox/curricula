import { describe, it, expect } from 'vitest';

import buildPrompt from '../build-prompt.js';
import type { FeatureName } from '../types.js';

// Increment 1 — the initial-prompt builder: ask + program routing + the
// constraints stringified in. (Repair folding is Increment 2.)
//
// The unit is a pure, sync string builder; it takes DECOMPOSED resolved pieces
// (program, prompt, subset, size) — never an AithorConfig — and never consumes
// `validate` or `model`. The prompt is built regardless of validate, so
// "validate-independence" is STRUCTURAL: validate is not a parameter, it cannot
// influence the output, and there is nothing to vary at runtime.
//
// Test posture (anti-brittleness): assert that load-bearing FACTS survived the
// trip into the string — the learner ask, the seed program, a rendered feature,
// a bound's number, document ordering — via inclusion / absence / index /
// determinism. NEVER assert the whole string, a snapshot, or a builder-authored
// connective.

describe('buildPrompt', () => {
	describe('zero — from-scratch base, empty everything', () => {
		it('carries the learner ask verbatim, wrapped in a scaffold larger than the ask', () => {
			const ask = 'a tip calculator'; // the learner ask (carries the soft theme)
			const prompt = buildPrompt(
				'', // empty program → compose from scratch
				ask,
				{ include: [], exclude: [] }, // resolved full-JEJ subset
				{}, // unbounded
			);

			expect(prompt).toContain(ask);
			// The output is NOT a pass-through of the ask: the prose scaffold
			// (persona + output instruction) adds load-bearing content around it.
			expect(prompt.length).toBeGreaterThan(ask.length);

			// Pure + deterministic: the same inputs always build the same prompt.
			const again = buildPrompt('', ask, { include: [], exclude: [] }, {});
			expect(prompt).toBe(again);
		});

		it('names the target language and requests a fenced JS code block (the output contract)', () => {
			const prompt = buildPrompt(
				'',
				'a tip calculator',
				{ include: [], exclude: [] },
				{},
			);

			// The model must know it is writing JavaScript, and the disposition
			// phase extracts a fenced block — both are structural contracts, not prose.
			expect(prompt).toContain('JavaScript');
			expect(prompt).toContain('```js');
		});
	});

	describe('one — empty vs non-empty program routing', () => {
		it('embeds a non-empty seed program byte-for-byte (tabs and newlines preserved)', () => {
			const seed = 'let total = 0;\n\tif (tip) {\n\t\ttotal += tip;\n\t}\n';

			const prompt = buildPrompt(
				seed,
				'vary this program',
				{ include: [], exclude: [] },
				{},
			);

			// The seed is a SEED, not a constraint — but it must reach the model
			// un-mangled (not reformatted, not escaped), or "vary this" is meaningless.
			expect(prompt).toContain(seed);
		});

		it('routes empty vs non-empty program differently on the same ask (compose vs vary)', () => {
			const ask = 'a number guessing game';

			const compose = buildPrompt('', ask, { include: [], exclude: [] }, {});
			const vary = buildPrompt(
				'let n = 7;\n',
				ask,
				{ include: [], exclude: [] },
				{},
			);

			// The fork exists and is driven only by the program: the varied prompt
			// carries its seed, the from-scratch one differs AND fabricates no
			// phantom seed (the negative is the load-bearing half of the fork).
			expect(compose).not.toBe(vary);
			expect(vary).toContain('let n = 7;');
			expect(compose).not.toContain('let n = 7;');
		});
	});

	describe('one — feature subset: the include/exclude rendering policy', () => {
		it('empty include and empty exclude render no feature clause — and never dump all of JEJ', () => {
			const prompt = buildPrompt(
				'',
				'anything',
				{ include: [], exclude: [] },
				{},
			);

			// A full-JEJ request has no allow-list and no forbidden-list, and
			// crucially does not enumerate all 19 features.
			expect(prompt.length).toBeGreaterThan(0); // a real prompt, not vacuous
			expect(prompt).not.toContain('bitwise operators');
			expect(prompt).not.toContain('BigInt');
			expect(prompt).not.toContain('optional chaining');
		});

		it('a non-empty include surfaces only its members as an allow-list', () => {
			const prompt = buildPrompt(
				'',
				'loops only',
				{ include: ['while', 'for'], exclude: [] },
				{},
			);

			expect(prompt).toContain('while-loops');
			expect(prompt).toContain('for-loops');
			// a feature NOT in include must not appear
			expect(prompt).not.toContain('the ternary');
			expect(prompt).not.toContain('bitwise operators');
		});

		it('exclude removes a feature from the allow-list (exclude wins on overlap)', () => {
			const prompt = buildPrompt(
				'',
				'x',
				{ include: ['if', 'while'], exclude: ['while'] },
				{},
			);

			expect(prompt).toContain('if-statements');
			expect(prompt).not.toContain('while-loops'); // excluded despite being included
		});

		it('empty include with a non-empty exclude renders a forbidden-list, not an allow-list of 18', () => {
			const prompt = buildPrompt(
				'',
				'x',
				{ include: [], exclude: ['bitwise', 'regex', 'in'] },
				{},
			);

			// A forbidden-list frames the restriction against ordinary JS so the
			// model is not left guessing what it MAY use (it is not over-restricted).
			expect(prompt.toLowerCase()).toContain('do not use');
			expect(prompt).toContain('bitwise operators (& | ^ ~ << >> >>>)');
			expect(prompt).toContain('regular expressions (/.../)');
			// `in` renders as its full phrase, never the bare substring (which is
			// a substring of `continue`, `increment`, etc.).
			expect(prompt).toContain('the in operator');
			// it must NOT enumerate the still-permitted features
			expect(prompt).not.toContain('if-statements');
			expect(prompt).not.toContain('while-loops');
		});

		it('a degenerate empty permitted set (include minus exclude is empty) falls back to a simple-only instruction', () => {
			const prompt = buildPrompt(
				'',
				'x',
				{ include: ['if'], exclude: ['if'] },
				{},
			);

			expect(prompt).toContain('simple statements');
			expect(prompt).not.toContain('if-statements'); // not in the (empty) allow-list
		});
	});

	describe('boundary — size bounds', () => {
		it('a lines bound surfaces its number and no nesting clause', () => {
			const prompt = buildPrompt(
				'',
				'x',
				{ include: [], exclude: [] },
				{
					lines: 37,
				},
			);

			expect(prompt).toContain('37');
			expect(prompt.toLowerCase()).not.toContain('nest'); // no complexity clause
		});

		it('a complexity bound surfaces its number as a nesting limit', () => {
			const prompt = buildPrompt(
				'',
				'x',
				{ include: [], exclude: [] },
				{
					complexity: 29,
				},
			);

			expect(prompt).toContain('29');
			expect(prompt.toLowerCase()).toContain('nest');
		});

		it('an absent bound contributes no clause and no stray number', () => {
			const prompt = buildPrompt('', 'x', { include: [], exclude: [] }, {});

			expect(prompt.length).toBeGreaterThan(0); // a real prompt, not vacuous
			expect(prompt).not.toContain('37');
			expect(prompt).not.toContain('29');
			expect(prompt.toLowerCase()).not.toContain('at most');
			expect(prompt.toLowerCase()).not.toContain('nest');
		});

		it('lines and complexity are independent dimensions', () => {
			const linesOnly = buildPrompt(
				'',
				'x',
				{ include: [], exclude: [] },
				{
					lines: 37,
				},
			);
			const complexityOnly = buildPrompt(
				'',
				'x',
				{ include: [], exclude: [] },
				{ complexity: 29 },
			);

			expect(linesOnly).toContain('37');
			expect(linesOnly).not.toContain('29');
			expect(complexityOnly).toContain('29');
			expect(complexityOnly).not.toContain('37');
		});
	});

	describe('rendering — the ratified FeatureName → learner-phrasing map (C2)', () => {
		// The single place the C2-ratified rendering literal is pinned (a
		// regression guard for a pedagogically load-bearing contract). Every other
		// feature test asserts structure, so wording polish lands only here.
		const RENDERINGS: ReadonlyArray<readonly [FeatureName, string]> = [
			['if', 'if-statements'],
			['while', 'while-loops'],
			['do-while', 'do...while loops'],
			['for', 'for-loops'],
			['for-of', 'for...of loops'],
			['break', 'break (keyword)'],
			['continue', 'continue (keyword)'],
			['ternary', 'the ternary ? :'],
			['short-circuit', '&& / || / ?? (short-circuit)'],
			['optional-chaining', 'optional chaining ?.'],
			['typeof', 'typeof'],
			['in', 'the in operator'],
			['increment', '++ / -- (increment/decrement)'],
			['bitwise', 'bitwise operators (& | ^ ~ << >> >>>)'],
			['compound-assignment', 'compound assignment (+= -= ...)'],
			['template-literal', 'template literals (`...`)'],
			['regex', 'regular expressions (/.../)'],
			['bigint', 'BigInt (1n)'],
			['new-date', 'new Date()'],
		];

		it.each(RENDERINGS)(
			'renders %s as its ratified learner phrasing',
			(feature, phrasing) => {
				const prompt = buildPrompt(
					'',
					'x',
					{ include: [feature], exclude: [] },
					{},
				);

				expect(prompt).toContain(phrasing);
			},
		);
	});

	describe('many — a full request: every fact coexists, seed before constraints', () => {
		it('embeds ask, seed, features and bounds together, seed ahead of the requirements', () => {
			const seed = 'let price = 3;\n';

			const prompt = buildPrompt(
				seed,
				'a coffee shop',
				{ include: ['if', 'ternary'], exclude: ['for-of'] },
				{ lines: 20, complexity: 2 },
			);

			expect(prompt).toContain('a coffee shop');
			expect(prompt).toContain(seed);
			expect(prompt).toContain('if-statements');
			expect(prompt).toContain('the ternary ? :');
			expect(prompt).toContain('20');
			expect(prompt.toLowerCase()).toContain('nest'); // complexity coexists with lines

			// Document order is load-bearing: persona → seed → requirements →
			// output instruction. The first `JavaScript` mention is the persona
			// line (before the seed); the `` ```js `` block-format instruction is
			// last (after the requirements). The seed is fenced with a bare ``` so
			// `` ```js `` is unique to the output instruction.
			expect(prompt.indexOf('JavaScript')).toBeLessThan(prompt.indexOf(seed));
			expect(prompt.indexOf(seed)).toBeLessThan(
				prompt.indexOf('if-statements'),
			);
			expect(prompt.indexOf('```js')).toBeGreaterThan(
				prompt.indexOf('if-statements'),
			);
		});
	});

	describe('interface — purity', () => {
		it('is idempotent for a fully-specified request', () => {
			const build = (): string =>
				buildPrompt(
					'let x = 1;\n',
					'theme',
					{ include: ['if'], exclude: [] },
					{
						lines: 9,
						complexity: 1,
					},
				);

			expect(build()).toBe(build());
		});
	});

	describe('exceptions — an empty prompt AND empty program is valid, not an error', () => {
		it('builds a deterministic non-empty prompt when program AND prompt are both empty', () => {
			const a = buildPrompt('', '', { include: [], exclude: [] }, {});
			const b = buildPrompt('', '', { include: [], exclude: [] }, {});

			expect(a.length).toBeGreaterThan(0);
			expect(a).toBe(b); // pure + deterministic
			expect(a).toContain('```js'); // the output contract survives an empty ask
		});
	});
});
