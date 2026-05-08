/**
 * @file Unit tests for the fenced-code-block → mdxJsxFlowElement builder.
 *
 * In-memory MDAST nodes only — no fixtures or filesystem. The function is
 * pure (does NOT mutate its input node), so tests assert against the
 * returned node shape and also verify the input node is untouched.
 */

import { describe, expect, it } from 'vitest';

import codeBlockToJsx from '../code-block-to-jsx.js';

import type { Code } from 'mdast';

function makeCodeNode(value: string, lang: string | null = null): Code {
	return { type: 'code', value, lang, meta: null };
}

describe('codeBlockToJsx', () => {
	it('lens, no lensConfig → returns mdxJsxFlowElement with correct attributes; input node not mutated', () => {
		const node = makeCodeNode('let x = 1;', 'js');
		const inputSnapshot = JSON.stringify(node);

		const result = codeBlockToJsx(node, { lens: 'study' });

		// returned node shape
		expect(result.type).toBe('mdxJsxFlowElement');
		expect(result.name).toBe('StudyLenses');
		expect(result.children).toEqual([]);
		expect(result.attributes).toEqual([
			{ type: 'mdxJsxAttribute', name: 'code', value: 'let x = 1;' },
			{ type: 'mdxJsxAttribute', name: 'lens', value: 'study' },
		]);
		// input node NOT mutated
		expect(JSON.stringify(node)).toBe(inputSnapshot);
		expect((node as { data?: unknown }).data).toBeUndefined();
	});

	it('lensConfig present → config attribute appears as JSON-stringified value', () => {
		const node = makeCodeNode('print("hi")', 'py');

		const result = codeBlockToJsx(node, {
			lens: 'highlight',
			lensConfig: { ask: false },
		});

		expect(result.attributes).toEqual([
			{ type: 'mdxJsxAttribute', name: 'code', value: 'print("hi")' },
			{ type: 'mdxJsxAttribute', name: 'lens', value: 'highlight' },
			{ type: 'mdxJsxAttribute', name: 'config', value: '{"ask":false}' },
		]);
	});

	it('empty code value → code attribute has value ""', () => {
		const node = makeCodeNode('', 'js');

		const result = codeBlockToJsx(node, { lens: 'study' });

		const codeAttr = result.attributes.find((a) => a.name === 'code');
		expect(codeAttr?.value).toBe('');
	});

	// ─── B.2: lang attribute is dropped from the emission contract ───────

	it('B.2: emission carries no `lang` attribute (no lensConfig variant)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lens: 'editor' });

		const names = result.attributes.map((a) => a.name);
		expect(names).toEqual(['code', 'lens']);
		expect(names).not.toContain('lang');
	});

	it('B.2: emission carries no `lang` attribute (lensConfig still emits as `config`)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, {
			lens: 'editor',
			lensConfig: { ask: true },
		});

		const names = result.attributes.map((a) => a.name);
		expect(names).toEqual(['code', 'lens', 'config']);
		expect(names).not.toContain('lang');
	});
});
