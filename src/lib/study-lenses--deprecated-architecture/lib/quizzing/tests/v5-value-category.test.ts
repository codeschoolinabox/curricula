import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v5ValueCategory from '../generators/v5-value-category.js';
import runGenerators from '../run-generators.js';
import type { McqQuizItem, QuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

/** All V5 items (unfiltered) — for the mode-integrity pin. */
function v5RawItemsOf(code: string): readonly QuizItem[] {
	const snippet = embody(code);
	return runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v5ValueCategory,
	]);
}

/** V5 items narrowed to mcq — for the answer / group / shape pins. */
function v5ItemsOf(code: string): readonly McqQuizItem[] {
	return v5RawItemsOf(code).filter(
		(item): item is McqQuizItem => item.mode === 'mcq',
	);
}

describe('v5ValueCategory', () => {
	describe('Zero', () => {
		it('emits nothing for an empty snippet', () => {
			expect(v5ItemsOf('')).toEqual([]);
		});

		it('emits nothing for an undeclared non-realm name', () => {
			expect(v5ItemsOf('x;')).toEqual([]);
		});

		it('emits nothing for a program-declared name (resolveBinding hits)', () => {
			expect(v5ItemsOf('let x = 1; x;')).toEqual([]);
		});

		it('emits nothing for a realm name shadowed by a program binding', () => {
			// `let Math` makes resolveBinding succeed → V5 silent, only V3 fires
			expect(v5ItemsOf('let Math = 1; Math;')).toEqual([]);
		});

		it('emits nothing for a prototype name that is not a realm global', () => {
			expect(v5ItemsOf('toString;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('answers object-register for a bare object-register global', () => {
			const items = v5ItemsOf('Math;');
			expect(items).toHaveLength(1);
			expect(items[0]?.answerOptionIds).toEqual(['object-register']);
			expect(items[0]?.groupKey).toBe('realm:Math');
			expect(items[0]?.id).toBe('V5@0-4');
			expect(items[0]?.anchorRange).toEqual([0, 4]);
		});
	});

	describe('Many', () => {
		it('re-fires per occurrence of one realm global, sharing the realm group', () => {
			const items = v5ItemsOf('Math; Math;');
			expect(items).toHaveLength(2);
			expect(items.every((item) => item.groupKey === 'realm:Math')).toBe(true);
			expect(items.map((item) => item.id)).toEqual(['V5@0-4', 'V5@6-10']);
		});
	});

	describe('Boundaries', () => {
		it.each([
			['Math', 'object-register'],
			['console', 'object-register'],
			['String', 'object-register'],
			['Number', 'object-register'],
			['parseInt', 'function'],
			['alert', 'function'],
			['Boolean', 'function'],
			['Infinity', 'constant'],
			['NaN', 'constant'],
			['undefined', 'constant'],
		])('answers %s as %s', (name, category) => {
			expect(v5ItemsOf(`${name};`)[0]?.answerOptionIds).toEqual([category]);
		});

		it('fires only for unshadowed realm occurrences across nested scopes', () => {
			// `Math` is the realm global at top level (fires), program-declared inside
			// the shadowing block (silent), realm again after the block (fires)
			const items = v5ItemsOf('Math; { let Math = 1; Math; } Math;');
			expect(items.map((item) => item.id)).toEqual(['V5@0-4', 'V5@30-34']);
			expect(
				items.every((item) => item.answerOptionIds[0] === 'object-register'),
			).toBe(true);
		});

		it('answers only for the receiver of a realm member access', () => {
			const items = v5ItemsOf('Math.max;');
			expect(items).toHaveLength(1);
			expect(items[0]?.groupKey).toBe('realm:Math');
		});

		it('never treats a realm-named property as a realm hit', () => {
			// `Math` here is o's property, not the realm global
			expect(v5ItemsOf('o.Math;')).toEqual([]);
		});

		it('emits nothing for globals excluded from the JeJ realm', () => {
			expect(v5ItemsOf('globalThis;')).toEqual([]);
			expect(v5ItemsOf('RegExp;')).toEqual([]);
		});
	});

	describe('Interfaces', () => {
		it('emits only mcq items', () => {
			expect(v5RawItemsOf('Math;').every((item) => item.mode === 'mcq')).toBe(
				true,
			);
		});

		it('offers three frozen value-category options in a fixed order', () => {
			const item = v5ItemsOf('Math;')[0];
			expect(item?.options.map((option) => option.id)).toEqual([
				'object-register',
				'function',
				'constant',
			]);
			expect(Object.isFrozen(item?.options)).toBe(true);
		});

		it('uses plain prose in the options — never the diagram-internal ƒ glyph', () => {
			const item = v5ItemsOf('alert;')[0];
			expect(item?.options.every((option) => !option.text.includes('ƒ'))).toBe(
				true,
			);
		});

		it.each(['Math;', 'alert;', 'Infinity;'])(
			'uses plain prose in the feedback for %s — never the ƒ glyph',
			(code) => {
				expect(v5ItemsOf(code)[0]?.feedback.includes('ƒ')).toBe(false);
			},
		);

		it('tags every item execution × atom, V5, variables, with feedback', () => {
			const item = v5ItemsOf('Math;')[0];
			expect(item?.cells).toEqual([{ dimension: 'execution', level: 'atom' }]);
			expect(item?.form).toBe('V5');
			expect(item?.family).toBe('variables');
			expect(item?.feedback.length).toBeGreaterThan(0);
		});

		it('carries no anchorPath and no unlocks', () => {
			const item = v5ItemsOf('Math;')[0];
			expect(item).not.toHaveProperty('anchorPath');
			expect(item).not.toHaveProperty('unlocks');
		});

		it('answers with one of its own option ids', () => {
			const item = v5ItemsOf('parseInt;')[0];
			const optionIds = new Set(item?.options.map((option) => option.id));
			expect(item?.answerOptionIds.every((id) => optionIds.has(id))).toBe(true);
		});
	});

	describe('Simple', () => {
		it('is deterministic', () => {
			expect(v5ItemsOf('Math; parseInt; Infinity;')).toEqual(
				v5ItemsOf('Math; parseInt; Infinity;'),
			);
		});

		it('keys each realm occurrence on its own name', () => {
			expect(
				v5ItemsOf('Math; parseInt; Infinity;').map((item) => item.groupKey),
			).toEqual(['realm:Math', 'realm:parseInt', 'realm:Infinity']);
		});
	});
});
