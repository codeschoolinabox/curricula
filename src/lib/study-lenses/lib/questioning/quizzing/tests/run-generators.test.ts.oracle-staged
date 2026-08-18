// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/run-generators.test.ts
// @ blob 85fc23f19543eaa33d7c1f460bbdc6671fdd5eb8
// rewires: embody-facts fixtures, classifying depth, classify-from-facts
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import buildContext from '../context/build-context.js';
import type { GenerationContext } from '../context/types.js';
import type { Generator } from '../generators/types.js';
import runGenerators from '../run-generators.js';
import type { QuizItem } from '../types.js';

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

function contextOf(code: string): GenerationContext {
	const facts = embody(code).facts;
	return buildContext(facts, classifyOf(facts));
}

function stubItem(id: string): QuizItem {
	return {
		mode: 'mcq',
		id,
		family: 'variables',
		form: 'TEST',
		anchorRange: [0, 0],
		cells: [],
		prompt: '',
		options: [],
		answerOptionIds: [],
		groupKey: '',
		feedback: '',
	};
}

function idsOf(items: readonly QuizItem[]): readonly string[] {
	return items.map((item) => item.id);
}

const tokenGenerator: Generator = {
	anchorType: 'token',
	build: (token) => [stubItem(`t${token.start}`)],
};

const nodeGenerator: Generator = {
	anchorType: 'node',
	build: (anchor) => [stubItem(`n${anchor.range[0]}`)],
};

const programGenerator: Generator = {
	anchorType: 'program',
	build: () => [stubItem('p')],
};

const readsOnlyGenerator: Generator = {
	anchorType: 'node',
	build: (anchor) => (anchor.usageKind === 'read' ? [stubItem('r')] : []),
};

const secondNodeGenerator: Generator = {
	anchorType: 'node',
	build: (anchor) => [stubItem(`N${anchor.range[0]}`)],
};

const doubleNodeGenerator: Generator = {
	anchorType: 'node',
	build: (anchor) => [
		stubItem(`na${anchor.range[0]}`),
		stubItem(`nb${anchor.range[0]}`),
	],
};

const contextReadingGenerator: Generator = {
	anchorType: 'node',
	build: (_anchor, context) => [
		stubItem(`k${context.identifierAnchors.length}`),
	],
};

describe('runGenerators', () => {
	describe('Zero', () => {
		it('returns no items for an empty registry', () => {
			expect(runGenerators(contextOf('let x = 1;'), [])).toEqual([]);
		});

		it('returns no items when a token generator has no tokens', () => {
			expect(runGenerators(contextOf(''), [tokenGenerator])).toEqual([]);
		});
	});

	describe('One', () => {
		it('fires a node generator once per identifier anchor', () => {
			expect(
				idsOf(runGenerators(contextOf('let x = 1; x;'), [nodeGenerator])),
			).toEqual(['n4', 'n11']);
		});

		it('fires a token generator once per classified token', () => {
			const context = contextOf('let x = 1; x;');
			expect(idsOf(runGenerators(context, [tokenGenerator]))).toEqual(
				context.classified.map((token) => `t${token.start}`),
			);
		});

		it('fires a program generator exactly once', () => {
			expect(
				idsOf(runGenerators(contextOf('let x = 1; x;'), [programGenerator])),
			).toEqual(['p']);
		});
	});

	describe('Many', () => {
		it('concatenates generators in registry order, then stream order', () => {
			expect(
				idsOf(
					runGenerators(contextOf('let x = 1; x;'), [
						programGenerator,
						nodeGenerator,
					]),
				),
			).toEqual(['p', 'n4', 'n11']);
		});

		it('respects the reverse registry order', () => {
			expect(
				idsOf(
					runGenerators(contextOf('let x = 1; x;'), [
						nodeGenerator,
						programGenerator,
					]),
				),
			).toEqual(['n4', 'n11', 'p']);
		});

		it('fires two generators of the same anchor type independently', () => {
			expect(
				idsOf(
					runGenerators(contextOf('let x = 1; x;'), [
						nodeGenerator,
						secondNodeGenerator,
					]),
				),
			).toEqual(['n4', 'n11', 'N4', 'N11']);
		});

		it('flat-collects a generator that emits multiple items per anchor', () => {
			expect(
				idsOf(runGenerators(contextOf('let x = 1; x;'), [doubleNodeGenerator])),
			).toEqual(['na4', 'nb4', 'na11', 'nb11']);
		});
	});

	describe('Boundaries', () => {
		it('is selective — a generator may emit zero items for some stream items', () => {
			expect(
				idsOf(runGenerators(contextOf('let x = 1; x;'), [readsOnlyGenerator])),
			).toEqual(['r']);
		});
	});

	describe('Interfaces', () => {
		it('forwards the generation context to each build call', () => {
			expect(
				idsOf(
					runGenerators(contextOf('let x = 1; x;'), [contextReadingGenerator]),
				),
			).toEqual(['k2', 'k2']);
		});
	});

	describe('Simple', () => {
		it('is deterministic across repeated runs', () => {
			const context = contextOf('let x = 1; x;');
			expect(runGenerators(context, [tokenGenerator, nodeGenerator])).toEqual(
				runGenerators(context, [tokenGenerator, nodeGenerator]),
			);
		});
	});
});
