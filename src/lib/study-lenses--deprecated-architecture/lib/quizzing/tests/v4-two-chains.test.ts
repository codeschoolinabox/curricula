import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v4TwoChains from '../generators/v4-two-chains.js';
import runGenerators from '../run-generators.js';
import type { McqQuizItem, QuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

function v4RawItemsOf(code: string): readonly QuizItem[] {
	const snippet = embody(code);
	return runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v4TwoChains,
	]);
}

function v4ItemsOf(code: string): readonly McqQuizItem[] {
	return v4RawItemsOf(code).filter(
		(item): item is McqQuizItem => item.mode === 'mcq',
	);
}

describe('v4TwoChains', () => {
	describe('Zero', () => {
		it('emits nothing for a literal-only snippet', () => {
			expect(v4ItemsOf('1 + 2;')).toEqual([]);
		});

		it('emits nothing for an empty snippet', () => {
			expect(v4ItemsOf('')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one scope-chain item for a lone reference', () => {
			const items = v4ItemsOf('x;');
			expect(items).toHaveLength(1);
			expect(items[0]?.answerOptionIds).toEqual(['scope-chain']);
			expect(items[0]?.groupKey).toBe('chain:scope-chain:x');
			expect(items[0]?.id).toBe('V4@0-1');
			expect(items[0]?.anchorRange).toEqual([0, 1]);
		});
	});

	describe('Many — the two chains', () => {
		it('gives the object a scope-chain item and the property a prototype-chain item', () => {
			// The non-vacuity contrast: `Math` resolves via the scope chain, `max` via
			// the prototype chain — a program build that read only one stream would miss
			// one of these.
			const items = v4ItemsOf('Math.max;');
			expect(items).toHaveLength(2);
			expect(items[0]?.answerOptionIds).toEqual(['scope-chain']);
			expect(items[0]?.groupKey).toBe('chain:scope-chain:Math');
			expect(items[0]?.anchorRange).toEqual([0, 4]);
			expect(items[1]?.answerOptionIds).toEqual(['prototype-chain']);
			expect(items[1]?.groupKey).toBe('chain:prototype-chain:max');
			// the prototype-chain item anchors the PROPERTY span (`max`), not the
			// whole member expression — the reason propertyAnchorOf exists.
			expect(items[1]?.anchorRange).toEqual([5, 8]);
		});

		it('fires on every identifier occurrence including the declaration site', () => {
			const items = v4ItemsOf('let x = 1; x;');
			expect(items.map((item) => item.answerOptionIds)).toEqual([
				['scope-chain'],
				['scope-chain'],
			]);
			expect(items.map((item) => item.groupKey)).toEqual([
				'chain:scope-chain:x',
				'chain:scope-chain:x',
			]);
			expect(items.map((item) => item.id)).toEqual(['V4@4-5', 'V4@11-12']);
		});

		it('emits all scope-chain items before all prototype-chain items (stream order, not source position)', () => {
			// stream-first: identifierAnchors (o, y) then propertyAccessAnchors (x) —
			// deliberately NOT source-position order, which would interleave x between
			// o and y. A source-position impl fails this pin.
			expect(v4ItemsOf('o.x; y;').map((item) => item.groupKey)).toEqual([
				'chain:scope-chain:o',
				'chain:scope-chain:y',
				'chain:prototype-chain:x',
			]);
		});

		it('keys two shadowing bindings of one name into the same group (binding-agnostic)', () => {
			// V4 keys by name-in-role, not by binding (unlike V7): both `x` bindings
			// resolve via the scope chain, so all three occurrences share one group.
			const keys = v4ItemsOf('let x = 1; { let x = 2; x; }').map(
				(item) => item.groupKey,
			);
			expect(keys).toEqual([
				'chain:scope-chain:x',
				'chain:scope-chain:x',
				'chain:scope-chain:x',
			]);
		});
	});

	describe('Boundaries', () => {
		it('gives a property access a scope-chain object and a prototype-chain property', () => {
			expect(v4ItemsOf('str.length;').map((item) => item.groupKey)).toEqual([
				'chain:scope-chain:str',
				'chain:prototype-chain:length',
			]);
		});

		it('treats a computed member as two scope-chain references, no prototype-chain', () => {
			const items = v4ItemsOf('o[k];');
			expect(items.map((item) => item.answerOptionIds)).toEqual([
				['scope-chain'],
				['scope-chain'],
			]);
			expect(items.map((item) => item.groupKey)).toEqual([
				'chain:scope-chain:o',
				'chain:scope-chain:k',
			]);
		});

		it('emits one prototype-chain item per property access', () => {
			expect(
				v4ItemsOf('o.x; p.y;').filter(
					(item) => item.answerOptionIds[0] === 'prototype-chain',
				),
			).toHaveLength(2);
		});

		it('emits no prototype-chain item for a non-computed object-literal key', () => {
			const items = v4ItemsOf('let p = { x: 1 };');
			// `p` is a scope-chain item; the key `x` enters neither stream, so there is
			// no prototype-chain:x item.
			expect(items.map((item) => item.groupKey)).toEqual([
				'chain:scope-chain:p',
			]);
		});
	});

	describe('Interfaces', () => {
		it('emits only mcq items', () => {
			const items = v4RawItemsOf('Math.max;');
			expect(items).toHaveLength(2);
			expect(items.every((item) => item.mode === 'mcq')).toBe(true);
		});

		it('offers exactly the two chain options', () => {
			const item = v4ItemsOf('x;')[0];
			expect(item).toBeDefined();
			expect(item?.options.map((option) => option.id)).toEqual([
				'scope-chain',
				'prototype-chain',
			]);
		});

		it('freezes the shared option pool', () => {
			const item = v4ItemsOf('x;')[0];
			expect(item).toBeDefined();
			expect(Object.isFrozen(item?.options)).toBe(true);
		});

		it('carries execution × atom cells and the variables family', () => {
			const item = v4ItemsOf('x;')[0];
			expect(item).toBeDefined();
			expect(item?.cells).toEqual([{ dimension: 'execution', level: 'atom' }]);
			expect(item?.family).toBe('variables');
		});

		it('carries non-empty feedback for both chains', () => {
			const scopeItem = v4ItemsOf('x;')[0];
			expect(scopeItem?.feedback).toBeDefined();
			expect((scopeItem?.feedback ?? '').length).toBeGreaterThan(0);
			const prototypeItem = v4ItemsOf('Math.max;')[1];
			expect(prototypeItem?.feedback).toBeDefined();
			expect((prototypeItem?.feedback ?? '').length).toBeGreaterThan(0);
		});

		it('omits anchorPath and unlocks', () => {
			const item = v4ItemsOf('x;')[0];
			expect(item).toBeDefined();
			expect(item).not.toHaveProperty('anchorPath');
			expect(item).not.toHaveProperty('unlocks');
		});

		it('gives each occurrence a unique id', () => {
			const ids = v4ItemsOf('Math.max;').map((item) => item.id);
			expect(ids).toHaveLength(2);
			expect(new Set(ids).size).toBe(ids.length);
		});
	});

	describe('Simple', () => {
		it('is deterministic for the same snippet', () => {
			expect(v4ItemsOf('Math.max; let y = 1; y;')).toEqual(
				v4ItemsOf('Math.max; let y = 1; y;'),
			);
		});
	});
});
