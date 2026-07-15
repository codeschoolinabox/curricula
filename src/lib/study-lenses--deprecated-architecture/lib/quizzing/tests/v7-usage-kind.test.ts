import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v7UsageKind from '../generators/v7-usage-kind.js';
import runGenerators from '../run-generators.js';
import type { McqQuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

function v7ItemsOf(code: string): readonly McqQuizItem[] {
	const snippet = embody(code);
	const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v7UsageKind,
	]);
	return items.filter((item): item is McqQuizItem => item.mode === 'mcq');
}

describe('v7UsageKind', () => {
	describe('Zero', () => {
		it('emits nothing for a snippet with no identifier occurrences', () => {
			expect(v7ItemsOf('1 + 2;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one item per identifier occurrence', () => {
			expect(v7ItemsOf('let x = 1; x;')).toHaveLength(2);
		});

		it('tags every item with the V7 form', () => {
			expect(v7ItemsOf('let x = 1; x;').map((item) => item.form)).toEqual([
				'V7',
				'V7',
			]);
		});

		it('answers a declaration occurrence with declared', () => {
			expect(v7ItemsOf('let x = 1;')[0]?.answerOptionIds).toEqual(['declared']);
		});

		it('answers a reference occurrence with read', () => {
			expect(v7ItemsOf('let x = 1; x;')[1]?.answerOptionIds).toEqual(['read']);
		});
	});

	describe('Many', () => {
		it('emits one item per occurrence across distinct bindings', () => {
			expect(
				v7ItemsOf('let a = 1; let b = 2; a; b;').flatMap(
					(item) => item.answerOptionIds,
				),
			).toEqual(['declared', 'declared', 'read', 'read']);
		});
	});

	describe('Boundaries — usage kinds', () => {
		it('answers a simple assignment target with assigned', () => {
			expect(v7ItemsOf('let x = 1; x = 2;')[1]?.answerOptionIds).toEqual([
				'assigned',
			]);
		});

		it('answers a compound assignment with read-and-assigned', () => {
			expect(v7ItemsOf('let x = 1; x += 2;')[1]?.answerOptionIds).toEqual([
				'read-and-assigned',
			]);
		});

		it('answers an update expression with read-and-assigned', () => {
			expect(v7ItemsOf('let x = 1; x++;')[1]?.answerOptionIds).toEqual([
				'read-and-assigned',
			]);
		});
	});

	describe('Boundaries — the FLAG', () => {
		it('emits exactly one item for a member expression, none for the property name', () => {
			expect(v7ItemsOf('o.x;')).toHaveLength(1);
		});

		it('anchors that one item to the object, not the property name', () => {
			expect(v7ItemsOf('o.x;')[0]?.anchorRange).toEqual([0, 1]);
		});
	});

	describe('Boundaries — propagation re-key', () => {
		it('groups two same-kind occurrences of one binding into one group', () => {
			expect(
				v7ItemsOf('let x = 1; x; x;').map((item) => item.groupKey),
			).toEqual(['usage:4-5:declared', 'usage:4-5:read', 'usage:4-5:read']);
		});

		it('keys an assignment-target occurrence on its use-type', () => {
			expect(v7ItemsOf('let x = 1; x = 2;')[1]?.groupKey).toBe(
				'usage:4-5:assigned',
			);
		});

		it('keys a read-and-assigned occurrence on its use-type', () => {
			expect(v7ItemsOf('let x = 1; x += 2;')[1]?.groupKey).toBe(
				'usage:4-5:read-and-assigned',
			);
		});

		it('keys two shadowing bindings of one name into distinct binding groups', () => {
			expect(
				v7ItemsOf('let x = 1; { let x = 2; x; }').map((item) => item.groupKey),
			).toEqual([
				'usage:4-5:declared',
				'usage:17-18:declared',
				'usage:17-18:read',
			]);
		});

		it('keys a var binding like any other tracked binding', () => {
			expect(v7ItemsOf('var v = 1; v;').map((item) => item.groupKey)).toEqual([
				'usage:4-5:declared',
				'usage:4-5:read',
			]);
		});

		it('falls back to a per-occurrence group-of-one for a free global', () => {
			expect(v7ItemsOf('x;')[0]?.groupKey).toBe('usage:occ:0-1');
		});

		it('falls back to a group-of-one for a function name and parameters the scope forest does not track', () => {
			expect(
				v7ItemsOf('function f(p) { p; }').map((item) => item.groupKey),
			).toEqual(['usage:occ:9-10', 'usage:occ:11-12', 'usage:occ:16-17']);
		});

		it('keys resolved and unresolved occurrences in one snippet by their resolution', () => {
			expect(
				v7ItemsOf('function f(p) { let x = 1; x; }').map(
					(item) => item.groupKey,
				),
			).toEqual([
				'usage:occ:9-10',
				'usage:occ:11-12',
				'usage:20-21:declared',
				'usage:20-21:read',
			]);
		});
	});

	describe('Interfaces', () => {
		it('emits only mcq items', () => {
			const snippet = embody('let x = 1; x;');
			const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
				v7UsageKind,
			]);
			expect(items.every((item) => item.mode === 'mcq')).toBe(true);
		});

		it('anchors the item to the occurrence range', () => {
			expect(v7ItemsOf('let x = 1;')[0]?.anchorRange).toEqual([4, 5]);
		});

		it('places the item on the text-surface relation cell', () => {
			expect(v7ItemsOf('let x = 1;')[0]?.cells).toEqual([
				{ dimension: 'text-surface', level: 'relation' },
			]);
		});

		it('keys the propagation group on binding × use-type', () => {
			expect(v7ItemsOf('let x = 1;')[0]?.groupKey).toBe('usage:4-5:declared');
		});

		it('keys one binding used two ways into distinct groups sharing the binding', () => {
			expect(v7ItemsOf('let x = 1; x;').map((item) => item.groupKey)).toEqual([
				'usage:4-5:declared',
				'usage:4-5:read',
			]);
		});

		it('ids the item as V7 at the occurrence range', () => {
			expect(v7ItemsOf('let x = 1;')[0]?.id).toBe('V7@4-5');
		});

		it('sets the family to variables', () => {
			expect(v7ItemsOf('let x = 1;')[0]?.family).toBe('variables');
		});

		it('offers the four usage kinds as options in order', () => {
			expect(
				v7ItemsOf('let x = 1;')[0]?.options.map((option) => option.id),
			).toEqual(['declared', 'read', 'assigned', 'read-and-assigned']);
		});

		it('labels every option with non-empty text', () => {
			const options = v7ItemsOf('let x = 1;')[0]?.options;
			expect(options?.every((option) => option.text.length > 0)).toBe(true);
		});

		it('carries non-empty feedback', () => {
			const feedback = v7ItemsOf('let x = 1;')[0]?.feedback;
			expect(feedback?.length ?? 0).toBeGreaterThan(0);
		});

		it('omits anchorPath this increment', () => {
			expect(v7ItemsOf('let x = 1;')[0]).not.toHaveProperty('anchorPath');
		});

		it('omits unlocks', () => {
			expect(v7ItemsOf('let x = 1;')[0]).not.toHaveProperty('unlocks');
		});

		it('prompts for how the variable is used', () => {
			expect(v7ItemsOf('let x = 1;')[0]?.prompt).toBe(
				'How is this variable used here?',
			);
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(v7ItemsOf('let x = 1; x;')).toEqual(v7ItemsOf('let x = 1; x;'));
		});
	});
});
