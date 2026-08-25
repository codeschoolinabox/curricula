// cspell:ignore socratizing

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Embodiment, Facts } from '../../../embody/types.js';
import quizzingQuestioner from '../quizzing/quizzing-questioner.js';
import socratizingQuestioner from '../socratizing/socratizing-questioner.js';
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

const asyncLike: Questioner<{
	readonly ok: true;
	readonly traces: readonly string[];
}> = {
	name: 'async-like',
	serves: (facts: Facts) => facts.ast.ok,
	ask: () => Promise.resolve(refusal),
};

const roster: ReadonlyArray<Questioner> = [
	openLike,
	closedLike,
	asyncLike,
	socratizingQuestioner,
	quizzingQuestioner,
];

function askBare(
	questioner: Questioner,
	embodiment: Embodiment,
): ReturnType<Questioner['ask']> {
	return questioner.ask(embodiment);
}

async function askSettled(
	questioner: Questioner,
	embodiment: Embodiment,
): Promise<Awaited<ReturnType<Questioner['ask']>>> {
	return questioner.ask(embodiment);
}

describe('Questioner envelope', () => {
	it('holds a heterogeneous roster under the bare name', () => {
		expect(roster).toHaveLength(5);
	});

	it('settles a real roster member to a narrowable answer', async () => {
		const answer = await askSettled(roster[4], embody('let x = 1;'));
		expect(answer.ok).toBe(true);
	});

	it('drives a bare roster member without config', () => {
		expect(typeof askBare).toBe('function');
	});

	it('drives a promise-answering member to a settled answer', () => {
		expect(typeof askSettled).toBe('function');
	});

	it('narrows a refusal by its ok discriminant', () => {
		expect(refusal.ok).toBe(false);
	});

	it('narrows a settled bare-roster answer to the refusal arm without a guard', () => {
		const answer: Awaited<ReturnType<Questioner['ask']>> = refusal;
		expect(answer.ok === false ? answer.error.message : '').toBe('unparseable');
	});

	it('rejects narrowing an un-awaited answer', () => {
		const pending: ReturnType<Questioner['ask']> = Promise.resolve(refusal);
		expect(
			// @ts-expect-error -- an un-awaited ask answer keeps its promise arm, which has no `ok`; narrowing requires the await (async-widening pin, human ruling 2026-08-18)
			pending.ok === undefined,
		).toBe(true);
	});
});
