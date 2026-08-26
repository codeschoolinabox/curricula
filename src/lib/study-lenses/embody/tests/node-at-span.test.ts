import { describe, expect, it } from 'vitest';

import deriveAst from '../derive-ast.js';
import deriveEntwined from '../derive-entwined.js';
import deriveTokens from '../derive-tokens.js';
import nodeAtSpan from '../node-at-span.js';
import type { Entwined } from '../types.js';

function entwine(source: string): Entwined {
	const snippet = { source, type: 'script' } as const;
	const tokens = deriveTokens(snippet);
	const { ast, parenSpansByNode } = deriveAst(snippet, tokens);
	const stage = deriveEntwined(snippet.source, tokens, ast, parenSpansByNode);
	if (!stage?.ok) {
		throw new Error('fixture failed to entwine');
	}
	return stage.value;
}

describe('nodeAtSpan', () => {
	describe('boundaries — total, never throws', () => {
		it('an out-of-range start answers null', () => {
			const entwined = entwine('let x = 1;\n');
			expect(nodeAtSpan(entwined, 999, 1005)).toBeNull();
		});

		it('start at source.length answers null', () => {
			const source = 'let x = 1;\n';
			const entwined = entwine(source);
			expect(nodeAtSpan(entwined, source.length, source.length + 1)).toBeNull();
		});

		it('a zero-width request answers null', () => {
			const entwined = entwine('let x = 1;\n');
			expect(nodeAtSpan(entwined, 4, 4)).toBeNull();
		});

		it('a covered offset with no exact span match answers null', () => {
			const entwined = entwine('let x = 1;\n');
			expect(nodeAtSpan(entwined, 4, 6)).toBeNull();
		});
	});

	describe('one — the exact match', () => {
		it('an identifier resolves at its own span', () => {
			const entwined = entwine('const a = (b);\n');
			expect(nodeAtSpan(entwined, 11, 12)?.node.type).toBe('Identifier');
		});

		it('an exact ANCESTOR match resolves through the ascent', () => {
			const entwined = entwine('let x = 1;\n');
			expect(nodeAtSpan(entwined, 4, 9)?.path).toBe('$.body.0.declarations.0');
		});
	});

	describe('interface — the ruled tie-breaks', () => {
		it('the identical-span ancestor resolves to the DEEPEST node', () => {
			const entwined = entwine('`${x}`');
			expect(nodeAtSpan(entwined, 0, 6)?.node.type).toBe('TemplateLiteral');
		});

		it('an off-chain identical-span sibling is unreachable — byOffset pinned the other', () => {
			const entwined = entwine('const {x = 1} = o;\n');
			expect(nodeAtSpan(entwined, 7, 8)?.path).toBe(
				'$.body.0.declarations.0.id.properties.0.value.left',
			);
		});
	});

	describe('exceptions — the paren contract', () => {
		it('a paren-inclusive span matches no node', () => {
			const entwined = entwine('const a = (b);\n');
			expect(nodeAtSpan(entwined, 10, 13)).toBeNull();
		});
	});
});
