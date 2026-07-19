import { describe, expect, it } from 'vitest';

import isPlainObject from '@utils/is-plain-object.js';

import deriveAst from '../derive-ast.js';
import deriveEnvironment from '../derive-environment.js';
import deriveTokens from '../derive-tokens.js';

describe('deriveEnvironment', () => {
	describe('success arm', () => {
		describe('empty script', () => {
			it('the root is the global scope', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.type).toBe('global');
			});

			it('the root upper is null', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.upper).toBe(null);
			});

			it('a script has only the global scope', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.childScopes).toHaveLength(
					0,
				);
			});

			it('no names are born', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.variables).toHaveLength(0);
			});

			it('no references are made', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.references).toHaveLength(
					0,
				);
			});

			it('nothing resolves through', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.through).toHaveLength(0);
			});

			it('the script global is not strict', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.isStrict).toBe(false);
			});

			it('byPath is empty', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(
					stage && stage.ok && Object.keys(stage.value.byPath),
				).toHaveLength(0);
			});
		});

		describe('empty module', () => {
			it('a module adds its own scope', () => {
				const snippet = { source: '', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.childScopes).toHaveLength(
					1,
				);
			});

			it('the added scope is the module scope', () => {
				const snippet = { source: '', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.childScopes[0]?.type).toBe(
					'module',
				);
			});

			it('the module scope is strict', () => {
				const snippet = { source: '', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.variables).toHaveLength(1);
			});

			it('the name is l', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.variables[0]?.name).toBe(
					'l',
				);
			});

			it('one identifier introduces it', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.identifiers,
				).toHaveLength(1);
			});

			it('one definition introduces it', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.defs,
				).toHaveLength(1);
			});

			it('the definition kind is Variable', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.defs[0]?.type,
				).toBe('Variable');
			});

			it('the definition holds the very identifier the parse built', () => {
				const snippet = { source: 'let l = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(
					stage && stage.ok && stage.value.root.variables[0]?.references,
				).toHaveLength(0);
			});

			it('both uses resolve through to nothing', () => {
				const snippet = { source: 'var v = 1; v;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.through).toHaveLength(2);
			});

			it('the first through-use resolves to null', () => {
				const snippet = { source: 'var v = 1; v;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.through[0]?.resolved).toBe(
					null,
				);
			});

			it('the second through-use resolves to null', () => {
				const snippet = { source: 'var v = 1; v;', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && stage.value.root.through).toHaveLength(0);
			});

			it('the scope and the variable share the very same reference — never copies', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(stage && stage.ok && isPlainObject(stage.value.root)).toBe(true);
			});

			it('a variable is a plain object', () => {
				const snippet = { source: 'var v = 1; v;', type: 'module' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
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
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				const variables = stage && stage.ok && stage.value.root.variables;
				expect(
					variables &&
						variables.find((variable) => variable.name === 'v')?.references,
				).toHaveLength(0);
			});
		});

		describe('an undeclared name', () => {
			it('its reference resolves to null', () => {
				const snippet = { source: 'foo()', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage = ast.ok && deriveEnvironment(snippet.type, ast.value);
				expect(
					stage && stage.ok && stage.value.root.references[0]?.resolved,
				).toBe(null);
			});
		});
	});
});
