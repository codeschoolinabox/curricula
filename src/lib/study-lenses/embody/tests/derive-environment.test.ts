import type { Program } from 'acorn';
import { afterEach, describe, expect, it, vi } from 'vitest';

import isPlainObject from '@utils/is-plain-object.js';

import deriveAst from '../derive-ast.js';
import deriveEntwined from '../derive-entwined.js';
import deriveEnvironment from '../derive-environment.js';
import deriveTokens from '../derive-tokens.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('deriveEnvironment', () => {
	describe('success arm', () => {
		describe('empty script', () => {
			it('the root is the global scope', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.type).toBe('global');
			});

			it('the root upper is null', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.upper).toBe(null);
			});

			it('a script has only the global scope', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.childScopes).toHaveLength(
					0,
				);
			});

			it('no names are born', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.variables).toHaveLength(0);
			});

			it('no references are made', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.references).toHaveLength(
					0,
				);
			});

			it('nothing resolves through', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.through).toHaveLength(0);
			});

			it('the script global is not strict', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.isStrict).toBe(false);
			});

			it("a script's $ resolves to the global scope", () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(environment && environment.byPath.$ === environment.root).toBe(
					true,
				);
			});
		});

		describe('empty module', () => {
			it('a module adds its own scope', () => {
				const snippet = { source: '', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.childScopes).toHaveLength(
					1,
				);
			});

			it('the added scope is the module scope', () => {
				const snippet = { source: '', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.childScopes[0]?.type).toBe(
					'module',
				);
			});

			it('the module scope is strict', () => {
				const snippet = { source: '', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.childScopes[0]?.isStrict,
				).toBe(true);
			});
		});

		describe('one declaration', () => {
			it('the global scope declares the name', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.variables).toHaveLength(1);
			});

			it('the name is l', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.variables[0]?.name).toBe(
					'l',
				);
			});

			it('one identifier introduces it', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.identifiers,
				).toHaveLength(1);
			});

			it('one definition introduces it', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.defs,
				).toHaveLength(1);
			});

			it('the definition type is Variable', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.defs[0]?.type,
				).toBe('Variable');
			});

			it('the definition holds the very identifier the parse built', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				const declaration = ast.ok && ast.value.body[0];
				expect(
					environment &&
						declaration &&
						declaration.type === 'VariableDeclaration' &&
						environment.root.variables[0]?.defs[0]?.name ===
							declaration.declarations[0].id,
				).toBe(true);
			});
		});

		describe('nested scopes', () => {
			it('a function opens a child scope', () => {
				const snippet = {
					source: 'function f(a) { let b; }',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.childScopes[0]?.type).toBe(
					'function',
				);
			});

			it('the function scope declares arguments, the parameter, and the local', () => {
				const snippet = {
					source: 'function f(a) { let b; }',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage &&
						stage.ok &&
						stage.value.root.childScopes[0]?.variables.map(
							(variable) => variable.name,
						),
				).toEqual(['arguments', 'a', 'b']);
			});

			it('a grandchild scope opens at depth two', () => {
				const snippet = {
					source: 'function f() { function g() { let x; } }',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage &&
						stage.ok &&
						stage.value.root.childScopes[0]?.childScopes[0]?.type,
				).toBe('function');
			});

			it('the grandchild wires upward to its own parent — one graph at depth two', () => {
				const snippet = {
					source: 'function f() { function g() { let x; } }',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					environment &&
						environment.root.childScopes[0]?.childScopes[0]?.upper ===
							environment.root.childScopes[0],
				).toBe(true);
			});
		});

		describe('the var record split — script', () => {
			it('the declared var collects no references', () => {
				const snippet = { source: 'var v = 1; v;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.references,
				).toHaveLength(0);
			});

			it('both uses resolve through to nothing', () => {
				const snippet = { source: 'var v = 1; v;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.through).toHaveLength(2);
			});

			it('the first through-use resolves to null', () => {
				const snippet = { source: 'var v = 1; v;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.through[0]?.resolved).toBe(
					null,
				);
			});

			it('the second through-use resolves to null', () => {
				const snippet = { source: 'var v = 1; v;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.through[1]?.resolved).toBe(
					null,
				);
			});
		});

		describe('the var record split — module', () => {
			it('the module-declared var collects both references', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage &&
						stage.ok &&
						stage.value.root.childScopes[0]?.variables[0]?.references,
				).toHaveLength(2);
			});

			it('nothing resolves through', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.root.through).toHaveLength(0);
			});

			it('the scope and the variable share the very same reference — never copies', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const moduleScope =
					stage && stage.ok && stage.value.root.childScopes[0];
				expect(
					moduleScope &&
						moduleScope.references[1] ===
							moduleScope.variables[0]?.references[1],
				).toBe(true);
			});
		});

		describe('one shared graph', () => {
			it('a child wires upward to the root', () => {
				const snippet = { source: '', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					environment &&
						environment.root.childScopes[0]?.upper === environment.root,
				).toBe(true);
			});

			it('an outer variable and the inner scope share the very same reference', () => {
				const snippet = {
					source: 'let g = 1; function f() { g; }',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				const outer =
					environment &&
					environment.root.variables.find((variable) => variable.name === 'g');
				expect(
					environment &&
						outer &&
						outer.references[1] === environment.root.childScopes[0]?.through[0],
				).toBe(true);
			});

			it("a reference's variable holds that very reference back", () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const variable =
					stage && stage.ok && stage.value.root.childScopes[0]?.variables[0];
				expect(variable && variable.references[0]?.resolved === variable).toBe(
					true,
				);
			});
		});

		describe('node identity', () => {
			it('the root scope holds the very tree the parse built', () => {
				const snippet = {
					source: 'function f(a) { let b; }',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					ast.ok && environment && environment.root.block === ast.value,
				).toBe(true);
			});

			it('a child scope holds the very function node the parse built', () => {
				const snippet = {
					source: 'function f(a) { let b; }',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					ast.ok &&
						environment &&
						environment.root.childScopes[0]?.block === ast.value.body[0],
				).toBe(true);
			});
		});

		describe('projection, not alias', () => {
			it('the root scope is a plain object', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && isPlainObject(stage.value.root)).toBe(true);
			});

			it('a variable is a plain object', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage &&
						stage.ok &&
						isPlainObject(stage.value.root.childScopes[0]?.variables[0]),
				).toBe(true);
			});

			it('a reference is a plain object', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage &&
						stage.ok &&
						isPlainObject(stage.value.root.childScopes[0]?.references[0]),
				).toBe(true);
			});

			it('a definition is a plain object', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage &&
						stage.ok &&
						isPlainObject(
							stage.value.root.childScopes[0]?.variables[0]?.defs[0],
						),
				).toBe(true);
			});
		});

		describe('the honest default', () => {
			it('the let name collects both its references', () => {
				const snippet = {
					source: 'var v = 1; let l = 2; v; l;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const variables = stage && stage.ok && stage.value.root.variables;
				expect(
					variables &&
						variables.find((variable) => variable.name === 'l')?.references,
				).toHaveLength(2);
			});

			it('the var name still collects none', () => {
				const snippet = {
					source: 'var v = 1; let l = 2; v; l;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const variables = stage && stage.ok && stage.value.root.variables;
				expect(
					variables &&
						variables.find((variable) => variable.name === 'v')?.references,
				).toHaveLength(0);
			});
		});

		describe('reference access and init', () => {
			it('a read-only use is access read, init false', () => {
				const snippet = { source: 'let l = 1; l;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const read =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'read',
					);
				expect(read && read.access === 'read' && read.init === false).toBe(
					true,
				);
			});

			it('an initializer is access write, init true', () => {
				const snippet = { source: 'let l = 1; l;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const init =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.init,
					);
				expect(init && init.access === 'write' && init.init === true).toBe(
					true,
				);
			});

			it('a plain reassignment is access write, init false', () => {
				const snippet = {
					source: 'let l = 1; l = 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const write =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'write' && !reference.init,
					);
				expect(write && write.access === 'write' && write.init === false).toBe(
					true,
				);
			});

			it('an update is access readwrite, init false', () => {
				const snippet = { source: 'let l = 1; l++;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const update =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'readwrite',
					);
				expect(
					update && update.access === 'readwrite' && update.init === false,
				).toBe(true);
			});

			it('a compound assignment is access readwrite', () => {
				const snippet = {
					source: 'let l = 1; l += 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const compound =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'readwrite',
					);
				expect(compound && compound.access === 'readwrite').toBe(true);
			});

			it('through references carry access and init too', () => {
				const snippet = { source: 'var v = 1; v;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const through = stage && stage.ok && stage.value.root.through;
				const write =
					through && through.find((reference) => reference.access === 'write');
				const read =
					through && through.find((reference) => reference.access === 'read');
				expect(
					write && read && write.init === true && read.init === false,
				).toBe(true);
			});
		});

		describe('the written expression', () => {
			it('a plain write carries the right-hand-side node', () => {
				const snippet = {
					source: 'let l = 1; l = 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const write =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'write' && !reference.init,
					);
				const statement = ast.ok && ast.value.body[1];
				const rhs =
					statement &&
					statement.type === 'ExpressionStatement' &&
					statement.expression.type === 'AssignmentExpression' &&
					statement.expression.right;
				expect(write && rhs && write.writeExpr === rhs).toBe(true);
			});

			it('an update writes with no right-hand side — writeExpr is null but present', () => {
				const snippet = { source: 'let l = 1; l++;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const update =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'readwrite',
					);
				expect(
					update && 'writeExpr' in update && update.writeExpr === null,
				).toBe(true);
			});

			it('a read has no writeExpr property at all', () => {
				const snippet = { source: 'let l = 1; l;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const read =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'read',
					);
				expect(read && !('writeExpr' in read)).toBe(true);
			});

			it('a compound assignment carries its right-hand-side node', () => {
				const snippet = {
					source: 'let l = 1; l += 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const compound =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'readwrite',
					);
				const statement = ast.ok && ast.value.body[1];
				const rhs =
					statement &&
					statement.type === 'ExpressionStatement' &&
					statement.expression.type === 'AssignmentExpression' &&
					statement.expression.right;
				expect(compound && rhs && compound.writeExpr === rhs).toBe(true);
			});
		});

		describe('definition kind, parent, and index', () => {
			it('a let declaration carries kind let', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.defs[0]?.kind,
				).toBe('let');
			});

			it('a const declaration carries kind const', () => {
				const snippet = { source: 'const c = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.defs[0]?.kind,
				).toBe('const');
			});

			it('a var declaration carries kind var', () => {
				const snippet = { source: 'var v = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.defs[0]?.kind,
				).toBe('var');
			});

			it('a declaration parent is its declaration statement', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					ast.ok &&
						environment &&
						environment.root.variables[0]?.defs[0]?.parent ===
							ast.value.body[0],
				).toBe(true);
			});

			it('the first declarator has index 0 — not coerced to null', () => {
				const snippet = { source: 'let a = 1, b = 2', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const first =
					stage &&
					stage.ok &&
					stage.value.root.variables.find((variable) => variable.name === 'a');
				expect(first && first.defs[0]?.index === 0).toBe(true);
			});

			it('the second declarator has index 1', () => {
				const snippet = { source: 'let a = 1, b = 2', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const second =
					stage &&
					stage.ok &&
					stage.value.root.variables.find((variable) => variable.name === 'b');
				expect(second && second.defs[0]?.index === 1).toBe(true);
			});

			it('a parameter carries no kind, null parent, and index 0', () => {
				const snippet = { source: 'function f(a) {}', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const parameter =
					stage &&
					stage.ok &&
					stage.value.root.childScopes[0]?.variables.find(
						(variable) => variable.name === 'a',
					);
				const definition = parameter && parameter.defs[0];
				expect(
					definition &&
						!('kind' in definition) &&
						definition.parent === null &&
						definition.index === 0,
				).toBe(true);
			});

			it('a function name carries no kind, null parent, null index', () => {
				const snippet = { source: 'function f() {}', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const functionName =
					stage &&
					stage.ok &&
					stage.value.root.variables.find((variable) => variable.name === 'f');
				const definition = functionName && functionName.defs[0];
				expect(
					definition &&
						!('kind' in definition) &&
						definition.parent === null &&
						definition.index === null,
				).toBe(true);
			});

			it('an import binding carries no kind and its declaration as parent', () => {
				const snippet = {
					source: "import x from 'y';",
					type: 'module',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const binding =
					stage &&
					stage.ok &&
					stage.value.root.childScopes[0]?.variables.find(
						(variable) => variable.name === 'x',
					);
				const definition = binding && binding.defs[0];
				const importDeclaration = ast.ok && ast.value.body[0];
				expect(
					definition &&
						!('kind' in definition) &&
						definition.parent === importDeclaration &&
						definition.index === null,
				).toBe(true);
			});

			it('the outer class name carries no kind property', () => {
				const snippet = { source: 'class C {}', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const outer =
					stage &&
					stage.ok &&
					stage.value.root.variables.find((variable) => variable.name === 'C');
				const definition = outer && outer.defs[0];
				expect(definition && !('kind' in definition)).toBe(true);
			});

			it('the inner class binding carries no kind either — the undefined source', () => {
				const snippet = { source: 'class C {}', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const classScope =
					stage &&
					stage.ok &&
					stage.value.root.childScopes.find((scope) => scope.type === 'class');
				const inner =
					classScope &&
					classScope.variables.find((variable) => variable.name === 'C');
				const definition = inner && inner.defs[0];
				expect(
					definition &&
						!('kind' in definition) &&
						definition.parent === null &&
						definition.index === null,
				).toBe(true);
			});

			it('a catch parameter carries no kind and null parent', () => {
				const snippet = {
					source: 'try {} catch (e) {}',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const catchScope =
					stage &&
					stage.ok &&
					stage.value.root.childScopes.find((scope) => scope.type === 'catch');
				const caught =
					catchScope &&
					catchScope.variables.find((variable) => variable.name === 'e');
				const definition = caught && caught.defs[0];
				expect(
					definition &&
						!('kind' in definition) &&
						definition.parent === null &&
						definition.index === null,
				).toBe(true);
			});
		});

		describe('the entwined cross-link', () => {
			it('a reference path resolves through the entwined graph to its identifier', () => {
				const snippet = { source: 'let l = 1; l;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const read =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'read',
					);
				expect(
					entwined.ok &&
						read &&
						read.path !== undefined &&
						entwined.value.byPath[read.path]?.node === read.identifier,
				).toBe(true);
			});

			it('a definition path resolves through the entwined graph to its name', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const definition =
					stage && stage.ok && stage.value.root.variables[0]?.defs[0];
				expect(
					entwined.ok &&
						definition &&
						definition.path !== undefined &&
						entwined.value.byPath[definition.path]?.node === definition.name,
				).toBe(true);
			});
		});

		describe('usedBeforeBound (derived)', () => {
			it('a self-referential initializer flags the right-hand-side read', () => {
				const snippet = { source: 'let x = x', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const read =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'read',
					);
				expect(read && read.usedBeforeBound === true).toBe(true);
			});

			it('the initializer write itself is never flagged', () => {
				const snippet = { source: 'let x = x', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const init =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.init,
					);
				expect(init && init.usedBeforeBound === false).toBe(true);
			});

			it('a use positioned before the declaration is flagged', () => {
				const snippet = { source: 'x; let x = 1;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const read =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'read',
					);
				expect(read && read.usedBeforeBound === true).toBe(true);
			});

			it('a later declarator reading an earlier binding is not flagged', () => {
				const snippet = {
					source: 'let a = 1, c = a;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const a =
					stage &&
					stage.ok &&
					stage.value.root.variables.find((variable) => variable.name === 'a');
				const read =
					a && a.references.find((reference) => reference.access === 'read');
				expect(read && read.usedBeforeBound === false).toBe(true);
			});

			it('a resolved var use before its declaration is not flagged — no dead zone', () => {
				const snippet = { source: 'v; var v = 1;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const v =
					stage &&
					stage.ok &&
					stage.value.root.childScopes[0]?.variables.find(
						(variable) => variable.name === 'v',
					);
				const read =
					v && v.references.find((reference) => reference.access === 'read');
				expect(read && read.usedBeforeBound === false).toBe(true);
			});

			it('a closure use after the declaration is still flagged — the deliberate over-approximation', () => {
				const snippet = {
					source: 'function f() { return x; } let x = 1;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const x =
					stage &&
					stage.ok &&
					stage.value.root.variables.find((variable) => variable.name === 'x');
				const read =
					x && x.references.find((reference) => reference.access === 'read');
				expect(read && read.usedBeforeBound === true).toBe(true);
			});

			it('a read after the declaration is not flagged', () => {
				const snippet = { source: 'let x = 1; x;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const read =
					stage &&
					stage.ok &&
					stage.value.root.variables[0]?.references.find(
						(reference) => reference.access === 'read',
					);
				expect(read && read.usedBeforeBound === false).toBe(true);
			});

			it('a hoisted function called before its declaration is not flagged', () => {
				const snippet = {
					source: 'f(); function f() {}',
					type: 'module',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const functionName =
					stage &&
					stage.ok &&
					stage.value.root.childScopes[0]?.variables.find(
						(variable) => variable.name === 'f',
					);
				const read =
					functionName &&
					functionName.references.find(
						(reference) => reference.access === 'read',
					);
				expect(read && read.usedBeforeBound === false).toBe(true);
			});

			it('a class used before its binding is not flagged — the heuristic covers let and const only', () => {
				// classes DO have a real temporal dead zone, but usedBeforeBound keys
				// on kind (let/const), which a class binding never carries — a known,
				// deliberate gap pinned here rather than left silent
				const snippet = {
					source: 'new C(); class C {}',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const cls =
					stage &&
					stage.ok &&
					stage.value.root.variables.find((variable) => variable.name === 'C');
				const read =
					cls &&
					cls.references.find((reference) => reference.access === 'read');
				expect(read && read.usedBeforeBound === false).toBe(true);
			});

			it('an unresolved reference is never flagged — no binding to precede', () => {
				const snippet = { source: 'foo; let x = 1;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const unresolved =
					stage &&
					stage.ok &&
					stage.value.root.references.find(
						(reference) => reference.resolved === null,
					);
				expect(unresolved && unresolved.usedBeforeBound === false).toBe(true);
			});
		});

		describe('byPath', () => {
			it("a function scope indexes under its declaration's path", () => {
				const snippet = { source: 'function f(){}', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					environment &&
						environment.byPath['$.body.0'] === environment.root.childScopes[0],
				).toBe(true);
			});

			it('sibling scopes index under their own paths — the first', () => {
				const snippet = {
					source: 'function f(){} function g(){}',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					environment &&
						environment.byPath['$.body.0'] === environment.root.childScopes[0],
				).toBe(true);
			});

			it('sibling scopes index under their own paths — the second', () => {
				const snippet = {
					source: 'function f(){} function g(){}',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					environment &&
						environment.byPath['$.body.1'] === environment.root.childScopes[1],
				).toBe(true);
			});

			it('a grandchild scope indexes at depth two', () => {
				const snippet = {
					source: 'function f() { function g() { let x; } }',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					environment &&
						environment.byPath['$.body.0.body.body.0'] ===
							environment.root.childScopes[0]?.childScopes[0],
				).toBe(true);
			});

			it('a block scope indexes too', () => {
				const snippet = { source: '{ let x; }', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage && stage.ok && stage.value.byPath['$.body.0']?.type).toBe(
					'block',
				);
			});

			it('a shared program node keeps exactly one key', () => {
				const snippet = { source: 'function f() {}', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage &&
						stage.ok &&
						Object.keys(stage.value.byPath).toSorted((first, second) =>
							first.localeCompare(second),
						),
				).toEqual(['$', '$.body.0']);
			});

			it("a module's function indexes inside the module scope", () => {
				const snippet = { source: 'function f() {}', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					environment &&
						environment.byPath['$.body.0'] ===
							environment.root.childScopes[0]?.childScopes[0],
				).toBe(true);
			});

			it("a module's $ resolves to the innermost program scope, not the global", () => {
				const snippet = { source: '', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				const environment = stage && stage.ok && stage.value;
				expect(
					environment &&
						environment.byPath.$ === environment.root.childScopes[0],
				).toBe(true);
			});
		});

		describe('an undeclared name', () => {
			it('its reference resolves to null', () => {
				const snippet = { source: 'foo()', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(
					stage && stage.ok && stage.value.root.references[0]?.resolved,
				).toBe(null);
			});
		});
	});

	describe('failure arm', () => {
		describe('a failed upstream stage short-circuits', () => {
			it('carries the ast cause by identity — a rebuilt equal cause must not pass', () => {
				const snippet = { source: 'const', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(!ast.ok && !stage.ok && stage.cause === ast.cause).toBe(true);
			});

			it('carries a tokens-origin cause by identity', () => {
				const snippet = { source: '01', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(!tokens.ok && !stage.ok && stage.cause === tokens.cause).toBe(
					true,
				);
			});

			it("the entwined guard fires independently of ast's success", () => {
				const cause = {
					stage: 'entwined',
					message: 'sentinel — no derivation says this',
				} as const;
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = deriveEnvironment(snippet.type, ast, {
					ok: false,
					cause,
				});
				expect(!stage.ok && stage.cause === cause).toBe(true);
			});

			it('the ast guard checks first — two distinct fabricated failures', () => {
				const astCause = {
					stage: 'ast',
					message: 'sentinel A',
				} as const;
				const entwinedCause = {
					stage: 'entwined',
					message: 'sentinel B',
				} as const;
				const stage = deriveEnvironment(
					'script',
					{ ok: false, cause: astCause },
					{ ok: false, cause: entwinedCause },
				);
				expect(!stage.ok && stage.cause === astCause).toBe(true);
			});

			it('the carried envelope is fresh — never the upstream stage itself', () => {
				const snippet = { source: 'const', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(snippet.type, ast, entwined);
				expect(stage !== ast).toBe(true);
			});

			it('reports nothing to console.error when carrying an ast failure', () => {
				const errorSpy = vi
					.spyOn(console, 'error')
					.mockImplementation(() => {});
				const snippet = { source: 'const', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				deriveEnvironment(snippet.type, ast, entwined);
				expect(errorSpy).toHaveBeenCalledTimes(0);
			});

			it('reports nothing to console.warn when carrying an ast failure', () => {
				const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
				const snippet = { source: 'const', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				deriveEnvironment(snippet.type, ast, entwined);
				expect(warnSpy).toHaveBeenCalledTimes(0);
			});

			it('reports nothing to console.error when carrying a tokens failure', () => {
				const errorSpy = vi
					.spyOn(console, 'error')
					.mockImplementation(() => {});
				const snippet = { source: '01', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				deriveEnvironment(snippet.type, ast, entwined);
				expect(errorSpy).toHaveBeenCalledTimes(0);
			});

			it('reports nothing to console.warn when carrying a tokens failure', () => {
				const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
				const snippet = { source: '01', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				deriveEnvironment(snippet.type, ast, entwined);
				expect(warnSpy).toHaveBeenCalledTimes(0);
			});

			it('reports nothing to console.error when carrying an entwined failure', () => {
				const errorSpy = vi
					.spyOn(console, 'error')
					.mockImplementation(() => {});
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				deriveEnvironment(snippet.type, ast, {
					ok: false,
					cause: { stage: 'entwined', message: 'sentinel' },
				});
				expect(errorSpy).toHaveBeenCalledTimes(0);
			});

			it('reports nothing to console.warn when carrying an entwined failure', () => {
				const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				deriveEnvironment(snippet.type, ast, {
					ok: false,
					cause: { stage: 'entwined', message: 'sentinel' },
				});
				expect(warnSpy).toHaveBeenCalledTimes(0);
			});
		});

		describe('an analysis throw is an embody defect', () => {
			it('originates an environment cause', () => {
				vi.spyOn(console, 'error').mockImplementation(() => {});
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(
					snippet.type,
					{ ok: true, value: null as unknown as Program },
					entwined,
				);
				expect(!stage.ok && stage.cause.stage).toBe('environment');
			});

			it('the defect is loud — reported once', () => {
				const errorSpy = vi
					.spyOn(console, 'error')
					.mockImplementation(() => {});
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				deriveEnvironment(
					snippet.type,
					{ ok: true, value: null as unknown as Program },
					entwined,
				);
				expect(errorSpy).toHaveBeenCalledTimes(1);
			});

			it('the report names the deriver', () => {
				const errorSpy = vi
					.spyOn(console, 'error')
					.mockImplementation(() => {});
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				deriveEnvironment(
					snippet.type,
					{ ok: true, value: null as unknown as Program },
					entwined,
				);
				expect(errorSpy).toHaveBeenCalledWith(
					expect.stringContaining('deriveEnvironment'),
				);
			});

			it('the cause carries a message', () => {
				vi.spyOn(console, 'error').mockImplementation(() => {});
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(
					snippet.type,
					{ ok: true, value: null as unknown as Program },
					entwined,
				);
				expect(!stage.ok && stage.cause.message.length > 0).toBe(true);
			});

			it('the cause carries no offset', () => {
				vi.spyOn(console, 'error').mockImplementation(() => {});
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(
					snippet.type,
					{ ok: true, value: null as unknown as Program },
					entwined,
				);
				expect(!stage.ok && 'offset' in stage.cause).toBe(false);
			});

			it('the cause carries no position', () => {
				vi.spyOn(console, 'error').mockImplementation(() => {});
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const entwined = deriveEntwined(snippet.source, tokens, ast);
				const stage = deriveEnvironment(
					snippet.type,
					{ ok: true, value: null as unknown as Program },
					entwined,
				);
				expect(!stage.ok && 'position' in stage.cause).toBe(false);
			});
		});
	});
});
