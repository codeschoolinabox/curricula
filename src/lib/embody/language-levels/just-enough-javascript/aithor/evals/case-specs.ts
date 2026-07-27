import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { CaseSpec } from './types.js';

/**
 * A small while-loop seed — feature inventory `['while']`, 5 lines, nesting
 * depth 1. Seeds the seeded quadrants and the both-hard-holds vary case.
 */
const COUNTDOWN_SEED = `let count = 5;
while (count > 0) {
	console.log(count);
	count = count - 1;
}`;

/**
 * A plain-statements seed — EMPTY feature inventory, so a held `languageLevel`
 * resolves to the exclude-all "simple statements only" idiom (`resolveVary`).
 */
const GREETING_SEED = `let greeting = 'hello';
let name = 'sam';
console.log(greeting + ', ' + name);`;

// Named once: four of the ten cases share this quadrant (lint: no-duplicate-string).
const CURATED_SEEDED = 'curated-seeded';

/**
 * The hand-authored request corpus the harness samples — the eval's fixed
 * input, per [`./README.md`](./README.md) § Sample protocol.
 *
 * @remarks
 * - **The grid.** The four {@link Quadrant}s (`config.validate` ×
 *   empty-`program`), each in a **tight** base case (small `include`, low
 *   `lines`/`complexity` — where attempt-bound load shows) and a **loose** base
 *   case (no constraint fields = full JEJ, unbounded) → 8 base cases, the top
 *   of the protocol's ~6–8 range.
 * - **The unsatisfiable pin.** Exactly one tight curated case is
 *   `expectedSatisfiable: false` — the classic "sum a list with no loops"
 *   rendered in `include`/`lines` terms (unbounded repetition with no loop
 *   feature permitted and no room to unroll) — so the report can separate
 *   "refused something satisfiable" (a signal) from "refused the unsatisfiable"
 *   (a contract pass). `expectedSatisfiable` is an unverified author assertion.
 * - **Vary cases.** Two curated-seeded cases request the next Variation through
 *   `vary` (hard holds only — the enforced tier; the soft tier is never
 *   measured): both hard aspects held over the while-loop seed, and
 *   `languageLevel` alone over the empty-inventory beginner seed. A `vary`
 *   declaring an aspect is mutually exclusive with raw
 *   `include`/`exclude`/`lines`/`complexity` (`assertVaryExclusive` throws), so
 *   these cases carry none, and each hard hold rides a non-empty, parseable
 *   seed (`resolveVary`'s precondition).
 * - **The fixture invariant.** `quadrant` is a derived label the core trusts,
 *   never re-derives ([`./DOCS.md`](./DOCS.md)) — every entry here keeps it
 *   consistent with its `config.validate` × empty-`program`, and `validate` is
 *   set explicitly on every config so the derivation reads literally.
 * - **Models.** `model: ''` is the runtime's cost-aware default pick; exactly
 *   one case picks explicitly, naming the proven catalog id from
 *   [`../tests/aithor-webllm.browser.test.ts`](../tests/aithor-webllm.browser.test.ts).
 * - Prompts are short learner-authored asks; the eval never measures theme.
 *   `SAMPLES_PER_CASE` is the driver's constant, not the corpus's.
 */
const CASE_SPECS: readonly CaseSpec[] = deepFreezeInPlace([
	{
		id: 'uncurated-scratch-tight',
		quadrant: 'uncurated-scratch',
		program: '',
		config: {
			prompt: 'count down from 5 and print each number',
			model: '',
			include: ['while'],
			lines: 8,
			complexity: 2,
			validate: false,
		},
		expectedSatisfiable: true,
	},
	{
		id: 'uncurated-scratch-loose',
		quadrant: 'uncurated-scratch',
		program: '',
		config: {
			prompt: 'make a program that greets three friends by name',
			model: '',
			validate: false,
		},
		expectedSatisfiable: true,
	},
	{
		id: 'uncurated-seeded-tight',
		quadrant: 'uncurated-seeded',
		program: COUNTDOWN_SEED,
		config: {
			prompt: 'change it to count up to 10 instead',
			model: '',
			include: ['while'],
			lines: 8,
			complexity: 2,
			validate: false,
		},
		expectedSatisfiable: true,
	},
	{
		id: 'uncurated-seeded-loose',
		quadrant: 'uncurated-seeded',
		program: GREETING_SEED,
		config: {
			prompt: 'add a compliment after the greeting',
			model: '',
			validate: false,
		},
		expectedSatisfiable: true,
	},
	{
		id: 'curated-scratch-tight-unsatisfiable',
		quadrant: 'curated-scratch',
		program: '',
		config: {
			prompt:
				'keep asking for numbers until the user types stop, then print the total',
			model: '',
			include: ['if'],
			lines: 4,
			validate: true,
		},
		expectedSatisfiable: false,
	},
	{
		id: 'curated-scratch-loose',
		quadrant: 'curated-scratch',
		program: '',
		config: {
			prompt: 'write a short program that prints a message three times',
			model: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
			validate: true,
		},
		expectedSatisfiable: true,
	},
	{
		id: 'curated-seeded-tight',
		quadrant: CURATED_SEEDED,
		program: COUNTDOWN_SEED,
		config: {
			prompt: 'make it count down from 10 instead',
			model: '',
			include: ['while'],
			lines: 8,
			complexity: 2,
			validate: true,
		},
		expectedSatisfiable: true,
	},
	{
		id: 'curated-seeded-loose',
		quadrant: CURATED_SEEDED,
		program: GREETING_SEED,
		config: {
			prompt: 'add a compliment after the greeting',
			model: '',
			validate: true,
		},
		expectedSatisfiable: true,
	},
	{
		id: 'vary-hold-level-and-size',
		quadrant: CURATED_SEEDED,
		program: COUNTDOWN_SEED,
		config: {
			prompt: 'make another program just like this one',
			model: '',
			validate: true,
			vary: { languageLevel: false, size: false },
		},
		expectedSatisfiable: true,
	},
	{
		id: 'vary-hold-level-beginner-seed',
		quadrant: CURATED_SEEDED,
		program: GREETING_SEED,
		config: {
			prompt: 'make a different program at this level',
			model: '',
			validate: true,
			vary: { languageLevel: false },
		},
		expectedSatisfiable: true,
	},
]);

export default CASE_SPECS;
