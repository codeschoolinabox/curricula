import { describe, expect, it } from 'vitest';

import commentSkeleton from '../lib/comment-skeleton.js';

describe('commentSkeleton', () => {
	describe('Zero — empty source', () => {
		it('empty string maps to empty string', () => {
			expect(commentSkeleton('')).toBe('');
		});
	});

	describe('One — single line', () => {
		it('a pure-code line becomes an empty line', () => {
			expect(commentSkeleton('const x = 1;')).toBe('');
		});

		it('a comment-only line is kept verbatim', () => {
			expect(commentSkeleton('// a note')).toBe('// a note');
		});

		it('strips the code but keeps the trailing comment with leading whitespace', () => {
			expect(commentSkeleton('\tconst x = 1; // keep me')).toBe('\t// keep me');
		});

		it('keeps an inline block comment on a code line', () => {
			expect(commentSkeleton('foo(); /* hi */')).toBe('/* hi */');
		});

		it('joins a trailing // and an inline /* */ on the same code line', () => {
			expect(commentSkeleton('foo(); /* note */ // also')).toBe(
				'// also /* note */',
			);
		});
	});

	describe('Many — multi-line', () => {
		it('preserves the source line count', () => {
			const source = 'const a = 1;\n// note\n\nconst b = 2;';
			expect(commentSkeleton(source).split('\n')).toHaveLength(
				source.split('\n').length,
			);
		});

		it('reduces a code body to empty lines while keeping the comment line', () => {
			const source = 'function f() {\n\treturn 1; // why\n}';
			expect(commentSkeleton(source)).toBe('\n\t// why\n');
		});
	});

	describe('Block comments — cross-line state', () => {
		it('extracts the block opener from a code line that opens a block', () => {
			const source = 'a; /* open\nx = 1;\nend */ b;';
			expect(commentSkeleton(source).split('\n')[0]).toBe('/* open');
		});

		it('keeps a code-bearing body line inside an open block verbatim', () => {
			const source = 'a; /* open\nx = 1;\nend */ b;';
			expect(commentSkeleton(source).split('\n')[1]).toBe('x = 1;');
		});

		it('extracts the block closer from a line that closes a block and bears code', () => {
			const source = 'a; /* open\nx = 1;\nend */ b;';
			expect(commentSkeleton(source).split('\n')[2]).toBe('end */');
		});
	});

	describe('Boundaries — whitespace + blank lines', () => {
		it('a whitespace-only line is kept verbatim', () => {
			expect(commentSkeleton('  ')).toBe('  ');
		});

		it('blank lines between code lines are preserved as blank lines', () => {
			expect(commentSkeleton('a();\n\nb();')).toBe('\n\n');
		});
	});
});
