/**
 * @file Unit tests for the fenced-code-block → mdxJsxFlowElement builder.
 *
 * In-memory MDAST nodes only — no fixtures or filesystem. The function is
 * pure (does NOT mutate its input node), so tests assert against the
 * returned node shape and also verify the input node is untouched.
 *
 * Post-reshape: emission is **three props** (`snippet`, `lens?`, `configs?`).
 * No separate `config` prop — per-fence/sibling overrides are pre-merged
 * INTO `configs.lenses[lens]` by the remark plugin's caller; this helper
 * just emits whatever `configs` it receives, opaquely.
 */

import { describe, expect, it } from 'vitest';

import codeBlockToJsx from '../code-block-to-jsx.js';

import type { Code } from 'mdast';

function makeCodeNode(value: string, lang: string | null = null): Code {
	return { type: 'code', value, lang, meta: null };
}

describe('codeBlockToJsx', () => {
	it('lens, no configs → returns mdxJsxFlowElement with correct attributes; input node not mutated', () => {
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

	it('empty snippet value → snippet attribute has value ""', () => {
		const node = makeCodeNode('', 'js');

		const result = codeBlockToJsx(node, { lens: 'study' });

		const snippetAttr = result.attributes.find((a) => a.name === 'snippet');
		expect(snippetAttr?.value).toBe('');
	});

	// ─── B.2: lang attribute is dropped from the emission contract ───────

	it('B.2: emission carries no `lang` attribute', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lens: 'editor' });

		const names = result.attributes.map((a) => a.name);
		expect(names).toEqual(['snippet', 'lens']);
		expect(names).not.toContain('lang');
	});

	// ─── B.3: code attribute renamed to snippet ──────────────────────────

	it('B.3: emission carries `snippet` attribute (not `code`)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lens: 'study' });

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

	// ─── B.5 → C: configs is the whole resolved cascade (opaque) ─────────

	it('C: configs attribute is an mdxJsxAttributeValueExpression carrying the WHOLE cascade source + estree', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const wholeCascade = {
			defaults: { js: 'study' },
			embedSiblings: { mode: 'tabs', ignorePrefixes: [], sectionHeading: null },
			exerciseSetPrefixes: ['sl-'],
			lenses: { trace: { stepDelay: 500 }, parsons: { distractors: 4 } },
		};

		const result = codeBlockToJsx(node, {
			lens: 'study',
			configs: wholeCascade,
		});

		const configsAttr = result.attributes.find((a) => a.name === 'configs');
		expect(configsAttr).toBeDefined();
		// Expression-valued attribute, not a plain string.
		expect(typeof configsAttr?.value).toBe('object');
		const exprValue = configsAttr?.value as {
			type: string;
			value: string;
			data?: { estree?: { type: string; body: ReadonlyArray<unknown> } };
		};
		expect(exprValue.type).toBe('mdxJsxAttributeValueExpression');
		// The source-code string is the JSON serialization (valid JS
		// object-literal source for JSON-compatible payloads).
		expect(exprValue.value).toBe(JSON.stringify(wholeCascade));
		// The estree program is attached for MDX's compiler to emit
		// directly — no consumer-side JSON.parse required.
		expect(exprValue.data?.estree?.type).toBe('Program');
		expect(exprValue.data?.estree?.body.length).toBe(1);
	});

	it('C: configs absent → no configs attribute emitted', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, { lens: 'study' });

		const names = result.attributes.map((a) => a.name);
		expect(names).not.toContain('configs');
	});

	// ─── C: opaque passthrough — plugin never inspects shape ─────────────

	it('C: configs is structural passthrough — bizarre top-level keys are emitted unchanged', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const cascadeWithUnknownKeys = {
			defaults: { js: 'study' },
			lenses: {},
			// L2-future seam candidates, current arbitrary auxiliary keys:
			defaultLens: 'parsons',
			experimentalFlag: true,
			nestedShape: { deep: { value: 42 } },
		};

		const result = codeBlockToJsx(node, {
			lens: 'study',
			configs: cascadeWithUnknownKeys,
		});

		const configsAttr = result.attributes.find((a) => a.name === 'configs');
		const sourceCode = (configsAttr?.value as { value: string }).value;
		expect(sourceCode).toBe(JSON.stringify(cascadeWithUnknownKeys));
	});

	// ─── C: wire-format round-trip (AR-5 BLOCKER 1 integration test) ─────

	it('C: estree program evaluates to the ORIGINAL object — wire format round-trips at MDX runtime (frozen-input variant)', async () => {
		// AR-5 surfaced that the pre-reshape plugin emitted `configs` as a
		// JSON-stringified value on a plain mdxJsxAttribute — a wire-format
		// mismatch that would have silently dropped configs at MDX runtime.
		// The fix: emit configs as mdxJsxAttributeValueExpression so MDX
		// evaluates the estree program directly.
		//
		// AR-4 re-fire flagged that an earlier version of this test only
		// evaluated the SOURCE-STRING fallback (`exprValue.value`), not the
		// estree program. For frozen-cascade input (the real runtime case
		// per the resolver's deep-freeze contract), `valueToEstree`
		// produces an `Object.defineProperties(...)` CallExpression — NOT
		// an ObjectExpression. The source-string and estree paths diverge
		// in shape but converge in evaluated value. To prove the estree
		// path is what MDX actually evaluates, we codegen the estree via
		// `astring` and evaluate the generated code.
		const { generate } = await import('astring');

		// Deep-freeze the input so valueToEstree takes the
		// `Object.defineProperties`-wrapping path (mirrors what the
		// resolver produces).
		const deepFreeze = (obj: unknown): unknown => {
			if (obj !== null && typeof obj === 'object') {
				for (const v of Object.values(obj)) deepFreeze(v);
				Object.freeze(obj);
			}
			return obj;
		};
		const original = deepFreeze({
			defaults: { js: 'study' },
			lenses: {
				trace: { stepDelay: 500, cols: ['value', 'steps'] },
				parsons: { distractors: 4 },
			},
			exerciseSetPrefixes: ['sl-'],
		}) as Readonly<Record<string, unknown>>;

		const node = makeCodeNode('let x = 1;', 'js');
		const result = codeBlockToJsx(node, { lens: 'trace', configs: original });
		const configsAttr = result.attributes.find((a) => a.name === 'configs');
		const exprValue = configsAttr?.value as {
			type: string;
			value: string;
			data: {
				estree: { body: ReadonlyArray<{ expression: unknown }> };
			};
		};

		// Path 1: source-string fallback (the value MDX uses when
		// data.estree is missing — JSON.stringify output, valid JS
		// object-literal syntax for JSON-shaped payloads).
		const fromSource = new Function(`return (${exprValue.value})`)();
		expect(fromSource).toEqual(original);

		// Path 2: estree program (the value MDX actually emits when
		// data.estree IS present — what runtime really uses). Codegen
		// via astring; evaluate via Function. This exercises the
		// frozen-input `Object.defineProperties`-wrapping CallExpression
		// shape, not the simpler ObjectExpression that plain-object
		// inputs produce.
		const estreeExpression = exprValue.data.estree.body[0]!.expression;
		const codeFromEstree = generate(estreeExpression as never);
		const fromEstree = new Function(`return (${codeFromEstree})`)();
		expect(fromEstree).toEqual(original);
	});

	// ─── C: 3-prop emission shape (full surface) ─────────────────────────

	it('C: full three-prop emission shape (snippet + lens + configs)', () => {
		const node = makeCodeNode('let x = 1;', 'js');

		const result = codeBlockToJsx(node, {
			lens: 'parsons',
			configs: {
				defaults: { js: 'parsons' },
				lenses: { parsons: { distractors: 4, shuffleSeed: 42 } },
			},
		});

		const names = result.attributes.map((a) => a.name);
		expect(names).toEqual(['snippet', 'lens', 'configs']);
		expect(names).not.toContain('config');
	});
});
