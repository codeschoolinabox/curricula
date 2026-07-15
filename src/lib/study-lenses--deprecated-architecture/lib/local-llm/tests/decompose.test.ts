import { describe, expect, it } from 'vitest';

import decompose from '../decompose.js';

describe('decompose', () => {
	describe('empty reply', () => {
		it('raw is the empty string', () => {
			expect(decompose('').raw).toBe('');
		});

		it('code is the empty string', () => {
			expect(decompose('').code).toBe('');
		});

		it('no thinkTrace key', () => {
			expect(decompose('')).not.toHaveProperty('thinkTrace');
		});
	});

	describe('one fenced block', () => {
		it('code is the block inner content, byte-exact (not trimmed)', () => {
			expect(decompose('```\nconst x = 1;\n```').code).toBe('const x = 1;\n');
		});

		it('raw echoes the input byte-exact', () => {
			expect(decompose('```\nconst x = 1;\n```').raw).toBe(
				'```\nconst x = 1;\n```',
			);
		});
	});

	describe('multiple fenced blocks', () => {
		it('code is the first block only', () => {
			expect(decompose('```\nfirst\n```\n```\nsecond\n```').code).toBe(
				'first\n',
			);
		});
	});

	describe('fenced block whose content contains a fence', () => {
		it('code keeps a ``` that does not begin its own line', () => {
			expect(decompose("```\nconst s = '```';\n```").code).toBe(
				"const s = '```';\n",
			);
		});
	});

	describe('empty fenced block', () => {
		it('code is the empty string', () => {
			expect(decompose('```\n```').code).toBe('');
		});
	});

	describe('boundary — fence miss', () => {
		it('code is the trimmed raw', () => {
			expect(decompose('  bare prose, no fence  ').code).toBe(
				'bare prose, no fence',
			);
		});

		it('raw keeps surrounding whitespace byte-exact', () => {
			expect(decompose('  bare prose, no fence  ').raw).toBe(
				'  bare prose, no fence  ',
			);
		});

		it('does not throw on an unterminated fence', () => {
			expect(() => decompose('```\nno closing fence')).not.toThrow();
		});

		it('unterminated fence falls back to the trimmed raw', () => {
			expect(decompose('```\nno closing fence').code).toBe(
				'```\nno closing fence',
			);
		});

		it('does not throw on a bare fence with no content line', () => {
			expect(() => decompose('```')).not.toThrow();
		});

		it('bare fence with no content line falls back to the trimmed raw', () => {
			expect(decompose('```').code).toBe('```');
		});
	});

	describe('boundary — think trace', () => {
		it('think block present → thinkTrace is the inner content, byte-exact', () => {
			expect(
				decompose('<think>\nweighing it\n</think>\nreply').thinkTrace,
			).toBe('\nweighing it\n');
		});

		it('no think block → thinkTrace key absent', () => {
			expect(decompose('plain reply')).not.toHaveProperty('thinkTrace');
		});

		it('empty think block → thinkTrace key present', () => {
			expect(decompose('<think></think>')).toHaveProperty('thinkTrace');
		});

		it('empty think block → thinkTrace is the empty string', () => {
			expect(decompose('<think></think>').thinkTrace).toBe('');
		});
	});

	describe('returned object', () => {
		it('is frozen', () => {
			expect(Object.isFrozen(decompose('anything'))).toBe(true);
		});
	});

	describe('language-tagged fence', () => {
		it('excludes the language tag from code', () => {
			expect(decompose('```js\nconst x = 1;\n```').code).toBe('const x = 1;\n');
		});
	});

	describe('think block and fenced block together', () => {
		it('extracts code from the fenced block', () => {
			expect(
				decompose('<think>\nreason\n</think>\n```\nconst x = 1;\n```').code,
			).toBe('const x = 1;\n');
		});

		it('extracts thinkTrace from the think block', () => {
			expect(
				decompose('<think>\nreason\n</think>\n```\nconst x = 1;\n```')
					.thinkTrace,
			).toBe('\nreason\n');
		});
	});
});
