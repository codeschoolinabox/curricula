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
			{ type: 'mdxJsxAttribute', name: 'snippet', value: 'let x = 1;' },
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
			{ type: 'mdxJsxAttribute', name: 'snippet', value: 'print("hi")' },
			{ type: 'mdxJsxAttribute', name: 'lens', value: 'highlight' },
			{ type: 'mdxJsxAttribute', name: 'config', value: '{"ask":false}' },
		]);
	});

	it('empty code value → code attribute has value ""', () => {
		const node = makeCodeNode('', 'js');

		const result = codeBlockToJsx(node, { lens: 'study' });

		const snippetAttr = result.attributes.find((a) => a.name === 'snippet');
		expect(snippetAttr?.value).toBe('');
	});

	// ─── B.2: lang attribute is dropped from the emission contract ───────

	it('B.2: emission carries no `lang` attribute (no lensConfig variant)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lens: 'editor' });

		const names = result.attributes.map((a) => a.name);
		expect(names).toEqual(['snippet', 'lens']);
		expect(names).not.toContain('lang');
	});

	it('B.2: emission carries no `lang` attribute (lensConfig still emits as `config`)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, {
			lens: 'editor',
			lensConfig: { ask: true },
		});

		const names = result.attributes.map((a) => a.name);
		expect(names).toEqual(['snippet', 'lens', 'config']);
		expect(names).not.toContain('lang');
	});

	// ─── B.3: code attribute renamed to snippet ──────────────────────────

	it('B.3: emission carries `snippet` attribute (not `code`) — no lensConfig', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lens: 'study' });

		const names = result.attributes.map((a) => a.name);
		expect(names).toContain('snippet');
		expect(names).not.toContain('code');
	});

	it('B.3: emission carries `snippet` attribute (not `code`) — lensConfig present', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, {
			lens: 'study',
			lensConfig: { ask: true },
		});

		const names = result.attributes.map((a) => a.name);
		expect(names).toContain('snippet');
		expect(names).not.toContain('code');
	});

	// ─── B.4: lens optional in emission (bare-fence path) ────────────────

	it('B.4: no lens supplied → emission contains only `snippet` attribute', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, {});

		expect(result.attributes).toEqual([
			{ type: 'mdxJsxAttribute', name: 'snippet', value: 'let x = 1;' },
		]);
		const names = result.attributes.map((a) => a.name);
		expect(names).not.toContain('lens');
	});

	it('B.4: no lens supplied + lensConfig present → snippet + config (no lens)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lensConfig: { ask: false } });

		const names = result.attributes.map((a) => a.name);
		expect(names).toEqual(['snippet', 'config']);
	});

	// ─── B.5: configs cascade-bundle attribute ───────────────────────────

	it('B.5: configs attribute emits as JSON-stringified value of the cascade lenses map', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, {
			lens: 'study',
			configs: { trace: { stepDelay: 500 }, parsons: { distractors: 4 } },
		});

		const configsAttr = result.attributes.find((a) => a.name === 'configs');
		expect(configsAttr?.value).toBe(
			JSON.stringify({
				trace: { stepDelay: 500 },
				parsons: { distractors: 4 },
			}),
		);
	});

	it('B.5: configs absent → no configs attribute emitted', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lens: 'study' });

		const names = result.attributes.map((a) => a.name);
		expect(names).not.toContain('configs');
	});

	it('B.5: configs empty `{}` → no configs attribute emitted (locked decision 6: only when non-empty)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lens: 'study', configs: {} });

		const names = result.attributes.map((a) => a.name);
		expect(names).not.toContain('configs');
	});

	it('B.5: full four-prop emission shape (snippet + lens + config + configs)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, {
			lens: 'parsons',
			lensConfig: { distractors: 4 },
			configs: { parsons: { shuffleSeed: 42 } },
		});

		const names = result.attributes.map((a) => a.name);
		expect(names).toEqual(['snippet', 'lens', 'config', 'configs']);
	});
});
