import { parse } from 'acorn';
import type { Comment, Token } from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ParseFacts } from '../../types.js';
import scaffoldLevel from '../index.js';

function parseFacts(source: string): ParseFacts {
	const tokens: Token[] = [];
	const comments: Comment[] = [];
	const ast = parse(source, {
		ecmaVersion: 'latest',
		onComment: comments,
		onToken: tokens,
		sourceType: 'module',
	});
	return { ast, comments, tokens, unresolvedReferences: [] };
}

describe('scaffoldLevel', () => {
	describe('an empty program (Zero)', () => {
		it('yields no violations', () => {
			expect(scaffoldLevel.validate(parseFacts(''))).toEqual([]);
		});
	});

	describe('one debugger statement (One)', () => {
		it('yields exactly one violation', () => {
			expect(scaffoldLevel.validate(parseFacts('debugger;'))).toHaveLength(1);
		});

		it('names the node type', () => {
			expect(scaffoldLevel.validate(parseFacts('debugger;'))[0]?.nodeType).toBe(
				'DebuggerStatement',
			);
		});

		it('carries the parser offsets', () => {
			expect(
				scaffoldLevel.validate(parseFacts('debugger;'))[0]?.location,
			).toEqual({ end: 9, start: 0 });
		});

		it('carries the node path', () => {
			expect(scaffoldLevel.validate(parseFacts('debugger;'))[0]?.nodePath).toBe(
				'$.body.0',
			);
		});

		it('carries a message naming the construct', () => {
			expect(
				scaffoldLevel.validate(parseFacts('debugger;'))[0]?.message,
			).toMatch(/debugger/i);
		});
	});

	describe('several debugger statements (Many)', () => {
		it('yields one violation per statement, in source order', () => {
			const source = 'debugger;\nconst x = 1;\ndebugger;\ndebugger;';
			const starts = scaffoldLevel
				.validate(parseFacts(source))
				.map((found) => found.location.start);
			expect(starts).toEqual([0, 23, 33]);
		});
	});

	describe('lookalikes that are not debugger statements (Boundaries)', () => {
		it('ignores the word inside a string literal', () => {
			expect(scaffoldLevel.validate(parseFacts('"debugger";'))).toEqual([]);
		});

		it('ignores the word inside a comment', () => {
			expect(scaffoldLevel.validate(parseFacts('// debugger'))).toEqual([]);
		});

		it('ignores a program with only other statements', () => {
			expect(scaffoldLevel.validate(parseFacts('const x = 1;'))).toEqual([]);
		});
	});

	describe('nested debugger statements (Boundaries)', () => {
		it('finds a braceless single-statement consequent', () => {
			expect(
				scaffoldLevel.validate(parseFacts('if (true) debugger;'))[0]?.nodePath,
			).toBe('$.body.0.consequent');
		});

		it('finds a block-nested statement', () => {
			expect(
				scaffoldLevel.validate(parseFacts('{\n\tdebugger;\n}'))[0]?.nodePath,
			).toBe('$.body.0.body.0');
		});
	});

	describe('frozen output (Interfaces)', () => {
		it('freezes the violations array', () => {
			expect(
				Object.isFrozen(scaffoldLevel.validate(parseFacts('debugger;'))),
			).toBe(true);
		});

		it('freezes each violation', () => {
			expect(
				Object.isFrozen(scaffoldLevel.validate(parseFacts('debugger;'))[0]),
			).toBe(true);
		});

		it('freezes each violation location', () => {
			expect(
				Object.isFrozen(
					scaffoldLevel.validate(parseFacts('debugger;'))[0]?.location,
				),
			).toBe(true);
		});
	});

	describe('the spine (Interfaces)', () => {
		it('keys the level scaffold', () => {
			expect(scaffoldLevel.key).toBe('scaffold');
		});

		it('admits modules only', () => {
			expect(scaffoldLevel.snippetTypes).toEqual(['module']);
		});

		it('is frozen', () => {
			expect(Object.isFrozen(scaffoldLevel)).toBe(true);
		});

		it('freezes the admitted types', () => {
			expect(Object.isFrozen(scaffoldLevel.snippetTypes)).toBe(true);
		});

		it('answers the same for the same facts (Simple)', () => {
			expect(scaffoldLevel.validate(parseFacts('debugger;'))).toEqual(
				scaffoldLevel.validate(parseFacts('debugger;')),
			);
		});
	});
});
