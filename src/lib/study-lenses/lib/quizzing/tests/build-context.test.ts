import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

describe('buildContext', () => {
	describe('Zero', () => {
		it('carries an empty anchor stream for a program with no occurrences', () => {
			const snippet = embody('');
			expect(
				buildContext(snippet, classifyOf(snippet)).identifierAnchors,
			).toEqual([]);
		});

		it('carries an empty property-access stream for a program with no member access', () => {
			const snippet = embody('let x = 1; x;');
			expect(
				buildContext(snippet, classifyOf(snippet)).propertyAccessAnchors,
			).toEqual([]);
		});
	});

	describe('One', () => {
		it('collects the identifier anchors from a single AST descent', () => {
			const snippet = embody('let x = 1; x;');
			expect(
				buildContext(snippet, classifyOf(snippet)).identifierAnchors,
			).toEqual([
				{ range: [4, 5], name: 'x', usageKind: 'declared' },
				{ range: [11, 12], name: 'x', usageKind: 'read' },
			]);
		});

		it('passes the classified token stream through unchanged', () => {
			const snippet = embody('let x = 1;');
			const classified = classifyOf(snippet);
			expect(buildContext(snippet, classified).classified).toBe(classified);
		});

		it('carries the scope forest for binding-aware generators', () => {
			const snippet = embody('let x = 1;');
			expect(
				buildContext(snippet, classifyOf(snippet)).forest.root.declarations.has(
					'x',
				),
			).toBe(true);
		});

		it('collects the property-access anchors from a single AST descent', () => {
			const snippet = embody('o.x;');
			expect(
				buildContext(snippet, classifyOf(snippet)).propertyAccessAnchors,
			).toEqual([{ range: [2, 3], name: 'x' }]);
		});
	});

	describe('Interfaces', () => {
		it('returns a frozen context bundle', () => {
			const snippet = embody('let x = 1;');
			expect(Object.isFrozen(buildContext(snippet, classifyOf(snippet)))).toBe(
				true,
			);
		});

		it('deeply freezes the collected anchor stream', () => {
			const snippet = embody('let x = 1;');
			expect(
				Object.isFrozen(
					buildContext(snippet, classifyOf(snippet)).identifierAnchors,
				),
			).toBe(true);
		});

		it('freezes each collected anchor object', () => {
			const snippet = embody('let x = 1;');
			expect(
				Object.isFrozen(
					buildContext(snippet, classifyOf(snippet)).identifierAnchors[0],
				),
			).toBe(true);
		});

		it('deeply freezes the collected property-access stream', () => {
			const snippet = embody('o.x;');
			expect(
				Object.isFrozen(
					buildContext(snippet, classifyOf(snippet)).propertyAccessAnchors,
				),
			).toBe(true);
		});

		it('freezes each collected property-access anchor object', () => {
			const snippet = embody('o.x;');
			expect(
				Object.isFrozen(
					buildContext(snippet, classifyOf(snippet)).propertyAccessAnchors[0],
				),
			).toBe(true);
		});
	});

	describe('Exceptions', () => {
		it('throws a parse-precondition error on an unparsed snippet', () => {
			expect(() => buildContext(embody('FAIL_AT_PARSE'), [])).toThrow(
				/parsed|unparsed|ast/i,
			);
		});
	});

	describe('Simple', () => {
		it('is deterministic across repeated builds', () => {
			const snippet = embody('let x = 1; x;');
			const classified = classifyOf(snippet);
			expect(buildContext(snippet, classified)).toEqual(
				buildContext(snippet, classified),
			);
		});
	});
});
