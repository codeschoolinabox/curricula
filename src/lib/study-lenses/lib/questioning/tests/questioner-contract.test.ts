import { describe, expect, it } from 'vitest';

import type { Embodiment, Facts } from '../../../embody/types.js';
import type { Questioner, QuestionerRefusal } from '../types.js';

const refusal: QuestionerRefusal = {
	ok: false,
	error: { message: 'unparseable' },
};

const openLike: Questioner<
	{ readonly ok: true; readonly questions: readonly string[] },
	{ readonly count?: number }
> = {
	name: 'open-like',
	serves: (facts: Facts) => facts.ast.ok,
	ask: () => refusal,
};

const closedLike: Questioner<{
	readonly ok: true;
	readonly items: readonly number[];
}> = {
	name: 'closed-like',
	serves: (facts: Facts) => facts.tokens.ok,
	ask: () => refusal,
};

const roster: ReadonlyArray<Questioner> = [openLike, closedLike];

function askBare(
	questioner: Questioner,
	embodiment: Embodiment,
): ReturnType<Questioner['ask']> {
	return questioner.ask(embodiment);
}

describe('Questioner envelope', () => {
	it('holds a heterogeneous roster under the bare name', () => {
		expect(roster).toHaveLength(2);
	});

	it('drives a bare roster member without config', () => {
		expect(typeof askBare).toBe('function');
	});

	it('narrows a refusal by its ok discriminant', () => {
		expect(refusal.ok).toBe(false);
	});

	it('narrows a bare-roster answer to the refusal arm without a guard', () => {
		const answer: ReturnType<Questioner['ask']> = refusal;
		expect(answer.ok === false ? answer.error.message : '').toBe('unparseable');
	});
});
