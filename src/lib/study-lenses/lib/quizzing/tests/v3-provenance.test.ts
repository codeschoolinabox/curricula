import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v3Provenance from '../generators/v3-provenance.js';
import runGenerators from '../run-generators.js';
import type { McqQuizItem, QuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

/** All V3 items (unfiltered) — for the mode-integrity pin. */
function v3RawItemsOf(code: string): readonly QuizItem[] {
	const snippet = embody(code);
	return runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v3Provenance,
	]);
}

/** V3 items narrowed to mcq — for the answer / group / shape pins. */
function v3ItemsOf(code: string): readonly McqQuizItem[] {
	return v3RawItemsOf(code).filter(
		(item): item is McqQuizItem => item.mode === 'mcq',
	);
}

describe('v3Provenance', () => {
	describe('Zero', () => {
		it('emits nothing for an empty snippet', () => {
			expect(v3ItemsOf('')).toEqual([]);
		});

		it('emits nothing when there is no identifier', () => {
			expect(v3ItemsOf('1 + 2;')).toEqual([]);
		});

		it('emits nothing for an undeclared non-realm name', () => {
			expect(v3ItemsOf('x;')).toEqual([]);
		});

		it('emits nothing for a prototype name that is not a realm global', () => {
			// the shim guards toString/constructor/… — V3 must not answer for them
			expect(v3ItemsOf('toString;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('answers ECMA-intrinsic for a bare intrinsic global', () => {
			const items = v3ItemsOf('Math;');
			expect(items).toHaveLength(1);
			expect(items[0]?.answerOptionIds).toEqual(['ecma-intrinsic']);
			expect(items[0]?.groupKey).toBe('realm:Math');
			expect(items[0]?.id).toBe('V3@0-4');
			expect(items[0]?.anchorRange).toEqual([0, 4]);
		});

		it('answers program-declared for a program declaration occurrence', () => {
			const items = v3ItemsOf('let x = 1;');
			expect(items).toHaveLength(1);
			expect(items[0]?.answerOptionIds).toEqual(['program-declared']);
			expect(items[0]?.groupKey).toBe('binding:4-5');
		});
	});

	describe('Many', () => {
		it('re-fires per occurrence of one realm global, sharing the realm group', () => {
			const items = v3ItemsOf('Math; Math;');
			expect(items).toHaveLength(2);
			expect(items.map((item) => item.answerOptionIds)).toEqual([
				['ecma-intrinsic'],
				['ecma-intrinsic'],
			]);
			expect(items.every((item) => item.groupKey === 'realm:Math')).toBe(true);
			expect(items.map((item) => item.id)).toEqual(['V3@0-4', 'V3@6-10']);
		});

		it('fires on every occurrence of a declared binding (declaration + references)', () => {
			const items = v3ItemsOf('let x = 1; x; x;');
			expect(items).toHaveLength(3);
			expect(
				items.every(
					(item) =>
						item.answerOptionIds[0] === 'program-declared' &&
						item.groupKey === 'binding:4-5',
				),
			).toBe(true);
		});
	});

	describe('Boundaries', () => {
		it.each(['console', 'alert'])(
			'answers host-provided for the host binding %s',
			(name) => {
				expect(v3ItemsOf(`${name};`)[0]?.answerOptionIds).toEqual([
					'host-provided',
				]);
			},
		);

		it.each(['parseInt', 'Infinity'])(
			'answers ECMA-intrinsic for the intrinsic %s (keys off category, not valueCategory)',
			(name) => {
				expect(v3ItemsOf(`${name};`)[0]?.answerOptionIds).toEqual([
					'ecma-intrinsic',
				]);
			},
		);

		it('resolves a program declaration that shadows a realm name to the binding', () => {
			// `let Math` wins over the realm table — resolveBinding-first precedence
			const items = v3ItemsOf('let Math = 1; Math;');
			expect(items).toHaveLength(2);
			expect(
				items.every(
					(item) =>
						item.answerOptionIds[0] === 'program-declared' &&
						item.groupKey === 'binding:4-8',
				),
			).toBe(true);
		});

		it('re-evaluates provenance per occurrence across nested scopes', () => {
			// `Math` is realm at top level, program-declared inside the block that
			// shadows it, then realm again after the block closes — forces genuine
			// position-aware resolution, not a name-set membership shortcut.
			const items = v3ItemsOf('Math; { let Math = 1; Math; } Math;');
			expect(
				items.map((item) => [item.answerOptionIds[0], item.groupKey]),
			).toEqual([
				['ecma-intrinsic', 'realm:Math'],
				['program-declared', 'binding:12-16'],
				['program-declared', 'binding:12-16'],
				['ecma-intrinsic', 'realm:Math'],
			]);
		});

		it('has no kind guard — fires program-declared on a laundered var binding', () => {
			// unlike V6, V3 keys on bindingGroupKey (range only), so var is fine
			const items = v3ItemsOf('var x = 1; x = 2; x;');
			expect(items).toHaveLength(3);
			expect(
				items.every((item) => item.answerOptionIds[0] === 'program-declared'),
			).toBe(true);
		});

		it('fires on the object of a member access, never the property name', () => {
			// `o.x`'s x is a property access (propertyAccessAnchors), invisible to V3
			const items = v3ItemsOf('let o = {}; o.x;');
			expect(items).toHaveLength(2);
			expect(items.every((item) => item.prompt.includes('`o`'))).toBe(true);
		});

		it('answers only for the receiver of a realm member access', () => {
			const items = v3ItemsOf('Math.max;');
			expect(items).toHaveLength(1);
			expect(items[0]?.groupKey).toBe('realm:Math');
		});

		it('never treats a realm-named property as a realm hit', () => {
			// `Math` here is o's property, not the realm global
			expect(v3ItemsOf('o.Math;')).toEqual([]);
		});

		it('keys a realm occurrence on the realm axis', () => {
			expect(v3ItemsOf('Math;')[0]?.groupKey.startsWith('realm:')).toBe(true);
		});

		it('keys a program-declared occurrence on the binding axis', () => {
			expect(v3ItemsOf('let x = 1;')[0]?.groupKey.startsWith('binding:')).toBe(
				true,
			);
		});
	});

	describe('Interfaces', () => {
		it('emits only mcq items', () => {
			expect(v3RawItemsOf('Math;').every((item) => item.mode === 'mcq')).toBe(
				true,
			);
		});

		it('offers three frozen provenance options in a fixed order', () => {
			const item = v3ItemsOf('Math;')[0];
			expect(item?.options.map((option) => option.id)).toEqual([
				'program-declared',
				'ecma-intrinsic',
				'host-provided',
			]);
			expect(Object.isFrozen(item?.options)).toBe(true);
		});

		it('tags every item execution × atom, V3, variables, with feedback', () => {
			const item = v3ItemsOf('Math;')[0];
			expect(item?.cells).toEqual([{ dimension: 'execution', level: 'atom' }]);
			expect(item?.form).toBe('V3');
			expect(item?.family).toBe('variables');
			expect(item?.feedback.length).toBeGreaterThan(0);
		});

		it('carries no anchorPath and no unlocks', () => {
			const item = v3ItemsOf('Math;')[0];
			expect(item).not.toHaveProperty('anchorPath');
			expect(item).not.toHaveProperty('unlocks');
		});

		it('answers with one of its own option ids', () => {
			const item = v3ItemsOf('console;')[0];
			const optionIds = new Set(item?.options.map((option) => option.id));
			expect(item?.answerOptionIds.every((id) => optionIds.has(id))).toBe(true);
		});
	});

	describe('Simple', () => {
		it('is deterministic', () => {
			expect(v3ItemsOf('Math; let x = 1; x;')).toEqual(
				v3ItemsOf('Math; let x = 1; x;'),
			);
		});
	});
});
