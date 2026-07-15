import { describe, expect, it } from 'vitest';

import computeCodeLineMask from '../lib/code-lines.js';

describe('computeCodeLineMask', () => {
	describe('Zero — empty', () => {
		it('a single empty line is a freebie', () => {
			expect(computeCodeLineMask([''])).toEqual([false]);
		});
	});

	describe('One — line kinds', () => {
		it('a pure-code line is a code line', () => {
			expect(computeCodeLineMask(['const x = 1;'])).toEqual([true]);
		});

		it('a comment-only line is a freebie', () => {
			expect(computeCodeLineMask(['// note'])).toEqual([false]);
		});

		it('a whitespace-only line is a freebie', () => {
			expect(computeCodeLineMask(['  '])).toEqual([false]);
		});

		it('a code line with a trailing comment is a code line', () => {
			expect(computeCodeLineMask(['x = 1; // note'])).toEqual([true]);
		});
	});

	describe('Block comments — cross-line state', () => {
		it('treats JSDoc inner lines as freebies and only the code line as code', () => {
			const lines = '/**\n * @param x\n */\nconst x = 1;'.split('\n');
			expect(computeCodeLineMask(lines)).toEqual([false, false, false, true]);
		});

		it('a line that opens a block on real code is a code line', () => {
			const lines = 'a; /* open\nbody\nend */ b;'.split('\n');
			expect(computeCodeLineMask(lines)[0]).toBe(true);
		});

		it('a code-bearing line inside an open block is a freebie', () => {
			const lines = 'a; /* open\nbody\nend */ b;'.split('\n');
			expect(computeCodeLineMask(lines)[1]).toBe(false);
		});

		it('a line that closes a block and bears code is a code line', () => {
			const lines = 'a; /* open\nbody\nend */ b;'.split('\n');
			expect(computeCodeLineMask(lines)[2]).toBe(true);
		});
	});
});
