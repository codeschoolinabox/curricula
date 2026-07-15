/**
 * @file Layer 1 integration tests: instrumentation pipeline.
 *
 * Tests that instrument() produces valid code with correctly populated
 * tag metadata. These tests verify the digest → tagMap → pointcut wrapping
 * pipeline without executing instrumented code.
 */

import { describe, expect, it } from 'vitest';

import instrument from '../instrument.js';

describe('instrument', () => {
	describe('tag map population', () => {
		it('returns a tagMap with entries', () => {
			const result = instrument('let x = 5;\n', {});
			expect(result.tagMap).toBeDefined();
			expect(result.tagMap.size).toBeGreaterThan(0);
		});

		it('tagMap entries have loc with start/end', () => {
			const result = instrument('let x = 5;\n', {});

			for (const tag of result.tagMap.values()) {
				expect(tag.loc).toBeDefined();
				expect(tag.loc.start).toBeDefined();
				expect(tag.loc.end).toBeDefined();
				expect(typeof tag.loc.start.line).toBe('number');
				expect(typeof tag.loc.start.column).toBe('number');
			}
		});

		it('tagMap entries have node (ESTree type name)', () => {
			const result = instrument('let x = 5;\n', {});

			for (const tag of result.tagMap.values()) {
				expect(typeof tag.node).toBe('string');
				expect(tag.node.length).toBeGreaterThan(0);
			}
		});

		it('tagMap entries have a $-rooted nodePath', () => {
			const result = instrument('let x = 5;\n', {});

			for (const tag of result.tagMap.values()) {
				expect(typeof tag.nodePath).toBe('string');
				expect(tag.nodePath.startsWith('$')).toBe(true);
			}
		});

		it('tagMap entries have source (source text)', () => {
			const result = instrument('let x = 5;\n', {});

			for (const tag of result.tagMap.values()) {
				expect(typeof tag.source).toBe('string');
			}
		});

		it('VariableDeclaration tag has bindingKind "let"', () => {
			const result = instrument('let x = 5;\n', {});

			const varDeclTags = [...result.tagMap.values()].filter(
				(t) => t.node === 'VariableDeclaration',
			);
			expect(varDeclTags.length).toBeGreaterThan(0);
			expect(varDeclTags[0].bindingKind).toBe('let');
		});

		it('VariableDeclaration tag has bindingKind "const"', () => {
			const result = instrument('const y = 10;\n', {});

			const varDeclTags = [...result.tagMap.values()].filter(
				(t) => t.node === 'VariableDeclaration',
			);
			expect(varDeclTags.length).toBeGreaterThan(0);
			expect(varDeclTags[0].bindingKind).toBe('const');
		});

		it('VariableDeclarator tag inherits bindingKind from parent', () => {
			const result = instrument('let x = 5;\n', {});

			const declaratorTags = [...result.tagMap.values()].filter(
				(t) => t.node === 'VariableDeclarator',
			);
			expect(declaratorTags.length).toBeGreaterThan(0);
			expect(declaratorTags[0].bindingKind).toBe('let');
		});

		it('Literal tag has literalKind "number"', () => {
			const result = instrument('let x = 42;\n', {});

			const literalTags = [...result.tagMap.values()].filter(
				(t) => t.node === 'Literal' && t.literalKind === 'number',
			);
			expect(literalTags.length).toBeGreaterThan(0);
		});

		it('Literal tag has literalKind "string"', () => {
			const result = instrument('let x = "hello";\n', {});

			const literalTags = [...result.tagMap.values()].filter(
				(t) => t.node === 'Literal' && t.literalKind === 'string',
			);
			expect(literalTags.length).toBeGreaterThan(0);
		});

		it('BinaryExpression tag has operator', () => {
			const result = instrument('let x = 1 + 2;\n', {});

			const binExprTags = [...result.tagMap.values()].filter(
				(t) => t.node === 'BinaryExpression',
			);
			expect(binExprTags.length).toBeGreaterThan(0);
			expect(binExprTags[0].operator).toBe('+');
		});

		it('WhileStatement tag has loopKind and structure', () => {
			const result = instrument(
				'let i = 0;\nwhile (i < 3) {\n  i = i + 1;\n}\n',
				{},
			);

			const whileTags = [...result.tagMap.values()].filter(
				(t) => t.node === 'WhileStatement',
			);
			expect(whileTags.length).toBeGreaterThan(0);
			expect(whileTags[0].loopKind).toBe('while');
			expect(whileTags[0].structure).toBe('while');
		});

		it('IfStatement tag has structure "conditional"', () => {
			const result = instrument(
				'let x = 5;\nif (x > 3) {\n  let y = 1;\n}\n',
				{},
			);

			const ifTags = [...result.tagMap.values()].filter(
				(t) => t.node === 'IfStatement',
			);
			expect(ifTags.length).toBeGreaterThan(0);
			expect(ifTags[0].structure).toBe('conditional');
		});
	});

	describe('instrumented code validity', () => {
		it('produces a non-empty string', () => {
			const result = instrument('let x = 5;\n', {});
			expect(typeof result.instrumentedCode).toBe('string');
			expect(result.instrumentedCode.length).toBeGreaterThan(0);
		});

		it('syntax error in input throws', () => {
			expect(() => instrument('let x = ;\n', {})).toThrow();
		});
	});
});
