/**
 * @file Pure-TS tests for the `annotate` lens code-view derivation.
 * No React, no jsdom. ZOMBIES coverage of the
 * `(source, colorize) → CodeSpanTree` mapping per `../README.md`
 * § View contract and `../DOCS.md` § Phase 2 Derive view content.
 */

import { describe, expect, it } from 'vitest';

import deriveCodeSpanTree from '../render-code.js';

describe('deriveCodeSpanTree', () => {
	describe('empty source', () => {
		it('colorize off → one line holding one empty plain span', () => {
			expect(deriveCodeSpanTree('', false)).toEqual({
				lines: [[{ className: '', text: '' }]],
			});
		});

		it('colorize on → Prism emits a single trailing-newline plain token', () => {
			expect(deriveCodeSpanTree('', true)).toEqual({
				lines: [[{ className: 'token plain', text: '\n' }]],
			});
		});
	});

	describe('single line, colorize off', () => {
		it('one line, one span carrying the whole line as plain text', () => {
			expect(deriveCodeSpanTree('let x', false)).toEqual({
				lines: [[{ className: '', text: 'let x' }]],
			});
		});
	});

	describe('deep-freeze invariant', () => {
		it('returned tree is frozen', () => {
			expect(Object.isFrozen(deriveCodeSpanTree('x', true))).toBe(true);
		});

		it('nested spans are frozen (deep)', () => {
			expect(Object.isFrozen(deriveCodeSpanTree('x', true).lines[0][0])).toBe(
				true,
			);
		});

		it('colorize-off path is also frozen', () => {
			expect(Object.isFrozen(deriveCodeSpanTree('x', false))).toBe(true);
		});
	});

	describe('single keyword, colorize on', () => {
		it('keyword token gets the exact Prism className', () => {
			expect(deriveCodeSpanTree('const', true)).toEqual({
				lines: [[{ className: 'token keyword', text: 'const' }]],
			});
		});
	});

	describe('multi-line, colorize off', () => {
		it('produces one line entry per source line', () => {
			expect(deriveCodeSpanTree('a\nb', false).lines).toHaveLength(2);
		});

		it('first line span text is the first source line', () => {
			expect(deriveCodeSpanTree('a\nb', false).lines[0][0].text).toBe('a');
		});

		it('second line span text is the second source line', () => {
			expect(deriveCodeSpanTree('a\nb', false).lines[1][0].text).toBe('b');
		});
	});

	describe('multi-line, colorize on', () => {
		it('produces one line entry per source line', () => {
			expect(deriveCodeSpanTree('a\nb', true).lines).toHaveLength(2);
		});
	});

	describe('colorize off → plain text only', () => {
		it('every span across every line has an empty className', () => {
			const tree = deriveCodeSpanTree('const x;\nlet y;', false);
			expect(tree.lines.flat().every((span) => span.className === '')).toBe(
				true,
			);
		});

		it('per-line text join reconstructs the source exactly', () => {
			const source = 'const x = 1;\nlet y = 2;';
			const tree = deriveCodeSpanTree(source, false);
			const rebuilt = tree.lines
				.map((line) => line.map((span) => span.text).join(''))
				.join('\n');
			expect(rebuilt).toBe(source);
		});
	});

	describe('colorize on → Prism classes present', () => {
		it('a keyword line contains a span classed as a keyword token', () => {
			const tree = deriveCodeSpanTree('function', true);
			const hasKeyword = tree.lines
				.flat()
				.some((span) => span.className === 'token keyword');
			expect(hasKeyword).toBe(true);
		});
	});
});
