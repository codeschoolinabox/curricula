import { describe, expect, it } from 'vitest';

import deriveAst from '../derive-ast.js';

describe('deriveAst', () => {
	describe('success arm', () => {
		it('empty source → a Program with an empty body', () => {
			const stage = deriveAst({ source: '', type: 'script' });
			expect(stage.ok && stage.value.body).toHaveLength(0);
		});

		describe('single statement', () => {
			it('parses to one body node', () => {
				const stage = deriveAst({ source: 'let x = 1', type: 'script' });
				expect(stage.ok && stage.value.body).toHaveLength(1);
			});

			it('holds acorn nodes — a VariableDeclaration', () => {
				const stage = deriveAst({ source: 'let x = 1', type: 'script' });
				expect(stage.ok && stage.value.body[0].type).toBe(
					'VariableDeclaration',
				);
			});

			it('range marks the source span end at 9', () => {
				const stage = deriveAst({ source: 'let x = 1', type: 'script' });
				expect(stage.ok && stage.value.range?.[1]).toBe(9);
			});
		});

		describe('multiple statements', () => {
			it('parses both statements', () => {
				const stage = deriveAst({
					source: 'let a = 1; let b = 2;',
					type: 'script',
				});
				expect(stage.ok && stage.value.body).toHaveLength(2);
			});
		});

		describe('import in a module — the module half of the sourceType pair', () => {
			it('parses to an ImportDeclaration', () => {
				const stage = deriveAst({
					source: "import x from 'y'",
					type: 'module',
				});
				expect(stage.ok && stage.value.body[0].type).toBe('ImportDeclaration');
			});
		});
	});
});
