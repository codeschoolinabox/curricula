/**
 * @file Unit tests for the fenced-code-block → hast transformer.
 *
 * In-memory MDAST nodes only — no fixtures or filesystem. The function
 * is pure (mutates its input node and returns void), so tests inline
 * the node shape and assert against `node.data` post-mutation.
 */

import { describe, expect, it } from 'vitest';

import codeBlockToHast from '../code-block-to-hast.js';

import type { Code } from 'mdast';

function makeCodeNode(value: string, lang: string | null = null): Code {
	return { type: 'code', value, lang, meta: null };
}

describe('codeBlockToHast', () => {
	it('lens + lang, no lensConfig → node gains hName StudyLens + primitive hProperties', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		codeBlockToHast(node, { lens: 'study', lang: 'js' });

		expect(node.data).toEqual({
			hName: 'StudyLens',
			hProperties: { code: 'let x = 1;', lens: 'study', lang: 'js' },
		});
	});
});
